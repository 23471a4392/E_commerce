import { describe, it, expect } from "vitest";
import { tokenize, scoreDocument, searchCatalog, autocompleteSuggestions } from "../shared/utils/searchEngine";

const sampleDocs = [
  { id: "1", title: "Wireless Headphones", description: "Premium noise cancelling headphones", brand: "Sony", category: "electronics", tags: ["audio", "wireless"], price: 199, rating: 4.5, reviewCount: 120, inStock: true, createdAt: "2024-01-01" },
  { id: "2", title: "Running Shoes", description: "Lightweight running shoes for marathon", brand: "Nike", category: "fashion", tags: ["shoes", "sport"], price: 129, rating: 4.8, reviewCount: 300, inStock: true, createdAt: "2024-02-01" },
  { id: "3", title: "Coffee Maker", description: "Automatic drip coffee machine", brand: "Breville", category: "home", tags: ["kitchen", "appliance"], price: 89, rating: 4.2, reviewCount: 50, inStock: false, createdAt: "2024-03-01" },
];

describe("Search Engine", () => {
  it("tokenizes text", () => {
    const tokens = tokenize("The Wireless Headphones are great");
    expect(tokens).toContain("wireless");
    expect(tokens).toContain("headphones");
    expect(tokens).not.toContain("the");
  });

  it("scores documents", () => {
    const score = scoreDocument(sampleDocs[0], ["wireless", "headphones"]);
    expect(score).toBeGreaterThan(0);
  });

  it("searches catalog", () => {
    const result = searchCatalog(sampleDocs, { q: "headphones" });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.documents[0].title).toContain("Headphones");
  });

  it("filters by category", () => {
    const result = searchCatalog(sampleDocs, { categories: ["fashion"] });
    expect(result.documents.every(d => d.category === "fashion")).toBe(true);
  });

  it("provides autocomplete", () => {
    const suggestions = autocompleteSuggestions(sampleDocs, "wir");
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
