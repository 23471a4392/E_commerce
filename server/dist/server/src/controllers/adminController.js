"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCustomersAdmin = exports.updateOrderStatusAdmin = exports.getAllOrdersAdmin = exports.getDashboardAnalytics = void 0;
const database_1 = require("../db/database");
const getDashboardAnalytics = async (_req, res) => {
    const metrics = database_1.db.getDashboardMetrics();
    const monthlySales = database_1.db.getMonthlySalesData();
    const categoryRevenue = database_1.db.getCategoryRevenueData();
    const topProducts = database_1.db.getTopProducts();
    return res.json({
        success: true,
        data: {
            metrics,
            monthlySales,
            categoryRevenue,
            topProducts,
        },
    });
};
exports.getDashboardAnalytics = getDashboardAnalytics;
const getAllOrdersAdmin = async (_req, res) => {
    const orders = database_1.db.getAllOrders();
    return res.json({ success: true, data: orders });
};
exports.getAllOrdersAdmin = getAllOrdersAdmin;
const updateOrderStatusAdmin = async (req, res) => {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const updated = database_1.db.updateOrderStatus(id, status, trackingNumber);
    if (!updated) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, data: updated });
};
exports.updateOrderStatusAdmin = updateOrderStatusAdmin;
const getAllCustomersAdmin = async (_req, res) => {
    const users = database_1.db.getAllUsers();
    return res.json({ success: true, data: users });
};
exports.getAllCustomersAdmin = getAllCustomersAdmin;
