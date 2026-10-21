import { describe, it, expect, vi } from 'vitest';
import { generateWhatsAppOrderMessage, triggerWhatsAppShare } from './whatsapp';

describe('WhatsApp Order Sharing Domain', () => {
  it('formats bilingual order message with items and quantities', () => {
    const message = generateWhatsAppOrderMessage({
      storeName: 'शर्मा किराना स्टोर',
      language: 'hi',
      dateStr: '21 Oct 2026',
      items: [
        { name: 'टाटा नमक', reorderQuantity: 15, unit: 'packet', currentStock: 2 },
        { name: 'फॉर्च्यून तेल', reorderQuantity: 10, unit: 'liter', currentStock: 1 },
      ],
    });

    expect(message).toContain('📦 *दुकान रीऑर्डर सूची*');
    expect(message).toContain('🏪 *दुकान:* शर्मा किराना स्टोर');
    expect(message).toContain('📅 *दिनांक:* 21 Oct 2026');
    expect(message).toContain('1. *टाटा नमक*: *15 packet* (मौजूदा: 2 packet)');
    expect(message).toContain('2. *फॉर्च्यून तेल*: *10 liter* (मौजूदा: 1 liter)');
    expect(message).toContain('📝 *कुल सामान (Total Items):* 2');
    expect(message).toContain('कृपया जल्द से जल्द सप्लाई भिजवाएं। धन्यवाद!');
  });

  it('formats English order message correctly', () => {
    const message = generateWhatsAppOrderMessage({
      storeName: 'Sharma General Store',
      language: 'en',
      dateStr: '21 Oct 2026',
      items: [
        { name: 'Tata Salt 1kg', reorderQuantity: 20, unit: 'packet', currentStock: 3 },
      ],
    });

    expect(message).toContain('📦 *Dukaan Reorder Sheet*');
    expect(message).toContain('🏪 *Store:* Sharma General Store');
    expect(message).toContain('1. *Tata Salt 1kg*: *20 packet* (Current: 3 packet)');
    expect(message).toContain('📝 *Total Items:* 1');
  });

  it('handles empty reorder list gracefully with honest notice', () => {
    const message = generateWhatsAppOrderMessage({
      storeName: 'Sharma Kirana',
      language: 'hi',
      dateStr: '21 Oct 2026',
      items: [],
    });

    expect(message).toContain('वर्तमान में सभी सामान पर्याप्त हैं');
  });

  it('triggers WhatsApp URL generation and window open safely in browser environment', () => {
    const openSpy = vi.fn().mockReturnValue({ closed: false });
    const originalWindow = globalThis.window;

    // Mock browser window object for Node environment
    (globalThis as unknown as { window: unknown }).window = {
      open: openSpy,
      location: { href: '' },
    };

    const testMessage = 'Test Reorder Message';
    const result = triggerWhatsAppShare(testMessage);

    expect(result.success).toBe(true);
    expect(result.url).toBe(`https://api.whatsapp.com/send?text=${encodeURIComponent(testMessage)}`);
    expect(openSpy).toHaveBeenCalledWith(result.url, '_blank', 'noopener,noreferrer');

    // Restore original window
    if (originalWindow) {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    } else {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });

  it('handles environment without window gracefully', () => {
    const originalWindow = globalThis.window;
    delete (globalThis as unknown as { window?: unknown }).window;

    const result = triggerWhatsAppShare('No Window Test');
    expect(result.success).toBe(false);
    expect(result.url).toContain('https://api.whatsapp.com/send?text=');

    if (originalWindow) {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  });
});
