"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = exports.getProductReviews = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const getProductReviews = async (req, res) => {
    const { productId } = req.params;
    const reviews = database_1.db.getReviewsByProduct(productId);
    return res.json({ success: true, data: reviews });
};
exports.getProductReviews = getProductReviews;
const createReview = async (req, res) => {
    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating || !title || !comment) {
        return res.status(400).json({ success: false, message: 'productId, rating, title, and comment are required' });
    }
    const newReview = {
        id: `rev-${(0, uuid_1.v4)().slice(0, 8)}`,
        productId,
        userId: req.user ? req.user.id : 'guest-user',
        userName: req.user ? req.user.name : 'Verified Customer',
        userAvatar: req.user?.avatarUrl,
        rating: Number(rating),
        title,
        comment,
        createdAt: new Date().toISOString(),
        isVerifiedPurchase: true,
        helpfulCount: 0,
    };
    const created = database_1.db.addReview(newReview);
    return res.status(201).json({ success: true, data: created });
};
exports.createReview = createReview;
