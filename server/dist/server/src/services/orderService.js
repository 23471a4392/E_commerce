"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const config_1 = require("../config");
const pricing_1 = require("@shared/utils/pricing");
class OrderService {
    static async processCheckout(payload, userId) {
        if (!payload.items || payload.items.length === 0) {
            throw new Error('Cart items cannot be empty.');
        }
        if (!payload.shippingAddress || !payload.shippingAddress.street) {
            throw new Error('Valid shipping destination address is required.');
        }
        const subtotal = payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        let discountAmount = 0;
        if (payload.couponCode) {
            const coupon = database_1.db.getCoupon(payload.couponCode);
            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (subtotal * coupon.discountValue) / 100;
                }
                else {
                    discountAmount = coupon.discountValue;
                }
            }
        }
        const totals = pricing_1.PricingEngine.calculateCartTotals({
            itemsSubtotal: subtotal,
            couponDiscount: discountAmount,
            shippingFee: subtotal >= config_1.config.freeShippingThreshold ? 0 : config_1.config.defaultShippingFee,
            stateCode: payload.shippingAddress.state || 'CA',
        });
        const orderItems = payload.items.map((item) => ({
            id: `oi-${(0, uuid_1.v4)().slice(0, 8)}`,
            productId: item.productId,
            productTitle: item.product.title,
            productImage: item.product.thumbnail,
            variantName: item.selectedVariant?.name,
            attributes: item.selectedAttributes,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
        }));
        const orderNumber = `OPP-${Math.floor(100000 + Math.random() * 900000)}`;
        const newOrder = {
            id: `ord-${(0, uuid_1.v4)()}`,
            orderNumber,
            userId: userId || 'guest-user',
            customerName: payload.shippingAddress.fullName,
            customerEmail: payload.shippingAddress.email,
            items: orderItems,
            shippingAddress: payload.shippingAddress,
            shippingMethod: payload.shippingMethodId === 'express'
                ? 'Express Courier (1-2 Business Days)'
                : 'Standard Delivery (3-5 Days)',
            paymentDetails: {
                method: payload.paymentMethod,
                cardLastFour: payload.cardNumber ? payload.cardNumber.slice(-4) : '4242',
                cardBrand: 'Visa',
                transactionId: `txn_${(0, uuid_1.v4)().slice(0, 12)}`,
                status: 'paid',
                paidAt: new Date().toISOString(),
            },
            subtotal: totals.itemsSubtotal,
            discountAmount: totals.totalDiscounts,
            couponCode: payload.couponCode,
            shippingFee: totals.shippingFee,
            taxAmount: totals.taxAmount,
            totalAmount: totals.grandTotal,
            status: 'processing',
            trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
            carrier: 'FedEx Express',
            estimatedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return database_1.db.createOrder(newOrder);
    }
}
exports.OrderService = OrderService;
