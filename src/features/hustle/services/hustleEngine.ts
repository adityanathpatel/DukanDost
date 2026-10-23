import {
  InvoiceItem,
  ListingRequest,
  ListingResponse,
  MarketingRequest,
  MarketingResponse,
  EmailRequest,
  EmailResponse,
  DukanInvoice,
} from '../types';

/**
 * Strictly Deterministic Financial Math for Invoices (Zero Hallucination)
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  taxRatePercent: number = 0,
  discountAmount: number = 0
): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  updatedItems: InvoiceItem[];
} {
  let subtotal = 0;
  const updatedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const lineTotal = Math.round(qty * price * 100) / 100;
    subtotal += lineTotal;
    return {
      ...item,
      quantity: qty,
      unitPrice: price,
      lineTotal,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const disc = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const discountedSubtotal = Math.max(0, subtotal - disc);
  const taxRate = Math.max(0, Math.min(100, Number(taxRatePercent) || 0));
  const taxAmount = Math.round((discountedSubtotal * (taxRate / 100)) * 100) / 100;
  const totalAmount = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

  return {
    subtotal,
    discountAmount: disc,
    taxAmount,
    totalAmount,
    updatedItems,
  };
}

/**
 * Format Invoice for WhatsApp text message sharing
 */
export function formatInvoiceWhatsAppMessage(invoice: DukanInvoice): string {
  const currencySymbol = invoice.currency === 'INR' ? '₹' : invoice.currency;
  const paymentBadge =
    invoice.status === 'paid'
      ? '✅ [भुगतान प्राप्त / PAID]'
      : invoice.paymentMode === 'udhaar'
      ? '⏳ [उधार खाता / PENDING UDHAAR]'
      : '📝 [बिल / INVOICE]';

  const itemsList = invoice.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.description}*\n   ${item.quantity} ${item.unit} × ${currencySymbol}${item.unitPrice} = *${currencySymbol}${item.lineTotal}*`
    )
    .join('\n');

  let text = `🧾 *${invoice.sellerName.toUpperCase()}*\n`;
  if (invoice.sellerShopkeeper) text += `दुकानदार: ${invoice.sellerShopkeeper}\n`;
  if (invoice.sellerAddress) text += `पता: ${invoice.sellerAddress}\n`;
  if (invoice.sellerPhone) text += `संपर्क: ${invoice.sellerPhone}\n`;
  if (invoice.sellerGstin) text += `GSTIN: ${invoice.sellerGstin}\n`;
  text += `--------------------------------\n`;
  text += `*बिल सं.*: #${invoice.invoiceNumber}\n`;
  text += `*दिनांक*: ${invoice.issueDate}\n`;
  text += `*ग्राहक*: ${invoice.customerName} ${invoice.customerPhone ? `(${invoice.customerPhone})` : ''}\n`;
  text += `*स्थिति*: ${paymentBadge}\n`;
  text += `--------------------------------\n`;
  text += `*सामान सूची (Items):*\n${itemsList}\n`;
  text += `--------------------------------\n`;
  text += `कुल योग (Subtotal): ${currencySymbol}${invoice.subtotal.toFixed(2)}\n`;
  if (invoice.discountAmount > 0) {
    text += `छूट (Discount): -${currencySymbol}${invoice.discountAmount.toFixed(2)}\n`;
  }
  if (invoice.taxAmount > 0) {
    text += `GST (${invoice.taxRatePercent}%): +${currencySymbol}${invoice.taxAmount.toFixed(2)}\n`;
  }
  text += `*अंतिम देय राशि (Grand Total): ${currencySymbol}${invoice.totalAmount.toFixed(2)}*\n`;
  text += `भुगतान माध्यम: *${invoice.paymentMode.toUpperCase()}*\n`;

  if (invoice.sellerUpiId && invoice.status !== 'paid') {
    text += `\n📲 *UPI से भुगतान करें:* \nUPI ID: \`${invoice.sellerUpiId}\`\n`;
  }

  if (invoice.notes) {
    text += `\nनोट: ${invoice.notes}\n`;
  }

  text += `\nधन्यवाद! फिर पधारें! 🙏\n_Powered by Dukan Dost & Hustle AI_`;
  return text;
}

