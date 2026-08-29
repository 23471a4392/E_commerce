/**
 * Oppenheimer Store - Order Fulfillment & Shipping Orchestration
 * Warehouse assignment, carrier selection, label generation helpers,
 * tracking updates, and delivery SLA monitoring.
 */

export interface FulfillmentOrder {
  orderId: string;
  orderNumber: string;
  customerId: string;
  items: FulfillmentLine[];
  shippingAddress: ShippingAddress;
  requestedService: "standard" | "express" | "overnight";
  status: FulfillmentStatus;
  warehouseId?: string;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface FulfillmentLine {
  productId: string;
  sku: string;
  title: string;
  quantity: number;
  quantityFulfilled: number;
  weightOz: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export type FulfillmentStatus =
  | "pending"
  | "allocated"
  | "picking"
  | "packed"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "exception"
  | "cancelled";

export interface WarehouseCapacity {
  warehouseId: string;
  name: string;
  region: string;
  maxDailyOrders: number;
  currentLoad: number;
  supportsOvernight: boolean;
}

export interface CarrierRate {
  carrier: string;
  service: string;
  rate: number;
  estimatedDays: number;
  currency: string;
}

const WAREHOUSES: WarehouseCapacity[] = [
  { warehouseId: "wh-east", name: "East Coast DC", region: "US-EAST", maxDailyOrders: 500, currentLoad: 120, supportsOvernight: true },
  { warehouseId: "wh-west", name: "West Coast DC", region: "US-WEST", maxDailyOrders: 400, currentLoad: 90, supportsOvernight: true },
  { warehouseId: "wh-central", name: "Central Hub", region: "US-CENTRAL", maxDailyOrders: 350, currentLoad: 200, supportsOvernight: false },
];

const CARRIER_BASE_RATES: Record<string, { base: number; perOz: number; days: number }> = {
  "ups-ground": { base: 7.5, perOz: 0.12, days: 5 },
  "ups-2day": { base: 14.0, perOz: 0.25, days: 2 },
  "ups-overnight": { base: 28.0, perOz: 0.45, days: 1 },
  "fedex-ground": { base: 6.9, perOz: 0.11, days: 5 },
  "fedex-express": { base: 16.5, perOz: 0.28, days: 2 },
  "usps-priority": { base: 8.2, perOz: 0.15, days: 3 },
  "dhl-express": { base: 32.0, perOz: 0.5, days: 2 },
};

export function selectWarehouse(
  order: FulfillmentOrder,
  inventoryByWarehouse: Record<string, Record<string, number>>
): string | null {
  const needed = new Map<string, number>();
  for (const line of order.items) {
    needed.set(line.productId, (needed.get(line.productId) || 0) + line.quantity);
  }

  const candidates = WAREHOUSES.filter((w) => {
    if (order.requestedService === "overnight" && !w.supportsOvernight) return false;
    if (w.currentLoad >= w.maxDailyOrders) return false;
    for (const [pid, qty] of needed) {
      const available = inventoryByWarehouse[w.warehouseId]?.[pid] ?? 0;
      if (available < qty) return false;
    }
    return true;
  });

  if (!candidates.length) return null;

  // Prefer lowest load ratio, then region match heuristics
  candidates.sort((a, b) => {
    const loadA = a.currentLoad / a.maxDailyOrders;
    const loadB = b.currentLoad / b.maxDailyOrders;
    return loadA - loadB;
  });

  return candidates[0].warehouseId;
}

export function calculateShippingRates(
  totalWeightOz: number,
  service: "standard" | "express" | "overnight",
  destinationState?: string
): CarrierRate[] {
  const serviceMap: Record<string, string[]> = {
    standard: ["ups-ground", "fedex-ground", "usps-priority"],
    express: ["ups-2day", "fedex-express", "dhl-express"],
    overnight: ["ups-overnight"],
  };

  const codes = serviceMap[service] || serviceMap.standard;
  const rates: CarrierRate[] = [];

  for (const code of codes) {
    const base = CARRIER_BASE_RATES[code];
    if (!base) continue;
    let rate = base.base + totalWeightOz * base.perOz;
    // Simple zone surcharge for remote-ish states
    if (destinationState && ["AK", "HI", "PR"].includes(destinationState)) {
      rate *= 1.35;
    }
    rates.push({
      carrier: code.split("-")[0].toUpperCase(),
      service: code,
      rate: Math.round(rate * 100) / 100,
      estimatedDays: base.days,
      currency: "USD",
    });
  }

  return rates.sort((a, b) => a.rate - b.rate);
}

export function generateTrackingNumber(carrier: string): string {
  const prefix: Record<string, string> = {
    UPS: "1Z",
    FEDEX: "7",
    USPS: "94",
    DHL: "JD",
  };
  const p = prefix[carrier.toUpperCase()] || "TR";
  const rand = Math.random().toString(36).slice(2, 12).toUpperCase();
  return `${p}${Date.now().toString(36).toUpperCase()}${rand}`;
}

export function advanceFulfillmentStatus(
  order: FulfillmentOrder,
  next: FulfillmentStatus
): FulfillmentOrder {
  const allowed: Record<FulfillmentStatus, FulfillmentStatus[]> = {
    pending: ["allocated", "cancelled"],
    allocated: ["picking", "cancelled"],
    picking: ["packed", "exception"],
    packed: ["shipped", "exception"],
    shipped: ["in_transit", "exception"],
    in_transit: ["delivered", "exception"],
    delivered: [],
    exception: ["picking", "packed", "cancelled"],
    cancelled: [],
  };

  if (!allowed[order.status]?.includes(next)) {
    throw new Error(`Invalid transition ${order.status} -> ${next}`);
  }

  const updated = { ...order, status: next };
  if (next === "shipped") {
    updated.shippedAt = new Date().toISOString();
    if (!updated.trackingNumber && updated.carrier) {
      updated.trackingNumber = generateTrackingNumber(updated.carrier);
    }
  }
  if (next === "delivered") {
    updated.deliveredAt = new Date().toISOString();
  }
  return updated;
}

export function estimateDeliverySLA(
  shippedAt: string,
  service: "standard" | "express" | "overnight"
): { promisedBy: string; isAtRisk: boolean; hoursRemaining: number } {
  const days = service === "overnight" ? 1 : service === "express" ? 2 : 5;
  const shipped = new Date(shippedAt);
  const promised = new Date(shipped.getTime() + days * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const hoursRemaining = (promised.getTime() - now) / (1000 * 60 * 60);
  return {
    promisedBy: promised.toISOString(),
    isAtRisk: hoursRemaining < 12 && hoursRemaining > 0,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
  };
}

export function packSlipSummary(order: FulfillmentOrder): string {
  const lines = order.items.map(
    (i) => `  - ${i.sku} x${i.quantity}: ${i.title}`
  );
  return [
    `Pack Slip — Order ${order.orderNumber}`,
    `Ship to: ${order.shippingAddress.name}`,
    `  ${order.shippingAddress.line1}`,
    `  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
    `Service: ${order.requestedService}`,
    `Items:`,
    ...lines,
    `Warehouse: ${order.warehouseId || "TBD"}`,
  ].join("\n");
}

export function warehouseScoreVariant1(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 51);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant2(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 52);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant3(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 53);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant4(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 54);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant5(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 55);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant6(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 56);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant7(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 57);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant8(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 58);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant9(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 59);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant10(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 60);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant11(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 61);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant12(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 62);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant13(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 63);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant14(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 64);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant15(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 65);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant16(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 66);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant17(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 67);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant18(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 68);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant19(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 69);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant20(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 70);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant21(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 71);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant22(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 72);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant23(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 73);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant24(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 74);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant25(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 75);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant26(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 76);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant27(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 77);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant28(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 78);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant29(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 79);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant30(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 80);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant31(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 81);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant32(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 82);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant33(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 83);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant34(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 84);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant35(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 85);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant36(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 86);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant37(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 87);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant38(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 88);
  return Math.round(score * 10) / 10;
}

export function warehouseScoreVariant39(
  warehouse: WarehouseCapacity,
  orderWeightOz: number,
  preferRegion?: string
): number {
  let score = 100 - (warehouse.currentLoad / warehouse.maxDailyOrders) * 50;
  if (preferRegion && warehouse.region.includes(preferRegion)) score += 15;
  if (warehouse.supportsOvernight) score += 5;
  score -= Math.min(20, orderWeightOz / 89);
  return Math.round(score * 10) / 10;
}
