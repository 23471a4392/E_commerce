"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponService = void 0;
const database_1 = require("../db/database");
class CouponService {
    static getAllCoupons() {
        return Array.from(database_1.db.coupons?.values() || []);
    }
    static getCouponByCode(code) {
        const coupon = database_1.db.getCoupon(code);
        if (!coupon) {
            throw new Error(`Promotional coupon code '${code}' not found.`);
        }
        return coupon;
    }
    static createCoupon(data) {
        if (!data.code || !data.discountValue) {
            throw new Error('Coupon code and discount value are required.');
        }
        const newCoupon = {
            code: data.code.toUpperCase().trim(),
            description: data.description || '',
            discountType: data.discountType,
            discountValue: Number(data.discountValue),
            minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : undefined,
            maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
            expiresAt: data.expiresAt || '2028-12-31',
        };
        return database_1.db.createCoupon(newCoupon);
    }
    static updateCoupon(code, patch) {
        const existing = this.getCouponByCode(code);
        const updated = {
            ...existing,
            ...patch,
            code: patch.code ? patch.code.toUpperCase().trim() : existing.code,
        };
        database_1.db.createCoupon(updated);
        return updated;
    }
    static deleteCoupon(code) {
        const uppercaseCode = code.toUpperCase().trim();
        return database_1.db.coupons?.delete(uppercaseCode) || false;
    }
}
exports.CouponService = CouponService;
