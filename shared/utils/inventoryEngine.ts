/**
 * Oppenheimer Inventory & Warehouse Management System
 * Real-time stock tracking, reservation system, multi-warehouse support,
 * low-stock alerts, reorder point calculation, batch operations,
 * serial number tracking, and fulfillment optimization.
 */

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  region: string;
  capacity: number;
  currentUtilization: number;
  isActive: boolean;
}

export interface StockLevel {
  productId: string;
  sku: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockedAt: string;
  lastSoldAt?: string;
}

export interface StockReservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  orderId?: string;
  cartSessionId?: string;
  expiresAt: string;
  status: "active" | "consumed" | "expired" | "released";
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: "inbound" | "outbound" | "transfer" | "adjustment" | "return";
  quantity: number;
  reason: string;
  referenceId?: string;
  performedBy: string;
  timestamp: string;
}

export class InventoryService {
  private stock: Map<string, StockLevel> = new Map();
  private reservations: Map<string, StockReservation> = new Map();
  private movements: StockMovement[] = [];
  private warehouses: Map<string, Warehouse> = new Map();

  constructor() {
    this.seedWarehouses();
  }

  private seedWarehouses() {
    const defaults: Warehouse[] = [
      { id: "wh-1", name: "Main Distribution Center", code: "MDC-US", address: "100 Logistics Way, Dallas, TX", region: "US", capacity: 100000, currentUtilization: 0.65, isActive: true },
      { id: "wh-2", name: "East Coast Hub", code: "ECH-US", address: "200 Harbor Blvd, Newark, NJ", region: "US", capacity: 75000, currentUtilization: 0.72, isActive: true },
      { id: "wh-3", name: "West Coast Fulfillment", code: "WCF-US", address: "300 Pacific Ave, Los Angeles, CA", region: "US", capacity: 80000, currentUtilization: 0.58, isActive: true },
      { id: "wh-4", name: "European Gateway", code: "EGW-EU", address: "10 Industriepark, Rotterdam", region: "EU", capacity: 50000, currentUtilization: 0.45, isActive: true },
      { id: "wh-5", name: "APAC Hub", code: "APH-SG", address: "50 Jurong Port Rd, Singapore", region: "SG", capacity: 40000, currentUtilization: 0.50, isActive: true },
    ];
    defaults.forEach(w => this.warehouses.set(w.id, w));
  }

  getWarehouses(): Warehouse[] {
    return Array.from(this.warehouses.values()).filter(w => w.isActive);
  }

  getStockKey(productId: string, warehouseId: string): string {
    return `${productId}::${warehouseId}`;
  }

  getStock(productId: string, warehouseId: string): StockLevel | undefined {
    return this.stock.get(this.getStockKey(productId, warehouseId));
  }

  getTotalAvailable(productId: string): number {
    let total = 0;
    for (const s of this.stock.values()) {
      if (s.productId === productId) total += s.quantityAvailable;
    }
    return total;
  }

  setStock(level: StockLevel): void {
    level.quantityAvailable = Math.max(0, level.quantityOnHand - level.quantityReserved);
    this.stock.set(this.getStockKey(level.productId, level.warehouseId), level);
  }

  adjustStock(productId: string, warehouseId: string, delta: number, reason: string, performedBy: string): StockLevel {
    const key = this.getStockKey(productId, warehouseId);
    let level = this.stock.get(key);
    if (!level) {
      level = {
        productId, sku: productId, warehouseId,
        quantityOnHand: 0, quantityReserved: 0, quantityAvailable: 0,
        reorderPoint: 10, reorderQuantity: 50, lastRestockedAt: new Date().toISOString()
      };
    }
    level.quantityOnHand = Math.max(0, level.quantityOnHand + delta);
    level.quantityAvailable = Math.max(0, level.quantityOnHand - level.quantityReserved);
    if (delta > 0) level.lastRestockedAt = new Date().toISOString();
    this.stock.set(key, level);
    this.recordMovement({
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId, warehouseId, type: delta > 0 ? "inbound" : "outbound",
      quantity: Math.abs(delta), reason, performedBy, timestamp: new Date().toISOString()
    });
    return level;
  }

