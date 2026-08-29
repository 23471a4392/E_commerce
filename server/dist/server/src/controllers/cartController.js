"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = void 0;
const database_1 = require("../db/database");
const validateCoupon = async (req, res) => {
    const { code, subtotal } = req.body;
    if (!code) {
        return res.status(400).json({ success: false, message: 'Coupon code required' });
    }
    const coupon = database_1.db.getCoupon(code);
    if (!coupon) {
        return res.status(404).json({ success: false, message: 'Invalid promotional coupon code' });
    }
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return res.status(400).json({
            success: false,
            message: `Coupon '${code}' requires a minimum subtotal of $${coupon.minOrderAmount.toFixed(2)}`,
        });
    }
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
    }
    else {
        discountAmount = coupon.discountValue;
    }
    return res.json({
        success: true,
        data: {
            coupon,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
        },
    });
};
exports.validateCoupon = validateCoupon;
