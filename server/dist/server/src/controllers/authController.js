"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleWishlist = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const config_1 = require("../config");
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }
        const existingUser = database_1.db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = {
            id: `usr-${(0, uuid_1.v4)()}`,
            email,
            name,
            role: 'customer',
            addresses: [],
            wishlistProductIds: [],
            createdAt: new Date().toISOString(),
        };
        database_1.db.createUser(newUser, hashedPassword);
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, role: newUser.role }, config_1.config.jwtSecret, {
            expiresIn: config_1.config.jwtExpiresIn,
        });
        const responseData = {
            user: newUser,
            token,
            expiresIn: config_1.config.jwtExpiresIn,
        };
        return res.status(201).json({ success: true, data: responseData });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = database_1.db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const hash = database_1.db.getUserPasswordHash(email);
        if (!hash) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isValid = await bcryptjs_1.default.compare(password, hash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        database_1.db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, config_1.config.jwtSecret, {
            expiresIn: config_1.config.jwtExpiresIn,
        });
        const responseData = {
            user,
            token,
            expiresIn: config_1.config.jwtExpiresIn,
        };
        return res.json({ success: true, data: responseData });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Login failed' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    return res.json({ success: true, data: req.user });
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { name, phone, addresses } = req.body;
    const updatedUser = database_1.db.updateUser(req.user.id, {
        name: name || req.user.name,
        phone: phone || req.user.phone,
        addresses: addresses || req.user.addresses,
    });
    return res.json({ success: true, data: updatedUser });
};
exports.updateProfile = updateProfile;
const toggleWishlist = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const wishlist = [...req.user.wishlistProductIds];
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
    }
    else {
        wishlist.push(productId);
    }
    const updatedUser = database_1.db.updateUser(req.user.id, { wishlistProductIds: wishlist });
    return res.json({ success: true, data: updatedUser?.wishlistProductIds });
};
exports.toggleWishlist = toggleWishlist;