/**
 * Intelligent Air-Gapped Rule Engine for Offline Business AI Generation
 */
export class HustleOfflineEngine {
  static generateListing(req: ListingRequest): ListingResponse {
    const start = performance.now();
    const plat = req.marketplace || 'WhatsApp Catalog & Local Market';
    const lang = req.language || 'hi';
    const tone = req.tone || 'Attractive & Reliable';
    const specs = req.features ? req.features.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const primaryFeat = specs[0] || 'उत्कृष्ट गुणवत्ता (Premium Quality)';

    const isHindi = lang === 'hi' || lang === 'hinglish';

    const seoTitle = isHindi
      ? `${req.productName} – ${primaryFeat} | असली व शुद्ध सामान (${plat} स्पेशल)`
      : `${req.productName} – ${primaryFeat} | Fresh & Quality Store Selection (${plat})`;

    const shortDescription = isHindi
      ? `${req.productName} हमारी दुकान पर ताज़ा और बेहतरीन दाम में उपलब्ध है (${tone})। ${req.targetAudience || 'सभी ग्राहकों'} के लिए एकदम सही विकल्प।`
      : `Upgrade your daily essentials with ${req.productName} (${tone}). Sourced with high standards for ${req.targetAudience || 'smart shoppers'}.`;

    const longDescription = isHindi
      ? `क्या आप बेहतरीन ${req.category} की तलाश में हैं? आज ही लाएं ${req.productName}!\n\nविशेषताएं:\n` +
        (specs.length > 0
          ? specs.map((f) => `• ${f}`).join('\n')
          : `• 100% शुद्ध और विश्वसनीय\n• उचित मूल्य की गारंटी\n• तुरंत डिलीवरी उपलब्ध`) +
        `\n\nहमारे स्थानीय स्टोर से खरीदें और सबसे अच्छी सेवा का आनंद लें।`
      : `Looking for top-notch ${req.category}? Experience ${req.productName} curated for you.\n\nKey Highlights:\n` +
        (specs.length > 0
          ? specs.map((f) => `• ${f}`).join('\n')
          : `• 100% genuine quality assured\n• Unbeatable price\n• Reliable local store guarantee`) +
        `\n\nAvailable now at our store. Get yours today!`;

    const keySellingPoints = isHindi
      ? [
          `विश्वसनीय गुणवत्ता: शुद्ध और प्रामाणिक ${req.productName}`,
          `उचित दाम: बाजार से बेहतर ऑफर`,
          `तुरंत उपलब्धता: अभी दुकान से प्राप्त करें`,
          `स्थानीय गारंटी: आपकी अपनी दुकान का भरोसा`,
        ]
      : [
          `Guaranteed Freshness & Authenticity for ${req.productName}`,
          `Competitive local store pricing with honest rates`,
          `Ready in-stock for immediate pickup or delivery`,
          `Backed by your trusted local neighborhood shop`,
        ];

    const keywords = [
      req.productName.toLowerCase(),
      `${req.productName.toLowerCase()} price`,
      `best ${req.category.toLowerCase()}`,
      `buy ${req.productName.toLowerCase()} nearby`,
      `${req.productName.toLowerCase()} offers`,
      'dukan dost special',
    ];

    const callToAction = isHindi
      ? `दुकान पर अभी आएं या व्हाट्सएप पर ऑर्डर करें और तुरंत डिस्काउंट पाएं!`
      : `Visit our store today or order on WhatsApp to claim your special deal!`;

    const latencyMs = Math.round(performance.now() - start);

    return {
      seoTitle,
      shortDescription,
      longDescription,
      keySellingPoints,
      suggestedKeywords: keywords,
      callToAction,
      modelUsed: 'HustleAI-AirGapped-Engine (Local On-Device)',
      isLocal: true,
      latencyMs,
    };
  }

