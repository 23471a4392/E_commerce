"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
class ReviewService {
    static getReviewsForProduct(productId) {
        return database_1.db.getReviewsByProduct(productId);
    }
    static createReview(data) {
        if (!data.productId || !data.title || !data.comment) {
            throw new Error('productId, title and comment details are required.');
        }
        const review = {
            id: `rev-${(0, uuid_1.v4)().slice(0, 8)}`,
            productId: data.productId,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            rating: Number(data.rating),
            title: data.title,
            comment: data.comment,
            createdAt: new Date().toISOString(),
            isVerifiedPurchase: true,
            helpfulCount: 0,
        };
        return database_1.db.addReview(review);
    }
    static updateReview(id, patch) {
        const reviewsMap = database_1.db.reviews;
        const existing = reviewsMap.get(id);
        if (!existing)
            throw new Error(`Review '${id}' not found.`);
        const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
        reviewsMap.set(id, updated);
        return updated;
    }
    static deleteReview(id) {
        const reviewsMap = database_1.db.reviews;
        return reviewsMap.delete(id);
    }
}
exports.ReviewService = ReviewService;
