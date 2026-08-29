"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("../controllers/authController"));
const productController = __importStar(require("../controllers/productController"));
const categoryController = __importStar(require("../controllers/categoryController"));
const cartController = __importStar(require("../controllers/cartController"));
const orderController = __importStar(require("../controllers/orderController"));
const reviewController = __importStar(require("../controllers/reviewController"));
const adminController = __importStar(require("../controllers/adminController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// --- AUTH ROUTES ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', auth_1.authenticateJWT, authController.getMe);
router.put('/auth/profile', auth_1.authenticateJWT, authController.updateProfile);
router.post('/auth/wishlist', auth_1.authenticateJWT, authController.toggleWishlist);
// --- PRODUCT CATALOG ROUTES ---
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/trending', productController.getTrendingProducts);
router.get('/products/:slug', productController.getProductBySlug);
router.post('/products', auth_1.authenticateJWT, auth_1.requireAdmin, productController.createProduct);
router.put('/products/:id', auth_1.authenticateJWT, auth_1.requireAdmin, productController.updateProduct);
router.delete('/products/:id', auth_1.authenticateJWT, auth_1.requireAdmin, productController.deleteProduct);
// --- CATEGORIES & BRANDS ROUTES ---
router.get('/categories', categoryController.getCategories);
router.get('/brands', categoryController.getBrands);
// --- CART & COUPON ROUTES ---
router.post('/cart/validate-coupon', cartController.validateCoupon);
// --- ORDER ROUTES ---
router.post('/orders', orderController.createOrder); // Allows guest checkout
router.get('/orders/my-orders', auth_1.authenticateJWT, orderController.getMyOrders);
router.get('/orders/:id', orderController.getOrderById);
// --- REVIEW ROUTES ---
router.get('/reviews/:productId', reviewController.getProductReviews);
router.post('/reviews', auth_1.authenticateJWT, reviewController.createReview);
// --- ADMIN ROUTES ---
router.get('/admin/analytics', auth_1.authenticateJWT, auth_1.requireAdmin, adminController.getDashboardAnalytics);
router.get('/admin/orders', auth_1.authenticateJWT, auth_1.requireAdmin, adminController.getAllOrdersAdmin);
router.put('/admin/orders/:id/status', auth_1.authenticateJWT, auth_1.requireAdmin, adminController.updateOrderStatusAdmin);
router.get('/admin/customers', auth_1.authenticateJWT, auth_1.requireAdmin, adminController.getAllCustomersAdmin);
exports.default = router;