  static generateMarketing(req: MarketingRequest): MarketingResponse {
    const start = performance.now();
    const lang = req.language || 'hi';
    const offer = req.offerDetails || 'विशेष छूट और भारी बचत!';
    const item = req.productOrService;
    const isHindi = lang === 'hi' || lang === 'hinglish';

    let headline = '';
    let content = '';
    let timing = '';
    let callToAction = '';
    let hashtags: string[] = [];

    if (req.campaignType === 'festival_offer') {
      if (isHindi) {
        headline = `🎉 त्योहार स्पेशल बंपर धमाका: ${item} पर भारी छूट! ✨`;
        content =
          `नमस्ते प्रिय ग्राहक! 🙏\n\n` +
          `इस त्योहार के शुभ अवसर पर हमारी दुकान आपके और आपके परिवार के लिए लाई है सबसे शानदार ऑफर! 🎊\n\n` +
          `🛍️ *सामान*: ${item}\n` +
          `💥 *ऑफर विवरण*: *${offer}*\n\n` +
          `✅ 100% शुद्धता व गुणवत्ता की पक्की गारंटी\n` +
          `✅ सीमित स्टॉक — पहले आएं, पहले पाएं!\n\n` +
          `आज ही पधारें और त्योहार की खुशियों को दोगुना करें।`;
        callToAction = `अभी दुकान पर आएं या तुरंत व्हाट्सएप पर रिप्लाई कर अपना सामान सुरक्षित करें!`;
        timing = `त्योहार के दिनों में सुबह 9:00 AM से दोपहर 1:00 PM या शाम 6:00 PM से 9:00 PM`;
      } else {
        headline = `🎉 Festive Season Mega Offer on ${item}! ✨`;
        content =
          `Hello Valued Customer! 👋\n\n` +
          `Celebrate the festival with exclusive savings from our store!\n\n` +
          `🛍️ *Product*: ${item}\n` +
          `💥 *Special Deal*: *${offer}*\n\n` +
          `✅ Best quality guaranteed\n` +
          `✅ Fresh stock ready for pickup or local delivery\n\n` +
          `Stock is limited! Don't miss out on this celebratory pricing.`;
        callToAction = `Reply to this WhatsApp message or drop by our store today!`;
        timing = `Festive weekend: 10:00 AM to 8:00 PM`;
      }
      hashtags = [`#${item.replace(/\s+/g, '')}`, '#FestiveOffer', '#TyoharDhamaka', '#ShopLocal', '#DukanDost'];
    } else if (req.campaignType === 'whatsapp_promo') {
      if (isHindi) {
        headline = `🔥 स्पेशल व्हाट्सएप ब्रॉडकास्ट: ${item} पर बंपर ऑफर!`;
        content =
          `नमस्ते! 🙏\n\n` +
          `आप हमारे खास ग्राहक हैं, इसलिए यह ऑफर सबसे पहले आपके लिए:\n\n` +
          `🌟 *${item}* पर आज का स्पेशल डिस्काउंट: *${offer}*!\n\n` +
          `• बाज़ार से कम दाम, पक्का बिल\n` +
          `• घर बैठे ऑर्डर करें और तुरंत मंगवाएं\n\n` +
          `ऑर्डर देने के लिए इस मैसेज का उत्तर दें।`;
        callToAction = `ऑर्डर के लिए 'YES' लिखकर रिप्लाई करें या कॉल करें!`;
        timing = `सुबह 10:00 AM से 12:30 PM या शाम 5:30 PM से 8:00 PM`;
      } else {
        headline = `🔥 Exclusive VIP Alert: Special deal on ${item}!`;
        content =
          `Hi there! 👋\n\n` +
          `As our trusted customer, we are thrilled to give you first access to our deal of the week:\n\n` +
          `🌟 *${item}* — *${offer}*!\n\n` +
          `• Guaranteed quality & fair pricing\n` +
          `• Quick counter pickup or doorstep delivery\n\n` +
          `Just reply directly to this chat with what you need!`;
        callToAction = `Reply 'ORDER' to book yours right now!`;
        timing = `Weekdays 10:30 AM to 1:00 PM or 5:00 PM to 7:30 PM`;
      }
      hashtags = [`#${item.replace(/\s+/g, '')}`, '#DailyDeals', '#WhatsAppShopping', '#KiranaOffer'];
    } else {
      // General / Weekend sale / Instagram
      if (isHindi) {
        headline = `🚀 वीकेंड धमाका: ${item} केवल सीमित समय के लिए!`;
        content =
          `क्या आपने चेक किया? 👀\n\n` +
          `हमारी दुकान पर आ चुका है नया ${item} का ताज़ा लॉट।\n\n` +
          `💥 *धमाका छूट*: ${offer}!\n\n` +
          `गुणवत्ता में कोई समझौता नहीं, दाम में पूरी बचत। अपने दोस्तों और परिवार के साथ जरूर शेयर करें!`;
        callToAction = `आज ही विजिट करें और छूट का लाभ उठाएं!`;
        timing = `शुक्रवार शाम से रविवार शाम तक`;
      } else {
        headline = `🚀 Weekend Special: Save Big on ${item}!`;
        content =
          `Stop scrolling! 🔥\n\n` +
          `Fresh stock of ${item} has just landed at our store.\n\n` +
          `💥 *Deal Alert*: ${offer}!\n\n` +
          `Top quality, honest prices, and friendly local service. Grab yours before stocks run out!`;
        callToAction = `Visit our store today or message us to order!`;
        timing = `Friday evening through Sunday afternoon`;
      }
      hashtags = [`#${item.replace(/\s+/g, '')}`, '#WeekendSale', '#GreatSavings', '#DukanDeals'];
    }

    const latencyMs = Math.round(performance.now() - start);

    return {
      headline,
      content,
      suggestedHashtags: hashtags,
      recommendedTiming: timing,
      callToAction,
      modelUsed: 'HustleAI-Bilingual-Engine (Local Air-Gapped)',
      isLocal: true,
      latencyMs,
    };
  }

