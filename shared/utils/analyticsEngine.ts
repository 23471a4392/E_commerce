/**
 * Oppenheimer Analytics & Business Intelligence Engine
 * KPI computation, cohort analysis, revenue attribution, conversion funnels,
 * customer lifetime value, churn prediction helpers, and dashboard aggregations.
 */

export interface DailyMetric {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  sessions: number;
  conversionRate: number;
  averageOrderValue: number;
  unitsSold: number;
  refunds: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  revenue: number;
  units: number;
  orders: number;
  avgPrice: number;
  margin: number;
  growthRate: number;
}

export interface ProductPerformance {
  productId: string;
  title: string;
  sku: string;
  revenue: number;
  unitsSold: number;
  views: number;
  conversionRate: number;
  rating: number;
  returnRate: number;
}

export interface CustomerSegment {
  segmentId: string;
  name: string;
  customerCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgOrdersPerCustomer: number;
  churnRisk: number;
  lifetimeValue: number;
}

export function computeKPIs(metrics: DailyMetric[]): {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  overallConversion: number;
  revenueGrowth: number;
  orderGrowth: number;
} {
  if (!metrics.length) {
    return { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, avgOrderValue: 0, overallConversion: 0, revenueGrowth: 0, orderGrowth: 0 };
  }
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = metrics.reduce((s, m) => s + m.orders, 0);
  const totalCustomers = metrics.reduce((s, m) => s + m.customers, 0);
  const totalSessions = metrics.reduce((s, m) => s + m.sessions, 0);
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const overallConversion = totalSessions ? (totalOrders / totalSessions) * 100 : 0;

  // Growth vs previous period (assume second half vs first half)
  const mid = Math.floor(metrics.length / 2);
  const first = metrics.slice(0, mid);
  const second = metrics.slice(mid);
  const firstRev = first.reduce((s, m) => s + m.revenue, 0) || 1;
  const secondRev = second.reduce((s, m) => s + m.revenue, 0);
  const firstOrd = first.reduce((s, m) => s + m.orders, 0) || 1;
  const secondOrd = second.reduce((s, m) => s + m.orders, 0);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    totalCustomers,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    overallConversion: Math.round(overallConversion * 100) / 100,
    revenueGrowth: Math.round(((secondRev - firstRev) / firstRev) * 10000) / 100,
    orderGrowth: Math.round(((secondOrd - firstOrd) / firstOrd) * 10000) / 100,
  };
}

export function computeCategoryBreakdown(products: ProductPerformance[], categoryMap: Record<string, string>): CategoryPerformance[] {
  const map = new Map<string, CategoryPerformance>();
  for (const p of products) {
    const catId = categoryMap[p.productId] || "unknown";
    const catName = catId; // simplified
    let entry = map.get(catId);
    if (!entry) {
      entry = { categoryId: catId, categoryName: catName, revenue: 0, units: 0, orders: 0, avgPrice: 0, margin: 0.3, growthRate: 0 };
      map.set(catId, entry);
    }
    entry.revenue += p.revenue;
    entry.units += p.unitsSold;
  }
  return Array.from(map.values()).map(c => ({
    ...c,
    avgPrice: c.units ? c.revenue / c.units : 0,
    growthRate: Math.random() * 20 - 5 // placeholder
  })).sort((a, b) => b.revenue - a.revenue);
}

export function estimateCLV(avgOrderValue: number, purchaseFrequency: number, customerLifespanYears: number, margin: number = 0.3): number {
  return Math.round(avgOrderValue * purchaseFrequency * customerLifespanYears * margin * 100) / 100;
}

export function churnProbability(daysSinceLastOrder: number, avgDaysBetweenOrders: number, totalOrders: number): number {
  if (totalOrders < 2) return 0.4;
  const expected = avgDaysBetweenOrders * 2;
  if (daysSinceLastOrder < expected) return 0.1;
  if (daysSinceLastOrder < expected * 1.5) return 0.3;
  if (daysSinceLastOrder < expected * 2) return 0.55;
  return 0.8;
}

export function funnelConversion(stages: { name: string; count: number }[]): { stage: string; count: number; conversionFromPrev: number; overallConversion: number }[] {
  if (!stages.length) return [];
  const first = stages[0].count || 1;
  return stages.map((s, i) => ({
    stage: s.name,
    count: s.count,
    conversionFromPrev: i === 0 ? 100 : Math.round((s.count / (stages[i - 1].count || 1)) * 10000) / 100,
    overallConversion: Math.round((s.count / first) * 10000) / 100
  }));
}

export function generateSparklineData(metrics: DailyMetric[], field: keyof DailyMetric, days: number = 30): number[] {
  return metrics.slice(-days).map(m => Number(m[field]) || 0);
}

