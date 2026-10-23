import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calculateInvoiceTotals, formatInvoiceWhatsAppMessage, HustleOfflineEngine } from './services/hustleEngine';
import { HustleRepository } from './data/hustleRepository';
import { MeriDukaanDatabase } from '@/data/db';
import { DukanInvoice, InvoiceItem } from './types';

describe('Hustle AI Feature Integration Tests', () => {
  describe('1. Deterministic Invoice Financial Math (Zero Hallucination)', () => {
    it('calculates line totals, subtotal, and total amount accurately with zero discount and zero tax', () => {
      const items: InvoiceItem[] = [
        { description: 'Rice 5kg', quantity: 2, unit: 'packet', unitPrice: 350.5, lineTotal: 0 },
        { description: 'Mustard Oil 1L', quantity: 3, unit: 'bottle', unitPrice: 140, lineTotal: 0 },
      ];

      const res = calculateInvoiceTotals(items, 0, 0);

      // (2 * 350.5 = 701) + (3 * 140 = 420) = 1121
      expect(res.subtotal).toBe(1121);
      expect(res.discountAmount).toBe(0);
      expect(res.taxAmount).toBe(0);
      expect(res.totalAmount).toBe(1121);
      expect(res.updatedItems[0].lineTotal).toBe(701);
      expect(res.updatedItems[1].lineTotal).toBe(420);
    });

    it('correctly applies flat discount and GST percentage with exact rounding', () => {
      const items: InvoiceItem[] = [
        { description: 'Almonds 500g', quantity: 2, unit: 'packet', unitPrice: 450, lineTotal: 900 },
        { description: 'Cashews 500g', quantity: 1, unit: 'packet', unitPrice: 400, lineTotal: 400 },
      ];
      // Subtotal = 1300
      // Discount = 100 -> Discounted Subtotal = 1200
      // GST 5% on 1200 = 60
      // Grand Total = 1260
      const res = calculateInvoiceTotals(items, 5, 100);

      expect(res.subtotal).toBe(1300);
      expect(res.discountAmount).toBe(100);
      expect(res.taxAmount).toBe(60);
      expect(res.totalAmount).toBe(1260);
    });

    it('handles decimal quantities (e.g. 1.5 kg, 0.25 kg) safely without floating precision leaks', () => {
      const items: InvoiceItem[] = [
        { description: 'Loose Sugar', quantity: 1.5, unit: 'kg', unitPrice: 42, lineTotal: 0 },
        { description: 'Cardamom', quantity: 0.25, unit: 'kg', unitPrice: 2800, lineTotal: 0 },
      ];
      // 1.5 * 42 = 63
      // 0.25 * 2800 = 700
      // Subtotal = 763
      const res = calculateInvoiceTotals(items, 18, 50);
      // Discounted subtotal = 713
      // 18% of 713 = 128.34
      // Total = 713 + 128.34 = 841.34
      expect(res.subtotal).toBe(763);
      expect(res.discountAmount).toBe(50);
      expect(res.taxAmount).toBe(128.34);
      expect(res.totalAmount).toBe(841.34);
    });

    it('clamps excessive discount to subtotal to avoid negative totals', () => {
      const items: InvoiceItem[] = [
        { description: 'Salt', quantity: 1, unit: 'packet', unitPrice: 25, lineTotal: 25 },
      ];
      const res = calculateInvoiceTotals(items, 0, 100); // Discount is larger than subtotal
      expect(res.subtotal).toBe(25);
      expect(res.discountAmount).toBe(25);
      expect(res.totalAmount).toBe(0);
    });
  });

  describe('2. WhatsApp Bill Formatter', () => {
    it('formats professional WhatsApp bill with shop header, items list, and UPI link', () => {
      const invoice: DukanInvoice = {
        id: 'inv_test_1',
        invoiceNumber: 'INV-2026-999',
        issueDate: '2026-10-23',
        sellerName: 'शर्मा किराना स्टोर',
        sellerShopkeeper: 'रमेश शर्मा',
        sellerPhone: '9876543210',
        sellerUpiId: 'sharma@upi',
        customerName: 'अमित कुमार',
        customerPhone: '9811122233',
        currency: 'INR',
        subtotal: 500,
        discountAmount: 20,
        taxRatePercent: 0,
        taxAmount: 0,
        totalAmount: 480,
        paymentMode: 'cash',
        status: 'paid',
        items: [
          { description: 'आटा 10kg', quantity: 1, unit: 'packet', unitPrice: 380, lineTotal: 380 },
          { description: 'चीनी 2kg', quantity: 2, unit: 'kg', unitPrice: 60, lineTotal: 120 },
        ],
        createdAt: Date.now(),
      };

      const msg = formatInvoiceWhatsAppMessage(invoice);

      expect(msg).toContain('शर्मा किराना स्टोर');
      expect(msg).toContain('INV-2026-999');
      expect(msg).toContain('अमित कुमार');
      expect(msg).toContain('आटा 10kg');
      expect(msg).toContain('₹480.00');
      expect(msg).toContain('Dukan Dost & Hustle AI');
    });
  });

  describe('3. Offline Air-Gapped AI Engine (Bilingual & Instant)', () => {
    it('generates high-converting listing copy in Hindi with SEO title and keywords', () => {
      const res = HustleOfflineEngine.generateListing({
        productName: 'राजधानी बेसन 500g',
        category: 'किराना',
        features: '100% शुद्ध चना दाल से निर्मित, बारीक पिसा',
        language: 'hi',
      });

      expect(res.seoTitle).toContain('राजधानी बेसन 500g');
      expect(res.keySellingPoints.length).toBeGreaterThan(0);
      expect(res.suggestedKeywords).toContain('राजधानी बेसन 500g');
      expect(res.isLocal).toBe(true);
      expect(res.modelUsed).toContain('AirGapped');
    });

    it('generates festive campaign marketing copy with hashtags and call to action', () => {
      const res = HustleOfflineEngine.generateMarketing({
        productOrService: 'ड्राई फ्रूट्स गिफ्ट पैक',
        campaignType: 'festival_offer',
        offerDetails: '25% भारी छूट',
        language: 'hi',
      });

      expect(res.headline).toContain('त्योहार');
      expect(res.content).toContain('ड्राई फ्रूट्स गिफ्ट पैक');
      expect(res.content).toContain('25% भारी छूट');
      expect(res.suggestedHashtags.length).toBeGreaterThan(0);
      expect(res.isLocal).toBe(true);
    });

    it('generates credit customer payment reminder with due amount and polite tone', () => {
      const res = HustleOfflineEngine.generateEmailOrReminder({
        emailType: 'payment_reminder',
        recipientName: 'राजेश जी',
        subjectContext: 'राशन बकाया',
        dueAmount: 1850,
        keyDetails: 'पिछले महीने का राशन उधार',
        language: 'hi',
      });

      expect(res.subjectLine).toContain('उधार भुगतान');
      expect(res.whatsappMessage).toContain('₹1850');
      expect(res.whatsappMessage).toContain('राजेश जी');
      expect(res.isLocal).toBe(true);
    });
  });

  describe('4. IndexedDB Persistence for Invoices and Projects', () => {
    let testDb: MeriDukaanDatabase;
    let repo: HustleRepository;

    beforeEach(() => {
      testDb = new MeriDukaanDatabase(`Hustle_Test_${Date.now()}_${Math.random()}`);
      repo = new HustleRepository(testDb);
    });

    afterEach(async () => {
      await testDb.delete();
    });

    it('saves, retrieves, and lists invoices in IndexedDB', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-2026-101',
        issueDate: '2026-10-23',
        sellerName: 'दुकान दोस्त',
        customerName: 'दीपक सिंह',
        currency: 'INR',
        subtotal: 200,
        discountAmount: 0,
        taxRatePercent: 0,
        taxAmount: 0,
        totalAmount: 200,
        paymentMode: 'cash' as const,
        status: 'paid' as const,
        items: [{ description: 'नमक', quantity: 1, unit: 'packet' as const, unitPrice: 20, lineTotal: 20 }],
      };

      const saved = await repo.saveInvoice(invoiceData);
      expect(saved.id).toBeDefined();

      const retrieved = await repo.getInvoice(saved.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.customerName).toBe('दीपक सिंह');

      const all = await repo.listInvoices();
      expect(all.length).toBe(1);
    });

    it('updates invoice status from pending (udhaar) to paid', async () => {
      const saved = await repo.saveInvoice({
        invoiceNumber: 'INV-UDHAAR-1',
        issueDate: '2026-10-23',
        sellerName: 'दुकान दोस्त',
        customerName: 'मोहन लाल',
        currency: 'INR',
        subtotal: 500,
        discountAmount: 0,
        taxRatePercent: 0,
        taxAmount: 0,
        totalAmount: 500,
        paymentMode: 'udhaar',
        status: 'pending',
        items: [],
      });

      await repo.updateInvoiceStatus(saved.id, 'paid');
      const updated = await repo.getInvoice(saved.id);
      expect(updated?.status).toBe('paid');
    });

    it('saves and lists AI generated projects in IndexedDB', async () => {
      await repo.saveProject({
        title: 'दिवाली सेल प्रचार',
        toolType: 'marketing',
        content: 'धमाका ऑफर!',
        isFavorite: false,
      });

      const list = await repo.listProjects('marketing');
      expect(list.length).toBe(1);
      expect(list[0].title).toBe('दिवाली सेल प्रचार');
    });
  });
});
