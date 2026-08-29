
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal, Grid, List } from "lucide-react";

export interface FilterState {
  search: string;
  categories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
  sortBy: "featured" | "price-asc" | "price-desc" | "newest" | "rating" | "bestselling";
  viewMode: "grid" | "list";
}

export interface CatalogFiltersProps {
  availableCategories: { id: string; name: string; count: number }[];
  availableBrands: { id: string; name: string; count: number }[];
  priceRange: { min: number; max: number };
  currentFilters: FilterState;
  onChange: (filters: FilterState) => void;
  totalResults: number;
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "rating", label: "Highest Rated" },
  { value: "bestselling", label: "Best Selling" },
] as const;

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  availableCategories, availableBrands, priceRange, currentFilters, onChange, totalResults, isLoading
}) => {
  const [localSearch, setLocalSearch] = useState(currentFilters.search);
  const [expanded, setExpanded] = useState({ categories: true, brands: true, price: true, rating: true });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== currentFilters.search) {
        onChange({ ...currentFilters, search: localSearch });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch]);

  const toggleCategory = useCallback((catId: string) => {
    const next = currentFilters.categories.includes(catId)
      ? currentFilters.categories.filter(c => c !== catId)
      : [...currentFilters.categories, catId];
    onChange({ ...currentFilters, categories: next });
  }, [currentFilters, onChange]);

  const toggleBrand = useCallback((brandId: string) => {
    const next = currentFilters.brands.includes(brandId)
      ? currentFilters.brands.filter(b => b !== brandId)
      : [...currentFilters.brands, brandId];
    onChange({ ...currentFilters, brands: next });
  }, [currentFilters, onChange]);

  const clearAll = useCallback(() => {
    onChange({
      search: "", categories: [], brands: [], minPrice: priceRange.min, maxPrice: priceRange.max,
      minRating: 0, inStockOnly: false, sortBy: "featured", viewMode: currentFilters.viewMode
    });
    setLocalSearch("");
  }, [onChange, priceRange, currentFilters.viewMode]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (currentFilters.search) n++;
    n += currentFilters.categories.length;
    n += currentFilters.brands.length;
    if (currentFilters.minPrice > priceRange.min || currentFilters.maxPrice < priceRange.max) n++;
    if (currentFilters.minRating > 0) n++;
    if (currentFilters.inStockOnly) n++;
    return n;
  }, [currentFilters, priceRange]);

  const FilterSection = ({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 py-4">
      <button onClick={onToggle} className="flex items-center justify-between w-full text-left font-medium text-gray-900">
        {title}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );

  const sidebar = (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="text-sm text-indigo-600 hover:text-indigo-800">Clear all ({activeFilterCount})</button>
        )}
      </div>

      <FilterSection title="Categories" isOpen={expanded.categories} onToggle={() => setExpanded(e => ({ ...e, categories: !e.categories }))}>
        {availableCategories.map(cat => (
          <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input type="checkbox" checked={currentFilters.categories.includes(cat.id)} onChange={() => toggleCategory(cat.id)}
                   className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="flex-1">{cat.name}</span>
            <span className="text-gray-400 text-xs">{cat.count}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Brands" isOpen={expanded.brands} onToggle={() => setExpanded(e => ({ ...e, brands: !e.brands }))}>
        {availableBrands.map(brand => (
          <label key={brand.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input type="checkbox" checked={currentFilters.brands.includes(brand.id)} onChange={() => toggleBrand(brand.id)}
                   className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="flex-1">{brand.name}</span>
            <span className="text-gray-400 text-xs">{brand.count}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Price Range" isOpen={expanded.price} onToggle={() => setExpanded(e => ({ ...e, price: !e.price }))}>
        <div className="flex items-center gap-2">
          <input type="number" value={currentFilters.minPrice} min={priceRange.min} max={priceRange.max}
                 onChange={e => onChange({ ...currentFilters, minPrice: Number(e.target.value) })}
                 className="w-full border rounded-md px-2 py-1 text-sm" placeholder="Min" />
          <span className="text-gray-400">–</span>
          <input type="number" value={currentFilters.maxPrice} min={priceRange.min} max={priceRange.max}
                 onChange={e => onChange({ ...currentFilters, maxPrice: Number(e.target.value) })}
                 className="w-full border rounded-md px-2 py-1 text-sm" placeholder="Max" />
        </div>
        <input type="range" min={priceRange.min} max={priceRange.max} value={currentFilters.maxPrice}
               onChange={e => onChange({ ...currentFilters, maxPrice: Number(e.target.value) })}
               className="w-full mt-2 accent-indigo-600" />
      </FilterSection>

      <FilterSection title="Customer Rating" isOpen={expanded.rating} onToggle={() => setExpanded(e => ({ ...e, rating: !e.rating }))}>
        {[4, 3, 2, 1].map(r => (
          <label key={r} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input type="radio" name="rating" checked={currentFilters.minRating === r} onChange={() => onChange({ ...currentFilters, minRating: r })}
                   className="text-indigo-600 focus:ring-indigo-500" />
            <span>{r}+ Stars</span>
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input type="radio" name="rating" checked={currentFilters.minRating === 0} onChange={() => onChange({ ...currentFilters, minRating: 0 })}
                 className="text-indigo-600 focus:ring-indigo-500" />
          <span>Any rating</span>
        </label>
      </FilterSection>

      <div className="py-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={currentFilters.inStockOnly} onChange={e => onChange({ ...currentFilters, inStockOnly: e.target.checked })}
                 className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={localSearch} onChange={e => setLocalSearch(e.target.value)}
                 placeholder="Search products..." className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          {localSearch && (
            <button onClick={() => { setLocalSearch(""); onChange({ ...currentFilters, search: "" }); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={() => setShowMobileFilters(true)} className="sm:hidden flex items-center gap-2 px-3 py-2 border rounded-lg text-sm">
            <SlidersHorizontal className="w-4 h-4" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select value={currentFilters.sortBy} onChange={e => onChange({ ...currentFilters, sortBy: e.target.value as FilterState["sortBy"] })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => onChange({ ...currentFilters, viewMode: "grid" })}
                    className={`p-2 ${currentFilters.viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => onChange({ ...currentFilters, viewMode: "list" })}
                    className={`p-2 ${currentFilters.viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">{isLoading ? "Loading..." : `${totalResults} results`}</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            {sidebar}
            <button onClick={() => setShowMobileFilters(false)} className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">
              Show {totalResults} results
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar is rendered by parent; this component focuses on controls */}
      <div className="hidden sm:block">{/* parent handles layout */}</div>
    </div>
  );
};

export default CatalogFilters;