  static generateEmailOrReminder(req: EmailRequest): EmailResponse {
    const start = performance.now();
    const recip = req.recipientName || 'आदरणीय ग्राहक';
    const amountStr = req.dueAmount ? `₹${req.dueAmount}` : 'बकाया राशि';
    const isHindi = req.language !== 'en';

    let subjectLine = '';
    let salutation = '';
    let body = '';
    let signOff = '';
    let whatsappMessage = '';

    if (req.emailType === 'payment_reminder') {
      if (isHindi) {
        subjectLine = `उधार भुगतान अनुस्मारक: खाता शेष (${req.subjectContext || amountStr})`;
        salutation = `नमस्ते ${recip} जी, 🙏`;
        body =
          `आशा है आप सपरिवार सकुशल हैं।\n\n` +
          `आपकी सुविधा के लिए याद दिलाना चाहते हैं कि आपकी दुकान की पिछली खरीदारी की ${amountStr} शेष है。\n\n` +
          `विवरण: ${req.keyDetails || 'पिछला राशन / सामान खाता'}\n\n` +
          `कृपया समय निकालकर UPI या दुकान पर नकद जमा करवा कर खाता अपडेट करवाने का कष्ट करें। आपका सहयोग हमारे लिए अत्यंत महत्वपूर्ण है।`;
        signOff = `सादर धन्यवाद,\nदुकानदार व दुकान दोस्त टीम`;
        whatsappMessage =
          `नमस्ते ${recip} जी! 🙏\n` +
          `आपकी दुकान की पिछली खरीदारी का *${amountStr}* शेष है।\n` +
          `विवरण: ${req.keyDetails || 'खाता बही'}\n` +
          `कृपया समय मिलने पर UPI या दुकान पर आकर भुगतान कर खाता क्लियर कर लें। धन्यवाद! 🙏`;
      } else {
        subjectLine = `Friendly Payment Reminder: Pending Balance for ${req.subjectContext || amountStr}`;
        salutation = `Dear ${recip},`;
        body =
          `We hope this message finds you well.\n\n` +
          `This is a gentle reminder regarding the outstanding balance of ${amountStr} for your recent purchase.\n\n` +
          `Details: ${req.keyDetails || 'Store purchases / invoice'}\n\n` +
          `Kindly clear this balance via UPI or cash at your convenience. We truly appreciate your continued support and prompt cooperation.`;
        signOff = `Warm regards,\nStore Management`;
        whatsappMessage =
          `Hi ${recip}! Gentle reminder regarding the pending balance of *${amountStr}* for ${req.keyDetails || 'recent purchases'}. Kindly settle via UPI or store visit at your convenience. Thank you! 🙏`;
      }
    } else if (req.emailType === 'quotation') {
      if (isHindi) {
        subjectLine = `कोटेशन व मूल्य अनुमान: ${req.subjectContext}`;
        salutation = `आदरणीय ${recip} जी, 🙏`;
        body =
          `आपकी आवश्यकता अनुसार हमने सबसे उचित दरों पर सामान का कोटेशन तैयार किया है:\n\n` +
          `${req.keyDetails}\n\n` +
          `यह दरें अगले 7 दिनों के लिए मान्य हैं। सामान की शुद्धता और समय पर डिलीवरी की हमारी पूरी गारंटी है। किसी भी बदलाव के लिए बेझिझक संपर्क करें।`;
        signOff = `भवदीय,\nदुकान संचालक`;
        whatsappMessage =
          `नमस्ते ${recip} जी! 🙏 आपके सामान का कोटेशन तैयार है:\n\n${req.keyDetails}\n\nऑर्डर कन्फर्म करने के लिए रिप्लाई करें। धन्यवाद!`;
      } else {
        subjectLine = `Official Quotation & Price Estimate: ${req.subjectContext}`;
        salutation = `Dear ${recip},`;
        body =
          `Thank you for inquiring with our store. Below is your requested estimate:\n\n` +
          `${req.keyDetails}\n\n` +
          `These rates are valid for the next 7 business days. All items come with our store quality guarantee. Please let us know if you require any adjustments.`;
        signOff = `Sincerely,\nStore Management`;
        whatsappMessage =
          `Dear ${recip}, here is your requested quotation:\n\n${req.keyDetails}\n\nPlease reply to confirm your order. Thank you!`;
      }
    } else {
      // Supplier order
      subjectLine = `सप्लायर माल आर्डर / Stock Delivery Order: ${req.subjectContext}`;
      salutation = `नमस्ते ${recip} जी,`;
      body =
        `हमारी दुकान के लिए कृपया निम्नलिखित सामान की डिलीवरी जल्द से जल्द भिजवाने का कष्ट करें:\n\n` +
        `${req.keyDetails}\n\n` +
        `बिलिंग व प्राप्ति के तुरंत बाद भुगतान नियमानुसार कर दिया जाएगा।`;
      signOff = `धन्यवाद,\nदुकानदार`;
      whatsappMessage = `नमस्ते ${recip} जी! नया माल आर्डर भेज रहे हैं:\n\n${req.keyDetails}\n\nकृपया डिलीवरी कन्फर्म करें।`;
    }

    const latencyMs = Math.round(performance.now() - start);

    return {
      subjectLine,
      salutation,
      body,
      signOff,
      whatsappMessage,
      modelUsed: 'HustleAI-Reminders-Engine (Local Air-Gapped)',
      isLocal: true,
      latencyMs,
    };
  }
}
