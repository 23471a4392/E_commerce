"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const formatting_1 = require("@shared/utils/formatting");
class CategoryService {
    static getAllCategories() {
        return database_1.db.getCategories();
    }
    static getCategoryById(id) {
        const category = database_1.db.getCategories().find((c) => c.id === id || c.slug === id);
        if (!category) {
            throw new Error(`Category '${id}' not found.`);
        }
        return category;
    }
    static createCategory(data) {
        if (!data.name)
            throw new Error('Category name is required.');
        const slug = formatting_1.FormattingUtils.slugify(data.name);
        const newCategory = {
            id: `cat-${(0, uuid_1.v4)().slice(0, 8)}`,
            name: data.name,
            slug: `${slug}-${Date.now().toString().slice(-4)}`,
            description: data.description || '',
            parentId: data.parentId || null,
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1498049860654-af1a5c566876?w=600',
            bannerUrl: data.bannerUrl,
            metaTitle: data.metaTitle || data.name,
            metaDescription: data.metaDescription || data.description,
            productCount: 0,
            isFeatured: true,
            sortOrder: database_1.db.getCategories().length + 1,
        };
        return database_1.db.createCategory(newCategory);
    }
    static updateCategory(id, patch) {
        const existing = this.getCategoryById(id);
        const updated = {
            ...existing,
            ...patch,
            slug: patch.name ? formatting_1.FormattingUtils.slugify(patch.name) : existing.slug,
        };
        database_1.db.createCategory(updated); // overwrite in DB
        return updated;
    }
    static deleteCategory(id) {
        const existing = this.getCategoryById(id);
        const categories = database_1.db.getCategories().filter((c) => c.id !== existing.id);
        // Remove from in-memory DB list
        database_1.db.categories = new Map(categories.map((c) => [c.id, c]));
        return true;
    }
}
exports.CategoryService = CategoryService;
