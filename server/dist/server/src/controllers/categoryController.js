"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrands = exports.getCategories = void 0;
const database_1 = require("../db/database");
const getCategories = async (_req, res) => {
    const categories = database_1.db.getCategories();
    return res.json({ success: true, data: categories });
};
exports.getCategories = getCategories;
const getBrands = async (_req, res) => {
    const brands = database_1.db.getBrands();
    return res.json({ success: true, data: brands });
};
exports.getBrands = getBrands;
