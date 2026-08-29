export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface VendorPayout {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_transfer' | 'stripe_connect' | 'paypal';
  transactionReference: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  processedAt?: string;
}

export interface VendorCommissionRule {
  id: string;
  vendorId?: string; // null means global default
  categorySlug?: string;
  commissionPercentage: number;
  flatFeePerOrder?: number;
}

export interface VendorStore {
  id: string;
  vendorId: string;
  storeName: string;
  storeSlug: string;
  logoUrl?: string;
  bannerUrl?: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalRevenue: number;
  status: VendorStatus;
  joinedAt: string;
}

export interface Vendor {
  id: string;
  userId: string;
  companyName: string;
  taxId: string;
  businessType: 'corporation' | 'llc' | 'sole_proprietorship';
  store: VendorStore;
  commissionRule: VendorCommissionRule;
  bankAccountDetails: {
    bankName: string;
    accountNumberLastFour: string;
    routingNumber: string;
    accountHolderName: string;
  };
  createdAt: string;
  updatedAt: string;
}
