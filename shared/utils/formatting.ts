export class FormattingUtils {
  public static formatCurrency(amount: number, currencyCode: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  public static formatDate(dateString: string, formatStyle: 'short' | 'medium' | 'full' = 'medium'): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    if (formatStyle === 'short') {
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    }
    if (formatStyle === 'full') {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  public static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return this.formatDate(dateString, 'short');
  }

  public static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  public static generateSKU(categoryPrefix: string, brandPrefix: string, seq: number): string {
    const c = categoryPrefix.toUpperCase().slice(0, 3);
    const b = brandPrefix.toUpperCase().slice(0, 3);
    const s = seq.toString().padStart(6, '0');
    return `${c}-${b}-${s}`;
  }

  public static formatAddressSingleLine(addr: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }): string {
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
  }
}
