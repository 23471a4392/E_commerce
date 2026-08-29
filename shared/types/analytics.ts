export interface DashboardMetrics {
  totalRevenue: number;
  revenueGrowthPercent: number;
  totalOrders: number;
  ordersGrowthPercent: number;
  averageOrderValue: number;
  aovGrowthPercent: number;
  totalCustomers: number;
  customersGrowthPercent: number;
}

export interface MonthlySalesData {
  month: string; // e.g. "Jan", "Feb"
  revenue: number;
  orders: number;
}

export interface CategoryRevenueData {
  categoryName: string;
  revenue: number;
  percentage: number;
}

export interface TopProductMetric {
  id: string;
  title: string;
  thumbnail: string;
  categoryName: string;
  price: number;
  totalUnitsSold: number;
  totalRevenue: number;
  stockQuantity: number;
}
