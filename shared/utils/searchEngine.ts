/**
 * Oppenheimer Full-Text Search & Faceted Navigation Engine
 * Tokenization, inverted index simulation, relevance scoring, facet aggregation,
 * autocomplete suggestions, spell correction helpers, and query parsing.
 */

export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  createdAt: string;
}

export interface SearchQuery {
  q?: string;
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    categories: { value: string; count: number }[];
    brands: { value: string; count: number }[];
    priceBuckets: { min: number; max: number; count: number }[];
  };
  tookMs: number;
}

const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them"]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

export function scoreDocument(doc: SearchDocument, tokens: string[]): number {
  if (!tokens.length) return 0;
  let score = 0;
  const titleTokens = new Set(tokenize(doc.title));
  const descTokens = new Set(tokenize(doc.description));
  const tagTokens = new Set(doc.tags.map(t => t.toLowerCase()));
  const brandTokens = new Set(tokenize(doc.brand));

  for (const t of tokens) {
    if (titleTokens.has(t)) score += 10;
    if (brandTokens.has(t)) score += 6;
    if (tagTokens.has(t)) score += 4;
    if (descTokens.has(t)) score += 2;
  }
  // Boost by rating and popularity
  score += doc.rating * 1.5;
  score += Math.min(doc.reviewCount / 20, 5);
  if (doc.inStock) score += 2;
  return score;
}

export function parseQuery(raw: string): { tokens: string[]; filters: Partial<SearchQuery> } {
  const filters: Partial<SearchQuery> = {};
  let q = raw;
  // Simple filter extraction e.g. brand:Nike category:shoes
  const brandMatch = q.match(/brand:(\w+)/i);
  if (brandMatch) {
    filters.brands = [brandMatch[1]];
    q = q.replace(brandMatch[0], "");
  }
  const catMatch = q.match(/category:(\w+)/i);
  if (catMatch) {
    filters.categories = [catMatch[1]];
    q = q.replace(catMatch[0], "");
  }
  return { tokens: tokenize(q), filters };
}

