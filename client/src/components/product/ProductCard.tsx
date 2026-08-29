
import React, { useState, useCallback, useMemo } from "react";
import { Heart, ShoppingCart, Star, Eye, Truck, BadgeCheck } from "lucide-react";

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  brand: string;
  category: string;
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  discountPercent?: number;
  tags?: string[];
  onAddToCart?: (id: string, qty: number) => void;
  onToggleWishlist?: (id: string) => void;
  isWishlisted?: boolean;
  viewMode?: "grid" | "list";
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id, slug, title, price, originalPrice, rating, reviewCount, imageUrl, brand, category,
  inStock, isNew, isFeatured, discountPercent, tags = [], onAddToCart, onToggleWishlist, isWishlisted, viewMode = "grid"
}) => {
  const [qty, setQty] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const savings = useMemo(() => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }, [price, originalPrice]);

  const handleAdd = useCallback(() => {
    if (inStock && onAddToCart) onAddToCart(id, qty);
  }, [id, qty, inStock, onAddToCart]);

  const stars = useMemo(() => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return { full, half, empty: 5 - full - (half ? 1 : 0) };
  }, [rating]);

  if (viewMode === "list") {
    return (
      <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
           onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="relative w-40 h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
          <img src={imageUrl} alt={title} className={`w-full h-full object-cover transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"}`}
               onLoad={() => setImgLoaded(true)} loading="lazy" />
          {!imgLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
          {isNew && <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded">NEW</span>}
          {discountPercent && discountPercent > 0 && (
            <span className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-semibold px-2 py-0.5 rounded">-{discountPercent}%</span>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{brand} · {category}</p>
            <h3 className="text-lg font-semibold text-gray-900 mt-1 line-clamp-2 hover:text-indigo-600">
              <a href={`/product/${slug}`}>{title}</a>
            </h3>
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: stars.full }).map((_, i) => <Star key={`f${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              {stars.half && <Star className="w-4 h-4 fill-amber-400/50 text-amber-400" />}
              {Array.from({ length: stars.empty }).map((_, i) => <Star key={`e${i}`} className="w-4 h-4 text-gray-300" />)}
              <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.slice(0, 3).map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-xl font-bold text-gray-900">${price.toFixed(2)}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-gray-400 line-through ml-2">${originalPrice.toFixed(2)}</span>
              )}
              {savings > 0 && <span className="text-sm text-emerald-600 ml-2">Save {savings}%</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onToggleWishlist?.(id)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Wishlist">
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
              </button>
              <button onClick={handleAdd} disabled={!inStock}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                        ${inStock ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                <ShoppingCart className="w-4 h-4" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
         onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img src={imageUrl} alt={title} className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? "scale-105" : "scale-100"} ${imgLoaded ? "opacity-100" : "opacity-0"}`}
             onLoad={() => setImgLoaded(true)} loading="lazy" />
        {!imgLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && <span className="bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded shadow">NEW</span>}
          {isFeatured && <span className="bg-indigo-500 text-white text-xs font-semibold px-2 py-0.5 rounded shadow">FEATURED</span>}
        </div>
        {discountPercent && discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded shadow">-{discountPercent}%</span>
        )}
        <div className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          <button onClick={() => onToggleWishlist?.(id)} className="p-2 bg-white rounded-full shadow hover:bg-gray-50" aria-label="Wishlist">
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-600"}`} />
          </button>
          <a href={`/product/${slug}`} className="p-2 bg-white rounded-full shadow hover:bg-gray-50" aria-label="Quick view">
            <Eye className="w-4 h-4 text-gray-600" />
          </a>
          <button onClick={handleAdd} disabled={!inStock} className="p-2 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 disabled:bg-gray-300" aria-label="Add to cart">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide truncate">{brand}</p>
        <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 min-h-[2.5rem]">
          <a href={`/product/${slug}`} className="hover:text-indigo-600">{title}</a>
        </h3>
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: stars.full }).map((_, i) => <Star key={`f${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
          {stars.half && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
          {Array.from({ length: stars.empty }).map((_, i) => <Star key={`e${i}`} className="w-3.5 h-3.5 text-gray-300" />)}
          <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          {inStock ? (
            <><Truck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">In Stock</span></>
          ) : (
            <span className="text-rose-500">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