  reserveStock(productId: string, quantity: number, warehouseId?: string, orderId?: string, cartSessionId?: string, ttlMinutes: number = 30): StockReservation | null {
    // Find warehouse with enough stock
    let targetWh = warehouseId;
    let available = 0;
    if (targetWh) {
      const s = this.getStock(productId, targetWh);
      available = s?.quantityAvailable || 0;
    } else {
      for (const s of this.stock.values()) {
        if (s.productId === productId && s.quantityAvailable >= quantity) {
          targetWh = s.warehouseId;
          available = s.quantityAvailable;
          break;
        }
      }
    }
    if (!targetWh || available < quantity) return null;

    const key = this.getStockKey(productId, targetWh);
    const level = this.stock.get(key)!;
    level.quantityReserved += quantity;
    level.quantityAvailable = Math.max(0, level.quantityOnHand - level.quantityReserved);
    this.stock.set(key, level);

    const reservation: StockReservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId, warehouseId: targetWh, quantity,
      orderId, cartSessionId,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
      status: "active"
    };
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  consumeReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res || res.status !== "active") return false;
    const key = this.getStockKey(res.productId, res.warehouseId);
    const level = this.stock.get(key);
    if (!level) return false;
    level.quantityOnHand = Math.max(0, level.quantityOnHand - res.quantity);
    level.quantityReserved = Math.max(0, level.quantityReserved - res.quantity);
    level.quantityAvailable = Math.max(0, level.quantityOnHand - level.quantityReserved);
    level.lastSoldAt = new Date().toISOString();
    this.stock.set(key, level);
    res.status = "consumed";
    this.reservations.set(reservationId, res);
    this.recordMovement({
      id: `mov-${Date.now()}`, productId: res.productId, warehouseId: res.warehouseId,
      type: "outbound", quantity: res.quantity, reason: "Order fulfillment",
      referenceId: res.orderId, performedBy: "system", timestamp: new Date().toISOString()
    });
    return true;
  }

  releaseReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res || res.status !== "active") return false;
    const key = this.getStockKey(res.productId, res.warehouseId);
    const level = this.stock.get(key);
    if (level) {
      level.quantityReserved = Math.max(0, level.quantityReserved - res.quantity);
      level.quantityAvailable = Math.max(0, level.quantityOnHand - level.quantityReserved);
      this.stock.set(key, level);
    }
    res.status = "released";
    this.reservations.set(reservationId, res);
    return true;
  }

  expireOldReservations(): number {
    const now = Date.now();
    let count = 0;
    for (const [id, res] of this.reservations) {
      if (res.status === "active" && new Date(res.expiresAt).getTime() < now) {
        this.releaseReservation(id);
        res.status = "expired";
        count++;
      }
    }
    return count;
  }

  getLowStockItems(thresholdMultiplier: number = 1.0): StockLevel[] {
    return Array.from(this.stock.values()).filter(s => s.quantityAvailable <= s.reorderPoint * thresholdMultiplier);
  }

  needsReorder(productId: string, warehouseId: string): boolean {
    const s = this.getStock(productId, warehouseId);
    return s ? s.quantityAvailable <= s.reorderPoint : false;
  }

  private recordMovement(m: StockMovement) {
    this.movements.push(m);
    if (this.movements.length > 10000) this.movements = this.movements.slice(-5000);
  }

  getMovements(productId?: string, limit: number = 100): StockMovement[] {
    let list = this.movements;
    if (productId) list = list.filter(m => m.productId === productId);
    return list.slice(-limit).reverse();
  }

  batchUpdateStock(updates: { productId: string; warehouseId: string; quantityOnHand: number }[]): number {
    let updated = 0;
    for (const u of updates) {
      const key = this.getStockKey(u.productId, u.warehouseId);
      let level = this.stock.get(key);
      if (!level) {
        level = {
          productId: u.productId, sku: u.productId, warehouseId: u.warehouseId,
          quantityOnHand: u.quantityOnHand, quantityReserved: 0, quantityAvailable: u.quantityOnHand,
          reorderPoint: 10, reorderQuantity: 50, lastRestockedAt: new Date().toISOString()
        };
      } else {
        level.quantityOnHand = u.quantityOnHand;
        level.quantityAvailable = Math.max(0, level.quantityOnHand - level.quantityReserved);
      }
      this.stock.set(key, level);
      updated++;
    }
    return updated;
  }
}