export function topProductsByRevenue(products: ProductPerformance[], limit: number = 10): ProductPerformance[] {
  return [...products].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function topProductsByConversion(products: ProductPerformance[], minViews: number = 50, limit: number = 10): ProductPerformance[] {
  return [...products]
    .filter(p => p.views >= minViews)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, limit);
}

export function metricAggregationVariant1(metrics: DailyMetric[], windowDays: number = 2): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant2(metrics: DailyMetric[], windowDays: number = 3): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant3(metrics: DailyMetric[], windowDays: number = 4): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant4(metrics: DailyMetric[], windowDays: number = 5): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant5(metrics: DailyMetric[], windowDays: number = 6): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant6(metrics: DailyMetric[], windowDays: number = 7): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant7(metrics: DailyMetric[], windowDays: number = 8): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant8(metrics: DailyMetric[], windowDays: number = 9): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant9(metrics: DailyMetric[], windowDays: number = 10): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant10(metrics: DailyMetric[], windowDays: number = 11): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant11(metrics: DailyMetric[], windowDays: number = 12): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant12(metrics: DailyMetric[], windowDays: number = 13): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant13(metrics: DailyMetric[], windowDays: number = 14): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant14(metrics: DailyMetric[], windowDays: number = 15): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant15(metrics: DailyMetric[], windowDays: number = 16): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant16(metrics: DailyMetric[], windowDays: number = 17): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant17(metrics: DailyMetric[], windowDays: number = 18): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant18(metrics: DailyMetric[], windowDays: number = 19): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant19(metrics: DailyMetric[], windowDays: number = 20): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant20(metrics: DailyMetric[], windowDays: number = 21): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant21(metrics: DailyMetric[], windowDays: number = 22): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant22(metrics: DailyMetric[], windowDays: number = 23): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant23(metrics: DailyMetric[], windowDays: number = 24): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant24(metrics: DailyMetric[], windowDays: number = 25): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant25(metrics: DailyMetric[], windowDays: number = 26): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant26(metrics: DailyMetric[], windowDays: number = 27): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant27(metrics: DailyMetric[], windowDays: number = 28): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant28(metrics: DailyMetric[], windowDays: number = 29): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant29(metrics: DailyMetric[], windowDays: number = 30): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant30(metrics: DailyMetric[], windowDays: number = 1): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant31(metrics: DailyMetric[], windowDays: number = 2): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant32(metrics: DailyMetric[], windowDays: number = 3): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant33(metrics: DailyMetric[], windowDays: number = 4): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant34(metrics: DailyMetric[], windowDays: number = 5): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant35(metrics: DailyMetric[], windowDays: number = 6): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant36(metrics: DailyMetric[], windowDays: number = 7): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant37(metrics: DailyMetric[], windowDays: number = 8): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant38(metrics: DailyMetric[], windowDays: number = 9): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant39(metrics: DailyMetric[], windowDays: number = 10): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant40(metrics: DailyMetric[], windowDays: number = 11): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant41(metrics: DailyMetric[], windowDays: number = 12): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant42(metrics: DailyMetric[], windowDays: number = 13): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant43(metrics: DailyMetric[], windowDays: number = 14): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant44(metrics: DailyMetric[], windowDays: number = 15): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant45(metrics: DailyMetric[], windowDays: number = 16): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant46(metrics: DailyMetric[], windowDays: number = 17): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant47(metrics: DailyMetric[], windowDays: number = 18): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant48(metrics: DailyMetric[], windowDays: number = 19): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant49(metrics: DailyMetric[], windowDays: number = 20): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant50(metrics: DailyMetric[], windowDays: number = 21): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant51(metrics: DailyMetric[], windowDays: number = 22): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant52(metrics: DailyMetric[], windowDays: number = 23): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant53(metrics: DailyMetric[], windowDays: number = 24): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant54(metrics: DailyMetric[], windowDays: number = 25): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant55(metrics: DailyMetric[], windowDays: number = 26): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant56(metrics: DailyMetric[], windowDays: number = 27): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant57(metrics: DailyMetric[], windowDays: number = 28): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant58(metrics: DailyMetric[], windowDays: number = 29): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant59(metrics: DailyMetric[], windowDays: number = 30): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant60(metrics: DailyMetric[], windowDays: number = 1): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant61(metrics: DailyMetric[], windowDays: number = 2): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant62(metrics: DailyMetric[], windowDays: number = 3): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant63(metrics: DailyMetric[], windowDays: number = 4): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant64(metrics: DailyMetric[], windowDays: number = 5): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant65(metrics: DailyMetric[], windowDays: number = 6): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant66(metrics: DailyMetric[], windowDays: number = 7): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant67(metrics: DailyMetric[], windowDays: number = 8): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant68(metrics: DailyMetric[], windowDays: number = 9): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant69(metrics: DailyMetric[], windowDays: number = 10): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant70(metrics: DailyMetric[], windowDays: number = 11): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant71(metrics: DailyMetric[], windowDays: number = 12): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant72(metrics: DailyMetric[], windowDays: number = 13): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant73(metrics: DailyMetric[], windowDays: number = 14): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant74(metrics: DailyMetric[], windowDays: number = 15): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant75(metrics: DailyMetric[], windowDays: number = 16): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant76(metrics: DailyMetric[], windowDays: number = 17): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant77(metrics: DailyMetric[], windowDays: number = 18): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant78(metrics: DailyMetric[], windowDays: number = 19): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant79(metrics: DailyMetric[], windowDays: number = 20): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant80(metrics: DailyMetric[], windowDays: number = 21): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant81(metrics: DailyMetric[], windowDays: number = 22): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant82(metrics: DailyMetric[], windowDays: number = 23): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant83(metrics: DailyMetric[], windowDays: number = 24): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant84(metrics: DailyMetric[], windowDays: number = 25): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant85(metrics: DailyMetric[], windowDays: number = 26): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant86(metrics: DailyMetric[], windowDays: number = 27): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant87(metrics: DailyMetric[], windowDays: number = 28): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant88(metrics: DailyMetric[], windowDays: number = 29): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant89(metrics: DailyMetric[], windowDays: number = 30): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant90(metrics: DailyMetric[], windowDays: number = 1): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant91(metrics: DailyMetric[], windowDays: number = 2): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant92(metrics: DailyMetric[], windowDays: number = 3): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant93(metrics: DailyMetric[], windowDays: number = 4): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant94(metrics: DailyMetric[], windowDays: number = 5): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant95(metrics: DailyMetric[], windowDays: number = 6): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant96(metrics: DailyMetric[], windowDays: number = 7): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant97(metrics: DailyMetric[], windowDays: number = 8): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant98(metrics: DailyMetric[], windowDays: number = 9): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant99(metrics: DailyMetric[], windowDays: number = 10): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant100(metrics: DailyMetric[], windowDays: number = 11): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant101(metrics: DailyMetric[], windowDays: number = 12): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant102(metrics: DailyMetric[], windowDays: number = 13): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant103(metrics: DailyMetric[], windowDays: number = 14): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant104(metrics: DailyMetric[], windowDays: number = 15): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant105(metrics: DailyMetric[], windowDays: number = 16): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant106(metrics: DailyMetric[], windowDays: number = 17): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant107(metrics: DailyMetric[], windowDays: number = 18): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant108(metrics: DailyMetric[], windowDays: number = 19): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant109(metrics: DailyMetric[], windowDays: number = 20): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant110(metrics: DailyMetric[], windowDays: number = 21): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant111(metrics: DailyMetric[], windowDays: number = 22): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant112(metrics: DailyMetric[], windowDays: number = 23): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant113(metrics: DailyMetric[], windowDays: number = 24): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant114(metrics: DailyMetric[], windowDays: number = 25): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant115(metrics: DailyMetric[], windowDays: number = 26): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant116(metrics: DailyMetric[], windowDays: number = 27): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant117(metrics: DailyMetric[], windowDays: number = 28): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant118(metrics: DailyMetric[], windowDays: number = 29): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant119(metrics: DailyMetric[], windowDays: number = 30): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant120(metrics: DailyMetric[], windowDays: number = 1): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant121(metrics: DailyMetric[], windowDays: number = 2): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant122(metrics: DailyMetric[], windowDays: number = 3): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant123(metrics: DailyMetric[], windowDays: number = 4): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant124(metrics: DailyMetric[], windowDays: number = 5): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant125(metrics: DailyMetric[], windowDays: number = 6): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant126(metrics: DailyMetric[], windowDays: number = 7): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant127(metrics: DailyMetric[], windowDays: number = 8): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant128(metrics: DailyMetric[], windowDays: number = 9): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant129(metrics: DailyMetric[], windowDays: number = 10): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant130(metrics: DailyMetric[], windowDays: number = 11): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant131(metrics: DailyMetric[], windowDays: number = 12): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant132(metrics: DailyMetric[], windowDays: number = 13): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant133(metrics: DailyMetric[], windowDays: number = 14): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant134(metrics: DailyMetric[], windowDays: number = 15): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant135(metrics: DailyMetric[], windowDays: number = 16): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant136(metrics: DailyMetric[], windowDays: number = 17): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant137(metrics: DailyMetric[], windowDays: number = 18): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant138(metrics: DailyMetric[], windowDays: number = 19): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant139(metrics: DailyMetric[], windowDays: number = 20): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant140(metrics: DailyMetric[], windowDays: number = 21): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant141(metrics: DailyMetric[], windowDays: number = 22): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant142(metrics: DailyMetric[], windowDays: number = 23): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant143(metrics: DailyMetric[], windowDays: number = 24): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant144(metrics: DailyMetric[], windowDays: number = 25): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant145(metrics: DailyMetric[], windowDays: number = 26): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant146(metrics: DailyMetric[], windowDays: number = 27): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant147(metrics: DailyMetric[], windowDays: number = 28): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant148(metrics: DailyMetric[], windowDays: number = 29): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant149(metrics: DailyMetric[], windowDays: number = 30): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant150(metrics: DailyMetric[], windowDays: number = 1): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant151(metrics: DailyMetric[], windowDays: number = 2): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant152(metrics: DailyMetric[], windowDays: number = 3): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant153(metrics: DailyMetric[], windowDays: number = 4): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant154(metrics: DailyMetric[], windowDays: number = 5): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant155(metrics: DailyMetric[], windowDays: number = 6): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant156(metrics: DailyMetric[], windowDays: number = 7): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant157(metrics: DailyMetric[], windowDays: number = 8): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant158(metrics: DailyMetric[], windowDays: number = 9): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant159(metrics: DailyMetric[], windowDays: number = 10): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant160(metrics: DailyMetric[], windowDays: number = 11): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant161(metrics: DailyMetric[], windowDays: number = 12): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant162(metrics: DailyMetric[], windowDays: number = 13): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant163(metrics: DailyMetric[], windowDays: number = 14): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant164(metrics: DailyMetric[], windowDays: number = 15): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant165(metrics: DailyMetric[], windowDays: number = 16): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant166(metrics: DailyMetric[], windowDays: number = 17): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant167(metrics: DailyMetric[], windowDays: number = 18): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant168(metrics: DailyMetric[], windowDays: number = 19): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant169(metrics: DailyMetric[], windowDays: number = 20): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant170(metrics: DailyMetric[], windowDays: number = 21): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant171(metrics: DailyMetric[], windowDays: number = 22): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant172(metrics: DailyMetric[], windowDays: number = 23): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant173(metrics: DailyMetric[], windowDays: number = 24): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant174(metrics: DailyMetric[], windowDays: number = 25): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant175(metrics: DailyMetric[], windowDays: number = 26): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant176(metrics: DailyMetric[], windowDays: number = 27): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant177(metrics: DailyMetric[], windowDays: number = 28): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant178(metrics: DailyMetric[], windowDays: number = 29): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}

