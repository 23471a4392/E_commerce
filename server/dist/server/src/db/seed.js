"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("./database");
const productsSeedData_1 = require("./seeds/productsSeedData");
const ordersSeedData_1 = require("./seeds/ordersSeedData");
const reviewsSeedData_1 = require("./seeds/reviewsSeedData");
async function seedDatabase() {
    console.log('🌱 Starting Enterprise Database Seed process...');
    productsSeedData_1.MASSIVE_PRODUCTS_DATA.forEach((p) => database_1.db.createProduct(p));
    reviewsSeedData_1.MASSIVE_REVIEWS_DATA.forEach((r) => database_1.db.addReview(r));
    ordersSeedData_1.MASSIVE_ORDERS_DATA.forEach((o) => database_1.db.createOrder(o));
    // 1. SEED CATEGORIES
    const categories = [
        {
            id: 'cat-electronics',
            name: 'Consumer Electronics',
            slug: 'electronics',
            description: 'Cutting-edge smartphones, laptops, audio gear, and wearables.',
            imageUrl: 'https://images.unsplash.com/photo-1498049860654-af1a5c566876?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 'cat-fashion',
            name: 'Fashion & Apparel',
            slug: 'fashion',
            description: 'Modern luxury clothing, footwear, outerwear, and streetwear.',
            imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 'cat-home',
            name: 'Home & Living',
            slug: 'home-living',
            description: 'Ergonomic furniture, ambient lighting, and smart home appliances.',
            imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 'cat-sports',
            name: 'Sports & Fitness',
            slug: 'sports-fitness',
            description: 'High-performance activewear, gym gear, and outdoor equipment.',
            imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 'cat-books',
            name: 'Books & Stationery',
            slug: 'books',
            description: 'Bestselling novels, technical journals, and executive stationery.',
            imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        },
    ];
    categories.forEach((c) => database_1.db.createCategory(c));
    // 2. SEED BRANDS
    const brands = [
        { id: 'b-apex', name: 'Apex Audio', slug: 'apex-audio', logoUrl: 'https://via.placeholder.com/100?text=APEX' },
        { id: 'b-quantum', name: 'Quantum Tech', slug: 'quantum-tech', logoUrl: 'https://via.placeholder.com/100?text=QUANTUM' },
        { id: 'b-lumina', name: 'Lumina Home', slug: 'lumina-home', logoUrl: 'https://via.placeholder.com/100?text=LUMINA' },
        { id: 'b-vanguard', name: 'Vanguard Fashion', slug: 'vanguard-fashion', logoUrl: 'https://via.placeholder.com/100?text=VANGUARD' },
        { id: 'b-hyperion', name: 'Hyperion Fitness', slug: 'hyperion-fitness', logoUrl: 'https://via.placeholder.com/100?text=HYPERION' },
    ];
    brands.forEach((b) => database_1.db.createBrand(b));
    // 3. SEED PRODUCTS
    const rawProducts = [
        {
            id: 'prod-1',
            title: 'Quantum SoundPro ANC Wireless Headphones',
            slug: 'quantum-soundpro-anc-headphones',
            description: 'Experience studio-grade active noise cancellation with 45-hour battery life, spatial audio processing, and plush memory foam ear cushions.',
            basePrice: 299.99,
            compareAtPrice: 349.99,
            categoryId: 'cat-electronics',
            categoryName: 'Consumer Electronics',
            brandId: 'b-apex',
            brandName: 'Apex Audio',
            rating: 4.8,
            reviewCount: 142,
            inStock: true,
            stockQuantity: 45,
            isFeatured: true,
            isTrending: true,
            tags: ['audio', 'wireless', 'anc', 'headphones'],
            thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            images: [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
            ],
            variants: [
                { id: 'v1-1', sku: 'QP-ANC-BLK', name: 'Space Black', price: 299.99, stock: 25, attributes: { Color: 'Space Black' } },
                { id: 'v1-2', sku: 'QP-ANC-SIL', name: 'Starlight Silver', price: 299.99, stock: 20, attributes: { Color: 'Starlight Silver' } },
            ],
            attributes: [{ name: 'Color', values: ['Space Black', 'Starlight Silver'] }],
        },
        {
            id: 'prod-2',
            title: 'Apex UltraBook Pro 16" M3 Laptop',
            slug: 'apex-ultrabook-pro-16-laptop',
            description: 'Ultra-thin magnesium alloy chassis featuring a 120Hz Liquid Retina XDR display, 32GB Unified Memory, and 1TB NVMe SSD.',
            basePrice: 1899.99,
            compareAtPrice: 2099.99,
            categoryId: 'cat-electronics',
            categoryName: 'Consumer Electronics',
            brandId: 'b-quantum',
            brandName: 'Quantum Tech',
            rating: 4.9,
            reviewCount: 89,
            inStock: true,
            stockQuantity: 18,
            isFeatured: true,
            tags: ['laptop', 'ultrabook', 'pro', 'm3'],
            thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
            images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'],
            variants: [
                { id: 'v2-1', sku: 'AP-16-512', name: '512GB SSD / 16GB RAM', price: 1699.99, stock: 10, attributes: { Storage: '512GB', RAM: '16GB' } },
                { id: 'v2-2', sku: 'AP-16-1TB', name: '1TB SSD / 32GB RAM', price: 1899.99, stock: 8, attributes: { Storage: '1TB', RAM: '32GB' } },
            ],
            attributes: [
                { name: 'Storage', values: ['512GB', '1TB'] },
                { name: 'RAM', values: ['16GB', '32GB'] },
            ],
        },
        {
            id: 'prod-3',
            title: 'Vanguard Italian Leather Trench Coat',
            slug: 'vanguard-italian-leather-trench-coat',
            description: 'Handcrafted full-grain Italian leather trench coat with water-resistant coating, silk lining, and tailored double-breasted closure.',
            basePrice: 649.00,
            compareAtPrice: 799.00,
            categoryId: 'cat-fashion',
            categoryName: 'Fashion & Apparel',
            brandId: 'b-vanguard',
            brandName: 'Vanguard Fashion',
            rating: 4.7,
            reviewCount: 56,
            inStock: true,
            stockQuantity: 12,
            isFeatured: true,
            isFlashDeal: true,
            tags: ['leather', 'jacket', 'coat', 'fashion', 'luxury'],
            thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
            images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'],
            variants: [
                { id: 'v3-1', sku: 'VG-COAT-M', name: 'Medium / Onyx Black', price: 649.00, stock: 6, attributes: { Size: 'M', Color: 'Onyx Black' } },
                { id: 'v3-2', sku: 'VG-COAT-L', name: 'Large / Onyx Black', price: 649.00, stock: 6, attributes: { Size: 'L', Color: 'Onyx Black' } },
            ],
            attributes: [
                { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
                { name: 'Color', values: ['Onyx Black', 'Chestnut Brown'] },
            ],
        },
        {
            id: 'prod-4',
            title: 'Lumina Ergonomic Mesh Executive Chair',
            slug: 'lumina-ergonomic-mesh-chair',
            description: '4D adjustable armrests, dynamic lumbar feedback mechanism, breathable Korean mesh backrest, and heavy-duty aluminum base.',
            basePrice: 429.50,
            compareAtPrice: 499.00,
            categoryId: 'cat-home',
            categoryName: 'Home & Living',
            brandId: 'b-lumina',
            brandName: 'Lumina Home',
            rating: 4.8,
            reviewCount: 112,
            inStock: true,
            stockQuantity: 30,
            isTrending: true,
            tags: ['chair', 'furniture', 'ergonomic', 'office'],
            thumbnail: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=800&auto=format&fit=crop&q=80',
            images: ['https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=800&auto=format&fit=crop&q=80'],
            variants: [
                { id: 'v4-1', sku: 'LM-CH-BLK', name: 'Matte Black', price: 429.50, stock: 20, attributes: { Color: 'Matte Black' } },
                { id: 'v4-2', sku: 'LM-CH-GRY', name: 'Graphite Grey', price: 429.50, stock: 10, attributes: { Color: 'Graphite Grey' } },
            ],
            attributes: [{ name: 'Color', values: ['Matte Black', 'Graphite Grey'] }],
        },
        {
            id: 'prod-5',
            title: 'Hyperion Smart OLED Treadmill',
            slug: 'hyperion-smart-oled-treadmill',
            description: 'Commercial-grade 3.5 HP motor, automatic 15% incline adjustment, integrated 22-inch HD touch display, and joint-cushioning flex deck.',
            basePrice: 1299.00,
            compareAtPrice: 1499.00,
            categoryId: 'cat-sports',
            categoryName: 'Sports & Fitness',
            brandId: 'b-hyperion',
            brandName: 'Hyperion Fitness',
            rating: 4.9,
            reviewCount: 43,
            inStock: true,
            stockQuantity: 8,
            tags: ['treadmill', 'fitness', 'gym', 'cardio'],
            thumbnail: 'https://images.unsplash.com/photo-1576678927484-cc909957088c?w=800&auto=format&fit=crop&q=80',
            images: ['https://images.unsplash.com/photo-1576678927484-cc909957088c?w=800&auto=format&fit=crop&q=80'],
            variants: [
                { id: 'v5-1', sku: 'HY-TR-PRO', name: 'Standard Edition', price: 1299.00, stock: 8, attributes: { Model: 'Pro' } },
            ],
            attributes: [{ name: 'Model', values: ['Pro'] }],
        },
        {
            id: 'prod-6',
            title: 'Quantum Smartwatch Horizon Ultra 2',
            slug: 'quantum-smartwatch-horizon-ultra-2',
            description: 'Titanium case, Sapphire glass crystal, dual-frequency GPS tracking, 100m water resistance rating, ECG & blood oxygen monitor.',
            basePrice: 399.00,
            compareAtPrice: 449.00,
            categoryId: 'cat-electronics',
            categoryName: 'Consumer Electronics',
            brandId: 'b-quantum',
            brandName: 'Quantum Tech',
            rating: 4.6,
            reviewCount: 78,
            inStock: true,
            stockQuantity: 24,
            isFeatured: true,
            tags: ['watch', 'smartwatch', 'titanium', 'fitness'],
            thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
            variants: [
                { id: 'v6-1', sku: 'SW-TIT-49', name: '49mm Titanium / Alpine Loop', price: 399.00, stock: 24, attributes: { Size: '49mm' } },
            ],
            attributes: [{ name: 'Size', values: ['49mm'] }],
        },
        {
            id: 'prod-7',
            title: 'Minimalist Oak Wood Coffee Table',
            slug: 'minimalist-oak-wood-coffee-table',
            description: 'Solid Nordic white oak coffee table with soft rounded edges and durable protective matte lacquer finish.',
            basePrice: 280.00,
            compareAtPrice: 320.00,
            categoryId: 'cat-home',
            categoryName: 'Home & Living',
            brandId: 'b-lumina',
            brandName: 'Lumina Home',
            rating: 4.5,
            reviewCount: 31,
            inStock: true,
            stockQuantity: 15,
            tags: ['table', 'wood', 'furniture', 'oak'],
            thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80',
            images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80'],
            variants: [
                { id: 'v7-1', sku: 'OAK-TBL-100', name: 'Natural White Oak', price: 280.00, stock: 15, attributes: { Finish: 'White Oak' } },
            ],
            attributes: [{ name: 'Finish', values: ['White Oak', 'Dark Walnut'] }],
        },
        {
            id: 'prod-8',
            title: 'Architectural Design Annual Hardcover Edition',
            slug: 'architectural-design-annual-hardcover',
            description: 'Collector edition volume exploring world-class sustainable architecture, featuring over 400 full-color photography pages.',
            basePrice: 65.00,
            compareAtPrice: 80.00,
            categoryId: 'cat-books',
            categoryName: 'Books & Stationery',
            brandId: 'b-vanguard',
            brandName: 'Vanguard Publishing',
            rating: 4.9,
            reviewCount: 22,
            inStock: true,
            stockQuantity: 50,
            tags: ['book', 'architecture', 'hardcover', 'art'],
            thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
            images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'],
            variants: [
                { id: 'v8-1', sku: 'BK-ARCH-2026', name: 'Hardcover Deluxe', price: 65.00, stock: 50, attributes: { Binding: 'Hardcover' } },
            ],
            attributes: [{ name: 'Binding', values: ['Hardcover'] }],
        },
    ];
    rawProducts.forEach((p) => {
        const fullProduct = {
            id: p.id,
            slug: p.slug,
            title: p.title,
            subtitle: p.subtitle || '',
            description: p.description,
            basePrice: p.basePrice,
            compareAtPrice: p.compareAtPrice,
            discountPercentage: p.compareAtPrice
                ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100)
                : undefined,
            categoryId: p.categoryId,
            categoryName: p.categoryName,
            brandId: p.brandId,
            brandName: p.brandName,
            images: p.images,
            thumbnail: p.thumbnail,
            rating: p.rating || 5.0,
            reviewCount: p.reviewCount || 0,
            inStock: p.inStock ?? true,
            stockQuantity: p.stockQuantity || 10,
            isFeatured: p.isFeatured || false,
            isTrending: p.isTrending || false,
            isFlashDeal: p.isFlashDeal || false,
            tags: p.tags || [],
            variants: p.variants || [],
            attributes: p.attributes || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        database_1.db.createProduct(fullProduct);
    });
    // 4. SEED USERS
    const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
    const customerUser = {
        id: 'usr-customer-1',
        email: 'alex@example.com',
        name: 'Alex Mercer',
        role: 'customer',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        phone: '+1 (555) 234-5678',
        addresses: [
            {
                fullName: 'Alex Mercer',
                email: 'alex@example.com',
                phone: '+1 (555) 234-5678',
                street: '742 Evergreen Terrace',
                city: 'San Francisco',
                state: 'CA',
                postalCode: '94107',
                country: 'United States',
            },
        ],
        wishlistProductIds: ['prod-1', 'prod-3'],
        createdAt: new Date().toISOString(),
    };
    const adminUser = {
        id: 'usr-admin-1',
        email: 'admin@oppenheimer.com',
        name: 'Sarah Connor (Admin)',
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        phone: '+1 (555) 999-0000',
        addresses: [],
        wishlistProductIds: [],
        createdAt: new Date().toISOString(),
    };
    database_1.db.createUser(customerUser, hashedPassword);
    database_1.db.createUser(adminUser, hashedPassword);
    // 5. SEED REVIEWS
    database_1.db.addReview({
        id: 'rev-1',
        productId: 'prod-1',
        userId: 'usr-customer-1',
        userName: 'Alex Mercer',
        rating: 5,
        title: 'Mind-blowing Noise Cancellation!',
        comment: 'I use these during daily commute on train. Battery easily lasts the entire week without needing a charge.',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        isVerifiedPurchase: true,
        helpfulCount: 14,
    });
    // 6. SEED COUPONS
    const coupons = [
        {
            code: 'WELCOME10',
            description: '10% OFF on your first purchase',
            discountType: 'percentage',
            discountValue: 10,
            expiresAt: '2027-12-31',
        },
        {
            code: 'FLASH20',
            description: '$20 Flat Discount on orders over $150',
            discountType: 'fixed',
            discountValue: 20,
            minOrderAmount: 150,
            expiresAt: '2027-12-31',
        },
        {
            code: 'SUMMER50',
            description: 'Special 15% Summer Season Promo',
            discountType: 'percentage',
            discountValue: 15,
            expiresAt: '2027-12-31',
        },
    ];
    coupons.forEach((c) => database_1.db.createCoupon(c));
    // 7. SEED INITIAL ORDERS
    const sampleOrder = {
        id: 'ord-1001',
        orderNumber: 'OPP-892101',
        userId: 'usr-customer-1',
        customerName: 'Alex Mercer',
        customerEmail: 'alex@example.com',
        items: [
            {
                id: 'oi-1',
                productId: 'prod-1',
                productTitle: 'Quantum SoundPro ANC Wireless Headphones',
                productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
                variantName: 'Space Black',
                unitPrice: 299.99,
                quantity: 1,
                totalPrice: 299.99,
            },
        ],
        shippingAddress: {
            fullName: 'Alex Mercer',
            email: 'alex@example.com',
            phone: '+1 (555) 234-5678',
            street: '742 Evergreen Terrace',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94107',
            country: 'United States',
        },
        shippingMethod: 'Express Courier Shipping',
        paymentDetails: {
            method: 'credit_card',
            cardLastFour: '4242',
            cardBrand: 'Visa',
            transactionId: 'txn_982149120',
            status: 'paid',
            paidAt: new Date().toISOString(),
        },
        subtotal: 299.99,
        discountAmount: 30.0,
        couponCode: 'WELCOME10',
        shippingFee: 0.0,
        taxAmount: 21.6,
        totalAmount: 291.59,
        status: 'shipped',
        trackingNumber: 'TRK-99120482',
        carrier: 'FedEx Express',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
    };
    database_1.db.createOrder(sampleOrder);
    console.log('✅ Seed complete! Database ready with products, categories, users, and sample orders.');
}
// Self-run when executed directly via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
    seedDatabase();
}
