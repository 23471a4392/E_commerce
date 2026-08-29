"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const formatting_1 = require("@shared/utils/formatting");
class BrandService {
    static getAllBrands() {
        return database_1.db.getBrands();
    }
    static getBrandById(id) {
        const brand = database_1.db.getBrands().find((b) => b.id === id || b.slug === id);
        if (!brand) {
            throw new Error(`Brand '${id}' not found.`);
        }
        return brand;
    }
    static createBrand(data) {
        if (!data.name)
            throw new Error('Brand name is required.');
        const slug = formatting_1.FormattingUtils.slugify(data.name);
        const newBrand = {
            id: `b-${(0, uuid_1.v4)().slice(0, 8)}`,
            name: data.name,
            slug: `${slug}-${Date.now().toString().slice(-4)}`,
            description: data.description || '',
            logoUrl: data.logoUrl || 'https://via.placeholder.com/100',
            bannerUrl: data.bannerUrl,
            websiteUrl: data.websiteUrl,
            isFeatured: data.isFeatured ?? true,
        };
        return database_1.db.createBrand(newBrand);
    }
    static updateBrand(id, patch) {
        const existing = this.getBrandById(id);
        const updated = {
            ...existing,
            ...patch,
            slug: patch.name ? formatting_1.FormattingUtils.slugify(patch.name) : existing.slug,
        };
        database_1.db.createBrand(updated);
        return updated;
    }
    static deleteBrand(id) {
        const existing = this.getBrandById(id);
        const brands = database_1.db.getBrands().filter((b) => b.id !== existing.id);
        database_1.db.brands = new Map(brands.map((b) => [b.id, b]));
        return true;
    }
}
exports.BrandService = BrandService;
