"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("../db/database");
const search_1 = require("@shared/utils/search");
class ProductService {
    static getProducts(query) {
        let list = database_1.db.getAllProducts();
        // BM25 / Fuzzy Search relevance scoring
        if (query.search) {
            const q = query.search.trim().toLowerCase();
            const tokens = q.split(/\s+/);
            list = list
                .map((p) => ({
                product: p,
                score: search_1.SearchEngineUtils.calculateRelevanceScore(p, tokens),
            }))
                .filter((item) => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map((item) => item.product);
        }
        // Category Filter
        if (query.categorySlug && query.categorySlug !== 'all') {
            list = list.filter((p) => p.categorySlug === query.categorySlug || p.categoryId === query.categorySlug);
        }
        // Brand Filter
        if (query.brandSlugs && query.brandSlugs.length > 0) {
            list = list.filter((p) => query.brandSlugs.includes(p.brandSlug || p.brandId));
        }
        // Price Filter
        if (query.minPrice !== undefined) {
            list = list.filter((p) => p.basePrice >= query.minPrice);
        }
        if (query.maxPrice !== undefined) {
            list = list.filter((p) => p.basePrice <= query.maxPrice);
        }
        // Rating Filter
        if (query.rating !== undefined && query.rating > 0) {
            list = list.filter((p) => p.rating >= query.rating);
        }
        // Stock Filter
        if (query.inStockOnly) {
            list = list.filter((p) => p.inStock && p.stockQuantity > 0);
        }
        // Sorting (if not searching by score)
        if (!query.search && query.sortBy) {
            switch (query.sortBy) {
                case 'price-asc':
                    list.sort((a, b) => a.basePrice - b.basePrice);
                    break;
                case 'price-desc':
                    list.sort((a, b) => b.basePrice - a.basePrice);
                    break;
                case 'rating':
                    list.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    break;
                case 'featured':
                default:
                    list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
                    break;
            }
        }
        const page = Math.max(1, query.page || 1);
        const limit = Math.max(1, query.limit || 12);
        const total = list.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginated = list.slice(startIndex, startIndex + limit);
        const allPrices = database_1.db.getAllProducts().map((p) => p.basePrice);
        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 2000;
        return {
            products: paginated,
            total,
            page,
            limit,
            totalPages,
            availableCategories: database_1.db.getCategories(),
            availableBrands: database_1.db.getBrands(),
            priceRange: { min: minPrice, max: maxPrice },
        };
    }
    static getProductBySlug(slug) {
        const product = database_1.db.getProductBySlug(slug);
        if (!product) {
            throw new Error(`Product with slug '${slug}' not found.`);
        }
        return product;
    }
}
exports.ProductService = ProductService;
