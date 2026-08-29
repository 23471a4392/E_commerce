"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getTrendingProducts = exports.getFeaturedProducts = exports.getProductBySlug = exports.getProducts = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const getProducts = async (req, res) => {
    const query = {
        search: req.query.search,
        categorySlug: req.query.category,
        brandSlugs: req.query.brands ? req.query.brands.split(',') : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        rating: req.query.rating ? parseFloat(req.query.rating) : undefined,
        inStockOnly: req.query.inStock === 'true',
        sortBy: req.query.sortBy || 'featured',
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 12,
    };
    const result = database_1.db.queryProducts(query);
    return res.json({ success: true, data: result });
};
exports.getProducts = getProducts;
const getProductBySlug = async (req, res) => {
    const { slug } = req.params;
    const product = database_1.db.getProductBySlug(slug);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: product });
};
exports.getProductBySlug = getProductBySlug;
const getFeaturedProducts = async (_req, res) => {
    const all = database_1.db.getAllProducts();
    const featured = all.filter((p) => p.isFeatured).slice(0, 8);
    return res.json({ success: true, data: featured });
};
exports.getFeaturedProducts = getFeaturedProducts;
const getTrendingProducts = async (_req, res) => {
    const all = database_1.db.getAllProducts();
    const trending = all.filter((p) => p.isTrending || p.isFlashDeal).slice(0, 8);
    return res.json({ success: true, data: trending });
};
exports.getTrendingProducts = getTrendingProducts;
const createProduct = async (req, res) => {
    const body = req.body;
    if (!body.title || !body.basePrice || !body.categoryId) {
        return res.status(400).json({ success: false, message: 'Title, basePrice and categoryId are required' });
    }
    const category = database_1.db.getCategories().find((c) => c.id === body.categoryId);
    const brand = database_1.db.getBrands().find((b) => b.id === body.brandId);
    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newProduct = {
        id: `prod-${(0, uuid_1.v4)()}`,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        title: body.title,
        subtitle: body.subtitle || '',
        description: body.description || '',
        basePrice: Number(body.basePrice),
        compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
        discountPercentage: body.compareAtPrice
            ? Math.round(((Number(body.compareAtPrice) - Number(body.basePrice)) / Number(body.compareAtPrice)) * 100)
            : undefined,
        categoryId: body.categoryId,
        categoryName: category ? category.name : 'General',
        brandId: body.brandId || 'b-quantum',
        brandName: brand ? brand.name : 'Quantum Tech',
        images: body.images || ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
        thumbnail: body.thumbnail || body.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        rating: 5.0,
        reviewCount: 0,
        inStock: true,
        stockQuantity: Number(body.stockQuantity || 50),
        isFeatured: Boolean(body.isFeatured),
        isTrending: Boolean(body.isTrending),
        isFlashDeal: Boolean(body.isFlashDeal),
        tags: body.tags || [],
        variants: body.variants || [],
        attributes: body.attributes || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const created = database_1.db.createProduct(newProduct);
    return res.status(201).json({ success: true, data: created });
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const updated = database_1.db.updateProduct(id, req.body);
    if (!updated) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: updated });
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const deleted = database_1.db.deleteProduct(id);
    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, message: 'Product deleted successfully' });
};
exports.deleteProduct = deleteProduct;