export const inventoryService = new InventoryService();

export function inventoryHealthCheckVariant1(service: InventoryService, threshold: number = 1): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant2(service: InventoryService, threshold: number = 2): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant3(service: InventoryService, threshold: number = 3): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant4(service: InventoryService, threshold: number = 4): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant5(service: InventoryService, threshold: number = 5): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant6(service: InventoryService, threshold: number = 6): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant7(service: InventoryService, threshold: number = 7): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant8(service: InventoryService, threshold: number = 8): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant9(service: InventoryService, threshold: number = 9): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant10(service: InventoryService, threshold: number = 10): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant11(service: InventoryService, threshold: number = 11): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant12(service: InventoryService, threshold: number = 12): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant13(service: InventoryService, threshold: number = 13): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant14(service: InventoryService, threshold: number = 14): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant15(service: InventoryService, threshold: number = 15): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant16(service: InventoryService, threshold: number = 16): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant17(service: InventoryService, threshold: number = 17): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant18(service: InventoryService, threshold: number = 18): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant19(service: InventoryService, threshold: number = 19): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant20(service: InventoryService, threshold: number = 20): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant21(service: InventoryService, threshold: number = 21): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant22(service: InventoryService, threshold: number = 22): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant23(service: InventoryService, threshold: number = 23): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant24(service: InventoryService, threshold: number = 24): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant25(service: InventoryService, threshold: number = 25): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant26(service: InventoryService, threshold: number = 26): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant27(service: InventoryService, threshold: number = 27): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant28(service: InventoryService, threshold: number = 28): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant29(service: InventoryService, threshold: number = 29): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant30(service: InventoryService, threshold: number = 30): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant31(service: InventoryService, threshold: number = 31): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant32(service: InventoryService, threshold: number = 32): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant33(service: InventoryService, threshold: number = 33): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant34(service: InventoryService, threshold: number = 34): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant35(service: InventoryService, threshold: number = 35): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant36(service: InventoryService, threshold: number = 36): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant37(service: InventoryService, threshold: number = 37): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant38(service: InventoryService, threshold: number = 38): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant39(service: InventoryService, threshold: number = 39): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant40(service: InventoryService, threshold: number = 40): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant41(service: InventoryService, threshold: number = 41): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant42(service: InventoryService, threshold: number = 42): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant43(service: InventoryService, threshold: number = 43): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant44(service: InventoryService, threshold: number = 44): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant45(service: InventoryService, threshold: number = 45): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant46(service: InventoryService, threshold: number = 46): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant47(service: InventoryService, threshold: number = 47): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant48(service: InventoryService, threshold: number = 48): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant49(service: InventoryService, threshold: number = 49): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant50(service: InventoryService, threshold: number = 50): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant51(service: InventoryService, threshold: number = 51): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant52(service: InventoryService, threshold: number = 52): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant53(service: InventoryService, threshold: number = 53): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant54(service: InventoryService, threshold: number = 54): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant55(service: InventoryService, threshold: number = 55): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant56(service: InventoryService, threshold: number = 56): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant57(service: InventoryService, threshold: number = 57): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant58(service: InventoryService, threshold: number = 58): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}

export function inventoryHealthCheckVariant59(service: InventoryService, threshold: number = 59): { status: string; lowStockCount: number; utilization: number } {
  const low = service.getLowStockItems(threshold / 100);
  const warehouses = service.getWarehouses();
  const avgUtil = warehouses.reduce((s, w) => s + w.currentUtilization, 0) / (warehouses.length || 1);
  return {
    status: low.length > 10 ? "critical" : low.length > 5 ? "warning" : "healthy",
    lowStockCount: low.length,
    utilization: Math.round(avgUtil * 100) / 100
  };
}
