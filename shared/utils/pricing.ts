export interface CurrencyRate {
  code: string;
  symbol: string;
  rateVsUSD: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', symbol: '$', rateVsUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', rateVsUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', rateVsUSD: 0.79 },
  CAD: { code: 'CAD', symbol: 'CA$', rateVsUSD: 1.36 },
  AUD: { code: 'AUD', symbol: 'A$', rateVsUSD: 1.52 },
  JPY: { code: 'JPY', symbol: '¥', rateVsUSD: 156.4 },
  CHF: { code: 'CHF', symbol: 'CHF', rateVsUSD: 0.91 },
  CNY: { code: 'CNY', symbol: '¥', rateVsUSD: 7.24 },
  INR: { code: 'INR', symbol: '₹', rateVsUSD: 83.2 },
  SGD: { code: 'SGD', symbol: 'S$', rateVsUSD: 1.35 },
};

export const STATE_TAX_RATES: Record<string, number> = {
  CA: 0.0825,
  NY: 0.08875,
  TX: 0.0825,
  FL: 0.06,
  IL: 0.0875,
  WA: 0.092,
  PA: 0.06,
  OH: 0.0725,
  GA: 0.07,
  NC: 0.0675,
  DEFAULT: 0.08,
};

export class PricingEngine {
  public static convertCurrency(amountUSD: number, targetCurrency: string): { amount: number; symbol: string } {
    const currency = SUPPORTED_CURRENCIES[targetCurrency.toUpperCase()] || SUPPORTED_CURRENCIES.USD;
    const converted = amountUSD * currency.rateVsUSD;
    return {
      amount: parseFloat(converted.toFixed(currency.code === 'JPY' ? 0 : 2)),
      symbol: currency.symbol,
    };
  }

  public static calculateStateTax(subtotalAfterDiscount: number, stateCode: string): number {
    const rate = STATE_TAX_RATES[stateCode.toUpperCase()] || STATE_TAX_RATES.DEFAULT;
    return parseFloat((subtotalAfterDiscount * rate).toFixed(2));
  }

  public static calculateVolumeDiscount(unitPrice: number, quantity: number): { unitPrice: number; discountPercentage: number } {
    if (quantity >= 50) return { unitPrice: unitPrice * 0.85, discountPercentage: 15 };
    if (quantity >= 20) return { unitPrice: unitPrice * 0.90, discountPercentage: 10 };
    if (quantity >= 10) return { unitPrice: unitPrice * 0.95, discountPercentage: 5 };
    return { unitPrice, discountPercentage: 0 };
  }

  public static calculateTierDiscount(amount: number, userTier: 'bronze' | 'silver' | 'gold' | 'platinum'): number {
    switch (userTier) {
      case 'platinum': return amount * 0.15;
      case 'gold': return amount * 0.10;
      case 'silver': return amount * 0.05;
      case 'bronze': default: return 0;
    }
  }

  public static calculateCartTotals(params: {
    itemsSubtotal: number;
    couponDiscount?: number;
    tierDiscount?: number;
    shippingFee: number;
    stateCode: string;
  }) {
    const { itemsSubtotal, couponDiscount = 0, tierDiscount = 0, shippingFee, stateCode } = params;
    const totalDiscounts = couponDiscount + tierDiscount;
    const taxableSubtotal = Math.max(0, itemsSubtotal - totalDiscounts);
    const taxAmount = this.calculateStateTax(taxableSubtotal, stateCode);
    const grandTotal = parseFloat((taxableSubtotal + shippingFee + taxAmount).toFixed(2));

    return {
      itemsSubtotal: parseFloat(itemsSubtotal.toFixed(2)),
      totalDiscounts: parseFloat(totalDiscounts.toFixed(2)),
      taxableSubtotal: parseFloat(taxableSubtotal.toFixed(2)),
      taxAmount,
      shippingFee,
      grandTotal,
    };
  }
}
