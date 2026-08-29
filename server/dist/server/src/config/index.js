"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || 'nifty-oppenheimer-super-secret-jwt-key-2026',
    jwtExpiresIn: '7d',
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    defaultPageSize: 12,
    freeShippingThreshold: 100, // $100 for free shipping
    defaultShippingFee: 15,
    taxRate: 0.08, // 8% sales tax
};
