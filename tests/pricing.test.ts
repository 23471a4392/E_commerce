import { describe, it, expect } from "vitest";
import { computePricing, applyCoupon, calculateTax, calculateShipping } from "../shared/utils/pricingEngine";

describe("Pricing Engine", () => {
  it("computes basic pricing", () => {
    const result = computePricing({
      basePrice: 100,
      quantity: 2,
      region: "US",
      currency: "USD"
    });
    expect(result.subtotal).toBe(200);
    expect(result.tax).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(result.subtotal);
  });

  it("applies WELCOME10 coupon", () => {
    const disc = applyCoupon(100, "WELCOME10");
    expect(disc).not.toBeNull();
    expect(disc!.amount).toBe(10);
  });

  it("calculates tax correctly", () => {
    expect(calculateTax(100, "US")).toBe(8);
    expect(calculateTax(100, "UK")).toBe(20);
    expect(calculateTax(100, "US", true)).toBe(0);
  });

  it("calculates free shipping above threshold", () => {
    expect(calculateShipping(1, "standard", 80)).toBe(0);
    expect(calculateShipping(1, "standard", 50)).toBeGreaterThan(0);
  });

  it("handles flash sale", () => {
    const result = computePricing({
      basePrice: 100,
      quantity: 1,
      isFlashSale: true,
      flashSaleDiscount: 20
    });
    expect(result.discounts.some(d => d.type === "flash")).toBe(true);
  });
});