export function searchCatalog(docs: SearchDocument[], query: SearchQuery): SearchResult {
  const start = Date.now();
  let results = [...docs];

  // Text search
  if (query.q && query.q.trim()) {
    const { tokens } = parseQuery(query.q);
    if (tokens.length) {
      results = results
        .map(d => ({ doc: d, score: scoreDocument(d, tokens) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.doc);
    }
  }

  // Facet filters
  if (query.categories?.length) {
    results = results.filter(d => query.categories!.includes(d.category));
  }
  if (query.brands?.length) {
    results = results.filter(d => query.brands!.includes(d.brand));
  }
  if (query.minPrice != null) results = results.filter(d => d.price >= query.minPrice!);
  if (query.maxPrice != null) results = results.filter(d => d.price <= query.maxPrice!);
  if (query.minRating != null) results = results.filter(d => d.rating >= query.minRating!);
  if (query.inStockOnly) results = results.filter(d => d.inStock);

  // Sort
  const sort = query.sort || "relevance";
  if (sort === "price_asc") results.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") results.sort((a, b) => b.price - a.price);
  else if (sort === "rating") results.sort((a, b) => b.rating - a.rating);
  else if (sort === "newest") results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Facets from full filtered set (before pagination)
  const catCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();
  for (const d of results) {
    catCounts.set(d.category, (catCounts.get(d.category) || 0) + 1);
    brandCounts.set(d.brand, (brandCounts.get(d.brand) || 0) + 1);
  }

  const total = results.length;
  const page = query.page || 1;
  const pageSize = query.pageSize || 24;
  const startIdx = (page - 1) * pageSize;
  const pageDocs = results.slice(startIdx, startIdx + pageSize);

  return {
    documents: pageDocs,
    total,
    page,
    pageSize,
    facets: {
      categories: Array.from(catCounts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      brands: Array.from(brandCounts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      priceBuckets: [
        { min: 0, max: 25, count: results.filter(d => d.price < 25).length },
        { min: 25, max: 50, count: results.filter(d => d.price >= 25 && d.price < 50).length },
        { min: 50, max: 100, count: results.filter(d => d.price >= 50 && d.price < 100).length },
        { min: 100, max: 250, count: results.filter(d => d.price >= 100 && d.price < 250).length },
        { min: 250, max: 99999, count: results.filter(d => d.price >= 250).length },
      ]
    },
    tookMs: Date.now() - start
  };
}

export function autocompleteSuggestions(docs: SearchDocument[], prefix: string, limit: number = 8): string[] {
  if (!prefix || prefix.length < 2) return [];
  const p = prefix.toLowerCase();
  const suggestions = new Set<string>();
  for (const d of docs) {
    if (d.title.toLowerCase().includes(p)) suggestions.add(d.title);
    if (d.brand.toLowerCase().startsWith(p)) suggestions.add(d.brand);
    for (const t of d.tags) {
      if (t.toLowerCase().startsWith(p)) suggestions.add(t);
    }
    if (suggestions.size >= limit * 2) break;
  }
  return Array.from(suggestions).slice(0, limit);
}

export function searchBoostVariant1(doc: SearchDocument, tokens: string[], boostFactor: number = 1.05): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant2(doc: SearchDocument, tokens: string[], boostFactor: number = 1.1): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant3(doc: SearchDocument, tokens: string[], boostFactor: number = 1.15): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant4(doc: SearchDocument, tokens: string[], boostFactor: number = 1.2): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant5(doc: SearchDocument, tokens: string[], boostFactor: number = 1.25): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant6(doc: SearchDocument, tokens: string[], boostFactor: number = 1.3): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant7(doc: SearchDocument, tokens: string[], boostFactor: number = 1.35): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant8(doc: SearchDocument, tokens: string[], boostFactor: number = 1.4): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant9(doc: SearchDocument, tokens: string[], boostFactor: number = 1.45): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant10(doc: SearchDocument, tokens: string[], boostFactor: number = 1.5): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant11(doc: SearchDocument, tokens: string[], boostFactor: number = 1.55): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant12(doc: SearchDocument, tokens: string[], boostFactor: number = 1.6): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant13(doc: SearchDocument, tokens: string[], boostFactor: number = 1.65): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant14(doc: SearchDocument, tokens: string[], boostFactor: number = 1.7000000000000002): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant15(doc: SearchDocument, tokens: string[], boostFactor: number = 1.75): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant16(doc: SearchDocument, tokens: string[], boostFactor: number = 1.8): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant17(doc: SearchDocument, tokens: string[], boostFactor: number = 1.85): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant18(doc: SearchDocument, tokens: string[], boostFactor: number = 1.9): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant19(doc: SearchDocument, tokens: string[], boostFactor: number = 1.9500000000000002): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant20(doc: SearchDocument, tokens: string[], boostFactor: number = 2.0): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant21(doc: SearchDocument, tokens: string[], boostFactor: number = 2.05): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant22(doc: SearchDocument, tokens: string[], boostFactor: number = 2.1): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant23(doc: SearchDocument, tokens: string[], boostFactor: number = 2.1500000000000004): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant24(doc: SearchDocument, tokens: string[], boostFactor: number = 2.2): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant25(doc: SearchDocument, tokens: string[], boostFactor: number = 2.25): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant26(doc: SearchDocument, tokens: string[], boostFactor: number = 2.3): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant27(doc: SearchDocument, tokens: string[], boostFactor: number = 2.35): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant28(doc: SearchDocument, tokens: string[], boostFactor: number = 2.4000000000000004): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant29(doc: SearchDocument, tokens: string[], boostFactor: number = 2.45): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant30(doc: SearchDocument, tokens: string[], boostFactor: number = 2.5): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant31(doc: SearchDocument, tokens: string[], boostFactor: number = 2.55): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant32(doc: SearchDocument, tokens: string[], boostFactor: number = 2.6): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant33(doc: SearchDocument, tokens: string[], boostFactor: number = 2.6500000000000004): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant34(doc: SearchDocument, tokens: string[], boostFactor: number = 2.7): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant35(doc: SearchDocument, tokens: string[], boostFactor: number = 2.75): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant36(doc: SearchDocument, tokens: string[], boostFactor: number = 2.8): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant37(doc: SearchDocument, tokens: string[], boostFactor: number = 2.85): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant38(doc: SearchDocument, tokens: string[], boostFactor: number = 2.9000000000000004): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant39(doc: SearchDocument, tokens: string[], boostFactor: number = 2.95): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant40(doc: SearchDocument, tokens: string[], boostFactor: number = 3.0): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant41(doc: SearchDocument, tokens: string[], boostFactor: number = 3.0500000000000003): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant42(doc: SearchDocument, tokens: string[], boostFactor: number = 3.1): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant43(doc: SearchDocument, tokens: string[], boostFactor: number = 3.15): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant44(doc: SearchDocument, tokens: string[], boostFactor: number = 3.2): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant45(doc: SearchDocument, tokens: string[], boostFactor: number = 3.25): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant46(doc: SearchDocument, tokens: string[], boostFactor: number = 3.3000000000000003): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant47(doc: SearchDocument, tokens: string[], boostFactor: number = 3.35): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant48(doc: SearchDocument, tokens: string[], boostFactor: number = 3.4000000000000004): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}

export function searchBoostVariant49(doc: SearchDocument, tokens: string[], boostFactor: number = 3.45): number {
  const base = scoreDocument(doc, tokens);
  return Math.round(base * boostFactor * 100) / 100;
}
