export type StockMovementType = 'purchase_receipt' | 'order_fulfillment' | 'customer_return' | 'manual_adjustment' | 'damage_writeoff' | 'transfer';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPhone: string;
  contactEmail: string;
  isPrimary: boolean;
  active: boolean;
}

export interface InventoryItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  binLocation?: string;
  lastCountedAt?: string;
}

export interface StockMovementLog {
  id: string;
  inventoryItemId: string;
  productId: string;
  sku: string;
  warehouseId: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  quantityAfter: number;
  referenceId?: string; // orderId, returnId, purchaseOrderId
  notes?: string;
  performedByUserId: string;
  timestamp: string;
}

export interface PurchaseOrderLineItem {
  productId: string;
  variantId?: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  items: PurchaseOrderLineItem[];
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalCost: number;
  status: 'draft' | 'ordered' | 'partially_received' | 'completed' | 'cancelled';
  expectedDeliveryDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
