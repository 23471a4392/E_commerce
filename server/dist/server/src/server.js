"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const seed_1 = require("./db/seed");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// Seed Database automatically on startup
(0, seed_1.seedDatabase)();
// Health Check Endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'Oppenheimer E-Commerce API' });
});
// API Routes
app.use('/api/v1', routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Start HTTP Server
if (process.env.NODE_ENV !== 'test') {
    app.listen(config_1.config.port, () => {
        console.log(`🚀 Oppenheimer Server running on http://localhost:${config_1.config.port}`);
        console.log(`📡 API Base: http://localhost:${config_1.config.port}/api/v1`);
    });
}
exports.default = app;
