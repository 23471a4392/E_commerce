/**
 * Oppenheimer Shopping Cart & Checkout State Machine
 * Cart item management, promo application, shipping estimation, multi-step checkout validation,
 * payment method simulation, order summary generation, and abandonment recovery helpers.
 */

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  variant?: { size?: string; color?: string };
  maxQuantity: number;
}

export interface CartState {
  items: CartItem[];
  couponCode?: string;
  discountAmount: number;
  shippingMethod: "standard" | "express" | "overnight";
  shippingCost: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  currency: string;
  updatedAt: string;
}

export interface CheckoutAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  type: "card" | "paypal" | "applepay" | "cod";
  last4?: string;
  brand?: string;
  expiry?: string;
}

export function createEmptyCart(): CartState {
  return {
    items: [],
    discountAmount: 0,
    shippingMethod: "standard",
    shippingCost: 0,
    taxRate: 0.08,
    taxAmount: 0,
    subtotal: 0,
    total: 0,
    freeShippingThreshold: 75,
    freeShippingProgress: 0,
    currency: "USD",
    updatedAt: new Date().toISOString()
  };
}

export function recalculateCart(cart: CartState, couponDiscount: number = 0): CartState {
  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountAmount = Math.min(couponDiscount, subtotal);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxable * cart.taxRate * 100) / 100;
  let shippingCost = 0;
  if (taxable < cart.freeShippingThreshold) {
    shippingCost = cart.shippingMethod === "overnight" ? 24.99 : cart.shippingMethod === "express" ? 12.99 : 5.99;
  }
  const total = Math.round((taxable + taxAmount + shippingCost) * 100) / 100;
  const freeShippingProgress = Math.min(100, (taxable / cart.freeShippingThreshold) * 100);

  return {
    ...cart,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxAmount,
    shippingCost,
    total,
    freeShippingProgress: Math.round(freeShippingProgress * 10) / 10,
    updatedAt: new Date().toISOString()
  };
}

export function addItem(cart: CartState, item: CartItem): CartState {
  const existing = cart.items.find(i => i.productId === item.productId && JSON.stringify(i.variant) === JSON.stringify(item.variant));
  let items: CartItem[];
  if (existing) {
    items = cart.items.map(i =>
      i.productId === item.productId && JSON.stringify(i.variant) === JSON.stringify(item.variant)
        ? { ...i, quantity: Math.min(i.maxQuantity, i.quantity + item.quantity) }
        : i
    );
  } else {
    items = [...cart.items, { ...item, quantity: Math.min(item.maxQuantity, item.quantity) }];
  }
  return recalculateCart({ ...cart, items }, cart.discountAmount);
}

export function updateQuantity(cart: CartState, productId: string, quantity: number, variant?: CartItem["variant"]): CartState {
  const items = cart.items
    .map(i => {
      if (i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)) {
        return { ...i, quantity: Math.max(0, Math.min(i.maxQuantity, quantity)) };
      }
      return i;
    })
    .filter(i => i.quantity > 0);
  return recalculateCart({ ...cart, items }, cart.discountAmount);
}

export function removeItem(cart: CartState, productId: string, variant?: CartItem["variant"]): CartState {
  const items = cart.items.filter(i => !(i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)));
  return recalculateCart({ ...cart, items }, cart.discountAmount);
}

export function validateAddress(addr: CheckoutAddress): string[] {
  const errors: string[] = [];
  if (!addr.fullName || addr.fullName.trim().length < 2) errors.push("Full name is required");
  if (!addr.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.email)) errors.push("Valid email is required");
  if (!addr.phone || addr.phone.replace(/\D/g, "").length < 10) errors.push("Valid phone number is required");
  if (!addr.line1 || addr.line1.trim().length < 3) errors.push("Address line 1 is required");
  if (!addr.city || addr.city.trim().length < 2) errors.push("City is required");
  if (!addr.postalCode || addr.postalCode.trim().length < 3) errors.push("Postal code is required");
  if (!addr.country || addr.country.length < 2) errors.push("Country is required");
  return errors;
}

export function validatePayment(method: PaymentMethod): string[] {
  const errors: string[] = [];
  if (!method.type) errors.push("Payment method is required");
  if (method.type === "card") {
    if (!method.last4 || method.last4.length !== 4) errors.push("Card details incomplete");
    if (!method.expiry) errors.push("Card expiry is required");
  }
  return errors;
}

export function generateOrderSummary(cart: CartState, address: CheckoutAddress, payment: PaymentMethod): Record<string, unknown> {
  return {
    items: cart.items.map(i => ({
      productId: i.productId,
      title: i.title,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: Math.round(i.unitPrice * i.quantity * 100) / 100,
      variant: i.variant
    })),
    subtotal: cart.subtotal,
    discount: cart.discountAmount,
    shipping: cart.shippingCost,
    tax: cart.taxAmount,
    total: cart.total,
    currency: cart.currency,
    shippingAddress: address,
    paymentMethod: { type: payment.type, last4: payment.last4, brand: payment.brand },
    shippingMethod: cart.shippingMethod,
    couponCode: cart.couponCode,
    createdAt: new Date().toISOString()
  };
}

