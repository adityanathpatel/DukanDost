import React, { useState } from 'react';
import { useAuth, DEFAULT_SHOPKEEPER_PROFILE } from './AuthContext';
import { StoreCategory } from '@/domain/types';
import {
  Store,
  User,
  MapPin,
  FileText,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Globe,
  ShoppingBag,
  Zap,
  Pill,
  Shirt,
  Layers,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface ShopkeeperLoginPageProps {
  language: 'hi' | 'en';
  onToggleLanguage: () => void;
  onSuccess?: () => void;
  onSkip?: () => void;
}

const CATEGORIES: {
  id: StoreCategory;
  nameHi: string;
  nameEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accent: string;
}[] = [
  {
    id: 'Kirana / Grocery',
    nameHi: 'किराना / ग्रोसरी',
    nameEn: 'Kirana / Grocery',
    icon: ShoppingBag,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
    accent: 'text-emerald-600',
  },
  {
    id: 'Electrical / Hardware',
    nameHi: 'इलेक्ट्रिकल / हार्डवेयर',
    nameEn: 'Electrical / Hardware',
    icon: Zap,
    color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
    accent: 'text-amber-600',
  },
  {
    id: 'Medical / Pharmacy',
    nameHi: 'मेडिकल / फार्मेसी',
    nameEn: 'Medical / Pharmacy',
    icon: Pill,
    color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100',
    accent: 'text-rose-600',
  },
  {
    id: 'Apparel / Garments',
    nameHi: 'कपड़ा / गारमेंट्स',
    nameEn: 'Apparel / Garments',
    icon: Shirt,
    color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
    accent: 'text-purple-600',
  },
  {
    id: 'General Store',
    nameHi: 'जनरल स्टोर',
    nameEn: 'General Store',
    icon: Layers,
    color: 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100',
    accent: 'text-sky-600',
  },
];

export const ShopkeeperLoginPage: React.FC<ShopkeeperLoginPageProps> = ({
  language,
  onToggleLanguage,
  onSuccess,
  onSkip,
}) => {
  const { signIn, signUp, setGuest, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  // Form State
  const [shopkeeperName, setShopkeeperName] = useState(profile?.shopkeeperName || '');
  const [storeName, setStoreName] = useState(profile?.storeName || '');
  const [storeCategory, setStoreCategory] = useState<StoreCategory>(
    profile?.storeCategory || 'Kirana / Grocery'
  );
  const [storeAddress, setStoreAddress] = useState(profile?.storeAddress || '');
  const [pincode, setPincode] = useState(profile?.pincode || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [gstin, setGstin] = useState(profile?.gstin || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('123456');

  // Login only state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validations
    if (!shopkeeperName.trim()) {
      setError(language === 'hi' ? 'कृपया दुकानदार का नाम भरें।' : 'Please enter the Shopkeeper Name.');
      return;
    }
    if (!storeName.trim()) {
      setError(language === 'hi' ? 'कृपया दुकान का नाम भरें।' : 'Please enter the Store Name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError(
        language === 'hi'
          ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }
    if (!storeAddress.trim()) {
      setError(
        language === 'hi'
          ? 'कृपया दुकान का पता / क्षेत्र दर्ज करें।'
          : 'Please enter the Store Address / Area.'
      );
      return;
    }
    const cleanPincode = pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      setError(
        language === 'hi'
          ? 'कृपया 6 अंकों का सही पिनकोड भरें।'
          : 'Please enter a valid 6-digit Pincode.'
      );
      return;
    }

    const effectiveEmail = email.trim() || `${cleanPhone}@dukandost.local`;

    setIsLoading(true);
    try {
      await signUp({
        shopkeeperName: shopkeeperName.trim(),
        storeName: storeName.trim(),
        storeCategory,
        storeAddress: storeAddress.trim(),
        pincode: cleanPincode,
        phone: cleanPhone,
        gstin: gstin.trim().toUpperCase() || undefined,
        email: effectiveEmail,
        password: password.trim() || '123456',
      });

      setSuccessMsg(
        language === 'hi'
          ? `🎉 स्वागत है ${shopkeeperName}! आपकी दुकान "${storeName}" सफलतापूर्वक जुड़ गई।`
          : `🎉 Welcome ${shopkeeperName}! Your store "${storeName}" has been successfully set up.`
      );

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('email-already-in-use')) {
        setError(
          language === 'hi'
            ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन टैब चुनें।'
            : 'This email is already in use. Please sign in.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim()) {
      setError(
        language === 'hi'
          ? 'कृपया अपना मोबाइल नंबर या ईमेल भरें।'
          : 'Please enter your Mobile number or Email.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await signIn(loginIdentifier.trim(), loginPassword.trim() || '123456');
      setSuccessMsg(
        language === 'hi' ? '✅ सफलतापूर्वक लॉगिन हुआ!' : '✅ Logged in successfully!'
      );
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handle1ClickDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signUp({
        shopkeeperName: DEFAULT_SHOPKEEPER_PROFILE.shopkeeperName,
        storeName: DEFAULT_SHOPKEEPER_PROFILE.storeName,
        storeCategory: DEFAULT_SHOPKEEPER_PROFILE.storeCategory,
        storeAddress: DEFAULT_SHOPKEEPER_PROFILE.storeAddress,
        pincode: DEFAULT_SHOPKEEPER_PROFILE.pincode,
        phone: DEFAULT_SHOPKEEPER_PROFILE.phone,
        gstin: DEFAULT_SHOPKEEPER_PROFILE.gstin,
        email: DEFAULT_SHOPKEEPER_PROFILE.email || 'demo@dukandost.in',
        password: 'password123',
      });
      setSuccessMsg(
        language === 'hi'
          ? '✅ डेमो किराना स्टोर लॉगिन सफल!'
          : '✅ Demo Kirana Store login successful!'
      );
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 800);
    } catch (err) {
      console.warn(err);
      if (onSuccess) onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    setGuest(true);
    if (onSkip) onSkip();
    else if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-slate-50 to-stone-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Navbar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-stone-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {language === 'hi' ? 'दुकान दोस्त' : 'Dukan Dost'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                Kirana OS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              {language === 'hi'
                ? 'दुकानदारों का सच्चा डिजिटल साथी'
                : 'Smart Retail & Inventory Partner'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleLanguage}
            className="h-9 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-violet-600" />
            <span>{language === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>

          <button
            onClick={handleContinueAsGuest}
            className="h-9 px-3.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-xs font-extrabold text-slate-700 flex items-center gap-1 transition-all active:scale-95"
          >
            <span>{language === 'hi' ? 'सीधे दुकान देखें' : 'Skip as Guest'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-6">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#1E293B] p-6 text-white text-center relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black backdrop-blur-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'hi'
                    ? '100% ऑफ़लाइन चालू • मुफ़्त और सुरक्षित'
                    : '100% Offline Capable • Free & Secure'}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'दुकानदार लॉगिन व रजिस्ट्रेशन' : 'Shopkeeper Login & Setup'}
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {language === 'hi'
                  ? 'अपनी दुकान की जानकारी दर्ज करें ताकि स्टॉक, बिलिंग और सप्लायर रीऑर्डर आसानी से हो सके।'
                  : 'Enter your store details to power automated stock tracking, billing, and supplier reordering.'}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-2 bg-stone-100 border-b border-stone-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm border border-stone-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-4 h-4 text-amber-600" />
              <span>{language === 'hi' ? 'नया खाता बनाएं (Register)' : 'New Store Setup'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm border border-stone-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>{language === 'hi' ? 'पहले से खाता है (Sign In)' : 'Sign In'}</span>
            </button>
          </div>

          {/* Feedback messages */}
          <div className="px-6 pt-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Tab 1: Full Shopkeeper Registration */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-5">
              {/* Section 1: Shopkeeper & Store Name */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>
                    {language === 'hi' ? 'दुकानदार व स्टोर विवरण' : 'Shopkeeper & Store Info'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Shopkeeper Name */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      {language === 'hi' ? 'दुकानदार / मालिक का नाम *' : 'Shopkeeper Name *'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={shopkeeperName}
                        onChange={(e) => setShopkeeperName(e.target.value)}
                        placeholder={
                          language === 'hi' ? 'उदा. रमेश कुमार शर्मा' : 'e.g. Ramesh Sharma'
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900 transition-colors"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {language === 'hi'
                        ? 'मालिक या मैनेजर का पूरा नाम'
                        : 'Full name of the owner/manager'}
                    </p>
                  </div>

                  {/* Store Name */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      {language === 'hi' ? 'दुकान का नाम (Store Name) *' : 'Store Name *'}
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder={
                          language === 'hi' ? 'उदा. शर्मा किराना स्टोर' : 'e.g. Sharma Kirana Store'
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900 transition-colors"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {language === 'hi' ? 'बोर्ड या बिल पर छपने वाला नाम' : 'Trade or business name'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Store Category / Business Type */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>
                    {language === 'hi'
                      ? 'दुकान का प्रकार (Store Category / Business Type) *'
                      : 'Store Category / Business Type *'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = storeCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setStoreCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                            : `${cat.color} border-stone-200`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon
                            className={`w-5 h-5 ${isSelected ? 'text-amber-300' : cat.accent}`}
                          />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-black leading-tight">
                            {language === 'hi' ? cat.nameHi : cat.nameEn}
                          </div>
                          <div
                            className={`text-[10px] font-medium ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {language === 'hi' ? cat.nameEn : cat.nameHi}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Contact & Address / Area / Pincode */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>
                    {language === 'hi' ? 'स्थान व संपर्क (Address & Phone)' : 'Location & Contact'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Phone No */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      {language === 'hi' ? 'मोबाइल नंबर (Phone No.) *' : 'Phone Number *'}
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 text-slate-600 text-xs font-black">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full pr-3.5 pl-3 py-2.5 rounded-r-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      {language === 'hi' ? 'पिनकोड (Pincode) *' : 'Pincode (6-digit) *'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="226001"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {language === 'hi'
                        ? 'सप्लायर व डिलीवरी सुझावों हेतु'
                        : 'For distributor & local delivery setup'}
                    </p>
                  </div>
                </div>

                {/* Store Address / Area */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    {language === 'hi' ? 'दुकान का पता / क्षेत्र (Store Address / Area) *' : 'Store Address / Area *'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder={
                        language === 'hi'
                          ? 'उदा. दुकान नं. 4, मेन मार्केट, चौक बाज़ार, लखनऊ'
                          : 'e.g. Shop No. 4, Main Market, Chowk Bazaar, Lucknow'
                      }
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: GSTIN & Security */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  <span>
                    {language === 'hi' ? 'टैक्स व सुरक्षा (Tax & Account)' : 'Tax & Security'}
                  </span>
                </div>

                {/* GSTIN (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-extrabold text-slate-700">
                      {language === 'hi' ? 'GSTIN (जीएसटी नंबर)' : 'GSTIN'}
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-md bg-stone-100">
                      {language === 'hi' ? 'वैकल्पिक (Optional)' : 'Optional'}
                    </span>
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="09AAAAA0000A1Z5"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-mono font-semibold uppercase focus:outline-hidden focus:border-slate-900"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'hi'
                      ? 'टैक्स इनवॉइस बनाने या B2B डिस्ट्रीब्यूटर बिलिंग में काम आता है।'
                      : 'Useful if you generate tax invoices or handle B2B distributor billing.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      {language === 'hi' ? 'ईमेल (Email ID)' : 'Email ID'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sharma.kirana@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      {language === 'hi' ? 'पासवर्ड (Password) *' : 'Password *'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 space-y-2.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {language === 'hi'
                          ? 'खाता बनाएं और दुकान शुरू करें'
                          : 'Create Store & Launch Dukan Dost'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'hi'
                      ? '100% सुरक्षित • आपका डेटा बिना इंटरनेट भी आपके फ़ोन में सुरक्षित रहेगा'
                      : '100% Safe • Local-first privacy, zero server outage risk'}
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Existing Shopkeeper Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  {language === 'hi'
                    ? 'मोबाइल नंबर या ईमेल पता'
                    : 'Registered Mobile Number or Email'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={
                      language === 'hi' ? '9876543210 या kirana@gmail.com' : '9876543210 or email'
                    }
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{language === 'hi' ? 'दुकान लॉगिन करें' : 'Sign In to Store'}</span>
                )}
              </button>

              {/* 1-Click Demo Shortcut */}
              <div className="pt-4 border-t border-stone-100 space-y-2">
                <div className="text-center">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {language === 'hi' ? 'या तुरंत आज़माएं' : 'Or quick preview'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handle1ClickDemo}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>
                    {language === 'hi'
                      ? '⚡ 1-क्लिक डेमो किराना लॉगिन (शर्मा किराना स्टोर)'
                      : '⚡ 1-Click Demo Kirana Store Login'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Bottom Bar for Offline Guest Exploration */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 text-center">
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              {language === 'hi'
                ? 'बिना लॉगिन अतिथि के रूप में ऐप चलाएं (Continue as Guest)'
                : 'Continue as Offline Guest'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-slate-400 font-semibold pt-4">
        {language === 'hi'
          ? 'दुकान दोस्त — भारतीय छोटे दुकानदारों के लिए 100% सुरक्षित स्थानीय व क्लाउड इन्वेंट्री'
          : 'Dukan Dost — 100% Offline Local Persistence & Cloud Sync for Indian Retailers'}
      </footer>
    </div>
  );
};
