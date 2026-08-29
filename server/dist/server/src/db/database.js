"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
class InMemoryDatabase {
    products = new Map();
    categories = new Map();
    brands = new Map();
    users = new Map();
    userPasswords = new Map(); // email -> hashed password
    orders = new Map();
    reviews = new Map();
    coupons = new Map();
    constructor() {
        // Initialized empty, populated by seed.ts or lazy init
    }
    // --- PRODUCTS ---
    getAllProducts() {
        return Array.from(this.products.values());
    }
    getProductById(id) {
        return this.products.get(id);
    }
    getProductBySlug(slug) {
        return Array.from(this.products.values()).find((p) => p.slug === slug);
    }
    queryProducts(query) {
        let list = Array.from(this.products.values());
        // Search query matching title, description, tags, brand
        if (query.search) {
            const q = query.search.toLowerCase().trim();
            list = list.filter((p) => p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.brandName.toLowerCase().includes(q) ||
                p.categoryName.toLowerCase().includes(q) ||
                p.tags.some((t) => t.toLowerCase().includes(q)));
        }
        // Category filter
        if (query.categorySlug && query.categorySlug !== 'all') {
            const cat = Array.from(this.categories.values()).find((c) => c.slug === query.categorySlug);
            if (cat) {
                list = list.filter((p) => p.categoryId === cat.id);
            }
        }
        // Brand filter
        if (query.brandSlugs && query.brandSlugs.length > 0) {
            const brandIds = Array.from(this.brands.values())
                .filter((b) => query.brandSlugs.includes(b.slug))
                .map((b) => b.id);
            if (brandIds.length > 0) {
                list = list.filter((p) => brandIds.includes(p.brandId));
            }
        }
        // Price filtering
        if (query.minPrice !== undefined) {
            list = list.filter((p) => p.basePrice >= query.minPrice);
        }
        if (query.maxPrice !== undefined) {
            list = list.filter((p) => p.basePrice <= query.maxPrice);
        }
        // Rating filtering
        if (query.rating !== undefined && query.rating > 0) {
            list = list.filter((p) => p.rating >= query.rating);
        }
        // In Stock filtering
        if (query.inStockOnly) {
            list = list.filter((p) => p.inStock && p.stockQuantity > 0);
        }
        // Sorting
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
        // Price min/max calculation from entire collection
        const allPrices = Array.from(this.products.values()).map((p) => p.basePrice);
        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 1000;
        // Pagination
        const page = Math.max(1, query.page || 1);
        const limit = Math.max(1, query.limit || 12);
        const total = list.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginatedItems = list.slice(startIndex, startIndex + limit);
        return {
            products: paginatedItems,
            total,
            page,
            limit,
            totalPages,
            availableCategories: Array.from(this.categories.values()),
            availableBrands: Array.from(this.brands.values()),
            priceRange: { min: minPrice, max: maxPrice },
        };
    }
    createProduct(product) {
        this.products.set(product.id, product);
        return product;
    }
    updateProduct(id, patch) {
        const existing = this.products.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
        this.products.set(id, updated);
        return updated;
    }
    deleteProduct(id) {
        return this.products.delete(id);
    }
    // --- CATEGORIES & BRANDS ---
    getCategories() {
        return Array.from(this.categories.values());
    }
    createCategory(cat) {
        this.categories.set(cat.id, cat);
        return cat;
    }
    getBrands() {
        return Array.from(this.brands.values());
    }
    createBrand(brand) {
        this.brands.set(brand.id, brand);
        return brand;
    }
    // --- USERS & AUTH ---
    getUserById(id) {
        return this.users.get(id);
    }
    getUserByEmail(email) {
        return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
    }
    createUser(user, passwordHash) {
        this.users.set(user.id, user);
        this.userPasswords.set(user.email.toLowerCase(), passwordHash);
        return user;
    }
    getUserPasswordHash(email) {
        return this.userPasswords.get(email.toLowerCase());
    }
    updateUser(id, patch) {
        const user = this.users.get(id);
        if (!user)
            return undefined;
        const updated = { ...user, ...patch };
        this.users.set(id, updated);
        return updated;
    }
    getAllUsers() {
        return Array.from(this.users.values());
    }
    // --- REVIEWS ---
    getReviewsByProduct(productId) {
        return Array.from(this.reviews.values())
            .filter((r) => r.productId === productId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    addReview(review) {
        this.reviews.set(review.id, review);
        // Recalculate product rating
        const prodReviews = this.getReviewsByProduct(review.productId);
        const avgRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
        this.updateProduct(review.productId, {
            rating: parseFloat(avgRating.toFixed(1)),
            reviewCount: prodReviews.length,
        });
        return review;
    }
    // --- COUPONS ---
    getCoupon(code) {
        return this.coupons.get(code.toUpperCase());
    }
    createCoupon(coupon) {
        this.coupons.set(coupon.code.toUpperCase(), coupon);
        return coupon;
    }
    // --- ORDERS ---
    createOrder(order) {
        this.orders.set(order.id, order);
        // Deduct stock for items
        for (const item of order.items) {
            const product = this.products.get(item.productId);
            if (product) {
                const newStock = Math.max(0, product.stockQuantity - item.quantity);
                this.updateProduct(product.id, {
                    stockQuantity: newStock,
                    inStock: newStock > 0,
                });
            }
        }
        return order;
    }
    getOrderById(id) {
        return this.orders.get(id);
    }
    getOrderByNumber(orderNumber) {
        return Array.from(this.orders.values()).find((o) => o.orderNumber === orderNumber);
    }
    getOrdersByUser(userId) {
        return Array.from(this.orders.values())
            .filter((o) => o.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getAllOrders() {
        return Array.from(this.orders.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    updateOrderStatus(orderId, status, trackingNumber) {
        const order = this.orders.get(orderId);
        if (!order)
            return undefined;
        const updated = {
            ...order,
            status,
            trackingNumber: trackingNumber || order.trackingNumber,
            updatedAt: new Date().toISOString(),
        };
        this.orders.set(orderId, updated);
        return updated;
    }
    // --- ANALYTICS ---
    getDashboardMetrics() {
        const orders = Array.from(this.orders.values());
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalCustomers = this.users.size;
        return {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            revenueGrowthPercent: 18.4,
            totalOrders,
            ordersGrowthPercent: 12.1,
            averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
            aovGrowthPercent: 5.6,
            totalCustomers,
            customersGrowthPercent: 24.3,
        };
    }
    getMonthlySalesData() {
        return [
            { month: 'Jan', revenue: 42000, orders: 320 },
            { month: 'Feb', revenue: 48500, orders: 370 },
            { month: 'Mar', revenue: 53200, orders: 410 },
            { month: 'Apr', revenue: 61000, orders: 490 },
            { month: 'May', revenue: 58900, orders: 450 },
            { month: 'Jun', revenue: 74200, orders: 580 },
            { month: 'Jul', revenue: 82100, orders: 630 },
            { month: 'Aug', revenue: 95400, orders: 740 },
        ];
    }
    getCategoryRevenueData() {
        return [
            { categoryName: 'Consumer Electronics', revenue: 145000, percentage: 42 },
            { categoryName: 'Fashion & Apparel', revenue: 86000, percentage: 25 },
            { categoryName: 'Home & Furniture', revenue: 52000, percentage: 15 },
            { categoryName: 'Sports & Outdoors', revenue: 38000, percentage: 11 },
            { categoryName: 'Books & Media', revenue: 24000, percentage: 7 },
        ];
    }
    getTopProducts() {
        return Array.from(this.products.values())
            .slice(0, 5)
            .map((p, idx) => ({
            id: p.id,
            title: p.title,
            thumbnail: p.thumbnail,
            categoryName: p.categoryName,
            price: p.basePrice,
            totalUnitsSold: 120 - idx * 18,
            totalRevenue: (120 - idx * 18) * p.basePrice,
            stockQuantity: p.stockQuantity,
        }));
    }
}
exports.db = new InMemoryDatabase();
