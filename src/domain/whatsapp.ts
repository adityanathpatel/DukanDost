export interface WhatsAppOrderItem {
  name: string;
  reorderQuantity: number;
  unit: string;
  currentStock: number;
}

export interface WhatsAppMessageOptions {
  storeName: string;
  language: 'hi' | 'en';
  items: WhatsAppOrderItem[];
  dateStr?: string;
}

/**
 * Formats a structured, readable WhatsApp order message for suppliers
 */
export function generateWhatsAppOrderMessage(options: WhatsAppMessageOptions): string {
  const { storeName, language, items, dateStr } = options;
  const effectiveDate = dateStr || new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const isHindi = language === 'hi';

  const title = isHindi ? '📦 *दुकान रीऑर्डर सूची*' : '📦 *Dukaan Reorder Sheet*';
  const storeLabel = isHindi ? '🏪 *दुकान:*' : '🏪 *Store:*';
  const dateLabel = isHindi ? '📅 *दिनांक:*' : '📅 *Date:*';
  const totalLabel = isHindi ? '📝 *कुल सामान (Total Items):*' : '📝 *Total Items:*';
  const footer = isHindi
    ? 'कृपया जल्द से जल्द सप्लाई भिजवाएं। धन्यवाद!'
    : 'Please arrange delivery at the earliest. Thank you!';

  if (items.length === 0) {
    const emptyNotice = isHindi 
      ? 'वर्तमान में सभी सामान पर्याप्त हैं। कोई तत्काल आवश्यकता नहीं है।'
      : 'All items are currently well-stocked. No urgent items required.';
    return `${title}\n${storeLabel} ${storeName}\n${dateLabel} ${effectiveDate}\n\n${emptyNotice}\n\n${footer}`;
  }

  const itemsList = items
    .map((item, index) => {
      const stockInfo = isHindi 
        ? `(मौजूदा: ${item.currentStock} ${item.unit})` 
        : `(Current: ${item.currentStock} ${item.unit})`;
      return `${index + 1}. *${item.name}*: *${item.reorderQuantity} ${item.unit}* ${stockInfo}`;
    })
    .join('\n');

  return `${title}\n${storeLabel} ${storeName}\n${dateLabel} ${effectiveDate}\n\n${itemsList}\n\n${totalLabel} ${items.length}\n\n${footer}`;
}

/**
 * Opens WhatsApp with the pre-filled message and copies to clipboard as a fallback
 */
export function triggerWhatsAppShare(message: string, phone?: string): { success: boolean; url: string } {
  const encodedText = encodeURIComponent(message);
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const phoneParam = cleanPhone ? (cleanPhone.length === 10 ? `phone=91${cleanPhone}&` : `phone=${cleanPhone}&`) : '';
  // Universal WhatsApp share URL compatible with Desktop WhatsApp Web and Android/iOS Native WhatsApp
  const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodedText}`;

  // Copy to clipboard in background
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(message).catch((err) => {
      console.warn('[WhatsAppShare] Clipboard copy warning:', err);
    });
  }

  // Open WhatsApp in new tab / app
  if (typeof window !== 'undefined') {
    try {
      const win = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        // Pop-up blocker intercepted, fallback to redirecting current window
        window.location.href = whatsappUrl;
      }
      return { success: true, url: whatsappUrl };
    } catch {
      window.location.href = whatsappUrl;
      return { success: true, url: whatsappUrl };
    }
  }

  return { success: false, url: whatsappUrl };
}
