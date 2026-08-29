"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrders = exports.getOrderById = exports.createOrder = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const config_1 = require("../config");
const createOrder = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.items || payload.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
        }
        if (!payload.shippingAddress || !payload.shippingAddress.street) {
            return res.status(400).json({ success: false, message: 'Valid shipping address is required' });
        }
        // Calculate subtotal
        const subtotal = payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        // Apply Coupon discount if present
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
        // Shipping fee & Tax
        const shippingFee = subtotal >= config_1.config.freeShippingThreshold ? 0 : config_1.config.defaultShippingFee;
        const taxableAmount = Math.max(0, subtotal - discountAmount);
        const taxAmount = parseFloat((taxableAmount * config_1.config.taxRate).toFixed(2));
        const totalAmount = parseFloat((taxableAmount + shippingFee + taxAmount).toFixed(2));
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
            userId: req.user ? req.user.id : 'guest-user',
            customerName: payload.shippingAddress.fullName,
            customerEmail: payload.shippingAddress.email,
            items: orderItems,
            shippingAddress: payload.shippingAddress,
            shippingMethod: payload.shippingMethodId === 'express' ? 'Express Courier (1-2 Business Days)' : 'Standard Delivery (3-5 Days)',
            paymentDetails: {
                method: payload.paymentMethod,
                cardLastFour: payload.cardNumber ? payload.cardNumber.slice(-4) : '4242',
                cardBrand: 'Visa',
                transactionId: `txn_${(0, uuid_1.v4)().slice(0, 12)}`,
                status: 'paid',
                paidAt: new Date().toISOString(),
            },
            subtotal: parseFloat(subtotal.toFixed(2)),
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            couponCode: payload.couponCode,
            shippingFee,
            taxAmount,
            totalAmount,
            status: 'processing',
            trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
            carrier: 'FedEx Express',
            estimatedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const created = database_1.db.createOrder(newOrder);
        return res.status(201).json({ success: true, data: created });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Checkout order creation failed' });
    }
};
exports.createOrder = createOrder;
const getOrderById = async (req, res) => {
    const { id } = req.params;
    const order = database_1.db.getOrderById(id) || database_1.db.getOrderByNumber(id);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, data: order });
};
exports.getOrderById = getOrderById;
const getMyOrders = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const orders = database_1.db.getOrdersByUser(req.user.id);
    return res.json({ success: true, data: orders });
};
exports.getMyOrders = getMyOrders;
