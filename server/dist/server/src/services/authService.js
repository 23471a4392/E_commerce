"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
const database_1 = require("../db/database");
class AuthService {
    static async registerUser(data) {
        const existing = database_1.db.getUserByEmail(data.email);
        if (existing) {
            throw new Error('An account with this email address already exists.');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.pass, 10);
        const newUser = {
            id: `usr-${(0, uuid_1.v4)()}`,
            email: data.email,
            name: data.name,
            role: data.role || 'customer',
            addresses: [],
            wishlistProductIds: [],
            createdAt: new Date().toISOString(),
        };
        database_1.db.createUser(newUser, hashedPassword);
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, role: newUser.role }, config_1.config.jwtSecret, {
            expiresIn: config_1.config.jwtExpiresIn,
        });
        return {
            user: newUser,
            token,
            expiresIn: config_1.config.jwtExpiresIn,
        };
    }
    static async loginUser(email, pass) {
        const user = database_1.db.getUserByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password.');
        }
        const hash = database_1.db.getUserPasswordHash(email);
        if (!hash) {
            throw new Error('Invalid credentials.');
        }
        const isValid = await bcryptjs_1.default.compare(pass, hash);
        if (!isValid) {
            throw new Error('Invalid email or password.');
        }
        database_1.db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, config_1.config.jwtSecret, {
            expiresIn: config_1.config.jwtExpiresIn,
        });
        return {
            user,
            token,
            expiresIn: config_1.config.jwtExpiresIn,
        };
    }
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        }
        catch (err) {
            throw new Error('Invalid or expired authentication token.');
        }
    }
}
exports.AuthService = AuthService;
