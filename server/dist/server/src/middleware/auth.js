"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const database_1 = require("../db/database");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
            const user = database_1.db.getUserById(decoded.userId);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User profile not found' });
            }
            req.user = user;
            next();
        }
        catch (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired access token' });
        }
    }
    else {
        return res.status(401).json({ success: false, message: 'Authorization header required' });
    }
};
exports.authenticateJWT = authenticateJWT;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
