export type ProductStatus = 'draft' | 'active' | 'archived' | 'out_of_stock';
export type ProductVisibility = 'public' | 'hidden' | 'members_only';

export interface ProductDimension {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductWeight {
  value: number;
  unit: 'kg' | 'lb' | 'g' | 'oz';
}

export interface ProductVariant {
  id: string;
  productId?: string;
  sku: string;
  barcode?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  weight?: ProductWeight;
  dimensions?: ProductDimension;
  attributes: Record<string, string>; // e.g. { Color: "Midnight Black", Size: "XL" }
  imageUrl?: string;
  isDefault?: boolean;
}

export interface ProductAttributeOption {
  id?: string;
  name: string;
  values: string[];
}

export interface ProductSpecification {
  group: string;
  name: string;
  value: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 - 5
  title: string;
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  unhelpfulCount?: number;
  adminReply?: {
    message: string;
    repliedAt: string;
  };
}

export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  question: string;
  createdAt: string;
  answers: {
    id: string;
    userId: string;
    userName: string;
    userRole: 'customer' | 'admin' | 'vendor';
    answer: string;
    createdAt: string;
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  bannerUrl?: string;
  parentId?: string | null;
  children?: Category[];
  productCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  websiteUrl?: string;
  isFeatured?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  shortDescription?: string;
  specifications?: ProductSpecification[];
  basePrice: number;
  compareAtPrice?: number;
  costPrice?: number;
  discountPercentage?: number;
  categoryId: string;
  categoryName: string;
  categorySlug?: string;
  brandId: string;
  brandName: string;
  brandSlug?: string;
  vendorId?: string;
  vendorName?: string;
  images: string[];
  thumbnail: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity: number;
  lowStockAlert?: number;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  isFeatured?: boolean;
  isTrending?: boolean;
  isFlashDeal?: boolean;
  isNewArrival?: boolean;
  tags: string[];
  variants: ProductVariant[];
  attributes: ProductAttributeOption[];
  weight?: ProductWeight;
  dimensions?: ProductDimension;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilterQuery {
  search?: string;
  categorySlug?: string;
  brandSlugs?: string[];
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStockOnly?: boolean;
  isFeatured?: boolean;
  isFlashDeal?: boolean;
  isTrending?: boolean;
  tags?: string[];
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popularity' | 'discount';
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  availableCategories: Category[];
  availableBrands: Brand[];
  priceRange: { min: number; max: number };
}