export function metricAggregationVariant179(metrics: DailyMetric[], windowDays: number = 30): DailyMetric {
  const slice = metrics.slice(-windowDays);
  if (!slice.length) {
    return { date: new Date().toISOString().slice(0, 10), revenue: 0, orders: 0, customers: 0, sessions: 0, conversionRate: 0, averageOrderValue: 0, unitsSold: 0, refunds: 0, newCustomers: 0, returningCustomers: 0 };
  }
  const revenue = slice.reduce((s, m) => s + m.revenue, 0);
  const orders = slice.reduce((s, m) => s + m.orders, 0);
  const customers = slice.reduce((s, m) => s + m.customers, 0);
  const sessions = slice.reduce((s, m) => s + m.sessions, 0);
  const unitsSold = slice.reduce((s, m) => s + m.unitsSold, 0);
  const refunds = slice.reduce((s, m) => s + m.refunds, 0);
  const newCustomers = slice.reduce((s, m) => s + m.newCustomers, 0);
  const returningCustomers = slice.reduce((s, m) => s + m.returningCustomers, 0);
  return {
    date: slice[slice.length - 1].date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    customers,
    sessions,
    conversionRate: sessions ? Math.round((orders / sessions) * 10000) / 100 : 0,
    averageOrderValue: orders ? Math.round((revenue / orders) * 100) / 100 : 0,
    unitsSold,
    refunds,
    newCustomers,
    returningCustomers
  };
}
