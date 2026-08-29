import { describe, it, expect } from "vitest";
import { createEmptyCart, addItem, updateQuantity, removeItem, recalculateCart, validateAddress } from "../shared/utils/cartEngine";

describe("Cart Engine", () => {
  it("creates empty cart", () => {
    const cart = createEmptyCart();
    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });

  it("adds item and recalculates", () => {
    let cart = createEmptyCart();
    cart = addItem(cart, {
      productId: "p1",
      slug: "test",
      title: "Test Product",
      imageUrl: "/img.jpg",
      unitPrice: 49.99,
      quantity: 2,
      maxQuantity: 10
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.subtotal).toBe(99.98);
  });

  it("updates quantity", () => {
    let cart = createEmptyCart();
    cart = addItem(cart, {
      productId: "p1", slug: "t", title: "T", imageUrl: "", unitPrice: 10, quantity: 1, maxQuantity: 5
    });
    cart = updateQuantity(cart, "p1", 3);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.subtotal).toBe(30);
  });

  it("removes item", () => {
    let cart = createEmptyCart();
    cart = addItem(cart, {
      productId: "p1", slug: "t", title: "T", imageUrl: "", unitPrice: 10, quantity: 1, maxQuantity: 5
    });
    cart = removeItem(cart, "p1");
    expect(cart.items).toHaveLength(0);
  });

  it("validates address", () => {
    const errors = validateAddress({
      fullName: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      line1: "123 Main St",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "US"
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects invalid email", () => {
    const errors = validateAddress({
      fullName: "J",
      email: "bad",
      phone: "123",
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: ""
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