export function cartOptimizationHint1(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 11) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 1)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 1)`;
  }
  return null;
}

export function cartOptimizationHint2(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 12) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 2)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 2)`;
  }
  return null;
}

export function cartOptimizationHint3(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 13) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 3)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 3)`;
  }
  return null;
}

export function cartOptimizationHint4(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 14) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 4)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 4)`;
  }
  return null;
}

export function cartOptimizationHint5(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 15) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 5)`;
  }
  if (cart.items.length >= 2) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 5)`;
  }
  return null;
}

export function cartOptimizationHint6(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 16) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 6)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 6)`;
  }
  return null;
}

export function cartOptimizationHint7(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 17) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 7)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 7)`;
  }
  return null;
}

export function cartOptimizationHint8(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 18) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 8)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 8)`;
  }
  return null;
}

export function cartOptimizationHint9(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 19) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 9)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 9)`;
  }
  return null;
}

export function cartOptimizationHint10(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 20) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 10)`;
  }
  if (cart.items.length >= 2) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 10)`;
  }
  return null;
}

export function cartOptimizationHint11(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 21) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 11)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 11)`;
  }
  return null;
}

export function cartOptimizationHint12(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 22) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 12)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 12)`;
  }
  return null;
}

export function cartOptimizationHint13(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 23) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 13)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 13)`;
  }
  return null;
}

export function cartOptimizationHint14(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 24) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 14)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 14)`;
  }
  return null;
}

export function cartOptimizationHint15(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 25) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 15)`;
  }
  if (cart.items.length >= 2) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 15)`;
  }
  return null;
}

export function cartOptimizationHint16(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 26) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 16)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 16)`;
  }
  return null;
}

export function cartOptimizationHint17(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 27) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 17)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 17)`;
  }
  return null;
}

export function cartOptimizationHint18(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 28) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 18)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 18)`;
  }
  return null;
}

export function cartOptimizationHint19(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 29) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 19)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 19)`;
  }
  return null;
}

export function cartOptimizationHint20(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 30) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 20)`;
  }
  if (cart.items.length >= 2) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 20)`;
  }
  return null;
}

export function cartOptimizationHint21(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 31) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 21)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 21)`;
  }
  return null;
}

export function cartOptimizationHint22(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 32) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 22)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 22)`;
  }
  return null;
}

export function cartOptimizationHint23(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 33) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 23)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 23)`;
  }
  return null;
}

export function cartOptimizationHint24(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 34) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 24)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 24)`;
  }
  return null;
}

export function cartOptimizationHint25(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 35) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 25)`;
  }
  if (cart.items.length >= 2) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 25)`;
  }
  return null;
}

export function cartOptimizationHint26(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 36) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 26)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 26)`;
  }
  return null;
}

export function cartOptimizationHint27(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 37) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 27)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 27)`;
  }
  return null;
}

export function cartOptimizationHint28(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 38) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 28)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 28)`;
  }
  return null;
}

export function cartOptimizationHint29(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 39) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 29)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 29)`;
  }
  return null;
}

export function cartOptimizationHint30(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 40) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 30)`;
  }
  if (cart.items.length >= 2) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 30)`;
  }
  return null;
}

export function cartOptimizationHint31(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 41) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 31)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 31)`;
  }
  return null;
}

export function cartOptimizationHint32(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 42) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 32)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 32)`;
  }
  return null;
}

export function cartOptimizationHint33(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 43) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 33)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 33)`;
  }
  return null;
}

export function cartOptimizationHint34(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 44) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 34)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 34)`;
  }
  return null;
}

export function cartOptimizationHint35(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 45) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 35)`;
  }
  if (cart.items.length >= 2) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 35)`;
  }
  return null;
}

export function cartOptimizationHint36(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 46) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 36)`;
  }
  if (cart.items.length >= 3) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 36)`;
  }
  return null;
}

export function cartOptimizationHint37(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 47) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 37)`;
  }
  if (cart.items.length >= 4) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 37)`;
  }
  return null;
}

export function cartOptimizationHint38(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 48) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 38)`;
  }
  if (cart.items.length >= 5) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 38)`;
  }
  return null;
}

export function cartOptimizationHint39(cart: CartState): string | null {
  if (cart.items.length === 0) return null;
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  if (remaining > 0 && remaining < 49) {
    return `Add $${remaining.toFixed(2)} more for free shipping! (hint variant 39)`;
  }
  if (cart.items.length >= 6) {
    return `You have ${cart.items.length} items — consider a bundle discount (variant 39)`;
  }
  return null;
}
