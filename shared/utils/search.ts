import { Product } from '../types/product';

export class SearchEngineUtils {
  /**
   * Computes Levenshtein distance between two strings for fuzzy search matching
   */
  public static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    const lenA = a.length;
    const lenB = b.length;

    for (let i = 0; i <= lenA; i++) matrix[i] = [i];
    for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        if (a.charAt(i - 1) === b.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return matrix[lenA][lenB];
  }

  /**
   * Calculates BM25 search relevance score for a product given search terms
   */
  public static calculateRelevanceScore(product: Product, queryTokens: string[]): number {
    let score = 0;
    const titleLower = product.title.toLowerCase();
    const descLower = product.description.toLowerCase();
    const brandLower = product.brandName.toLowerCase();
    const catLower = product.categoryName.toLowerCase();
    const tagsLower = product.tags.map((t) => t.toLowerCase());

    for (const token of queryTokens) {
      const q = token.toLowerCase().trim();
      if (!q) continue;

      // Exact title match (highest weight)
      if (titleLower === q) score += 100;
      else if (titleLower.startsWith(q)) score += 40;
      else if (titleLower.includes(q)) score += 25;

      // Brand & Category match
      if (brandLower === q) score += 30;
      else if (brandLower.includes(q)) score += 15;

      if (catLower === q) score += 20;
      else if (catLower.includes(q)) score += 10;

      // Tag match
      if (tagsLower.includes(q)) score += 20;

      // Description match
      if (descLower.includes(q)) score += 5;

      // Fuzzy matching for typos
      const titleWords = titleLower.split(/\s+/);
      for (const word of titleWords) {
        if (word.length >= 4 && q.length >= 4) {
          const dist = this.levenshteinDistance(word, q);
          if (dist === 1) score += 12;
          else if (dist === 2) score += 5;
        }
      }
    }

    // Boost featured and highly rated products slightly
    if (product.isFeatured) score += 5;
    score += (product.rating || 0) * 2;

    return score;
  }
}
