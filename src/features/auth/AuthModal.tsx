import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, Lock, Mail, Store, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language }) => {
  const { signIn, signUp, user, logOut, isFirebaseAvailable } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeNameInput, setStoreNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        setSuccessMsg(language === 'hi' ? 'सफलतापूर्वक लॉगिन हुआ!' : 'Logged in successfully!');
      } else {
        await signUp(email, password, storeNameInput);
        setSuccessMsg(language === 'hi' ? 'नया खाता सफलतापूर्वक बन गया!' : 'Account created successfully!');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'प्रमाणीकरण विफल';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError(language === 'hi' ? 'गलत ईमेल या पासवर्ड है।' : 'Invalid email or password.');
      } else if (msg.includes('email-already-in-use')) {
        setError(language === 'hi' ? 'यह ईमेल पहले से पंजीकृत है।' : 'This email is already in use.');
      } else if (msg.includes('weak-password')) {
        setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-pastel-lavender-light to-pastel-lavender border-b border-pastel-lavender-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-navy-900 text-white flex items-center justify-center">
              <Lock className="w-5 h-5 text-pastel-lavender-border" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">
                {language === 'hi' ? 'दुकानदार खाता (Firebase Auth)' : 'Shopkeeper Account'}
              </h3>
              <p className="text-[11px] text-pastel-lavender-text font-bold">
                {user ? (language === 'hi' ? 'सक्रिय खाता' : 'Active Account') : (language === 'hi' ? 'क्लाउड बैकअप व सुरक्षा के लिए' : 'For cloud backup & security')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-ink flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* If already logged in */}
          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-black">
                    {language === 'hi' ? 'आप लॉगिन हैं' : 'You are logged in'}
                  </div>
                  <div className="text-xs font-semibold text-emerald-800 break-all">{user.email}</div>
                  {user.displayName && (
                    <div className="text-xs text-emerald-700 mt-1 font-medium">
                      {language === 'hi' ? 'दुकान का नाम:' : 'Store Name:'} <span className="font-bold">{user.displayName}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await logOut();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-sm transition-all"
              >
                {language === 'hi' ? 'खाता लॉग आउट करें (Sign Out)' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    mode === 'signin' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {language === 'hi' ? 'लॉगिन करें' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    mode === 'signup' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {language === 'hi' ? 'नया खाता बनाएं' : 'Sign Up'}
                </button>
              </div>

              {/* Status Notice */}
              {!isFirebaseAvailable && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'hi'
                      ? 'Firebase सेटिंग्स कॉन्फ़िगर हो रही हैं। ऑफ़लाइन मोड पूरी तरह सक्रिय है।'
                      : 'Firebase credentials configured. Local IndexedDB is active.'}
                  </span>
                </div>
              )}

              {/* Alerts */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'hi' ? 'दुकान का नाम (Store Name)' : 'Store Name'}
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={storeNameInput}
                        onChange={(e) => setStoreNameInput(e.target.value)}
                        placeholder={language === 'hi' ? 'उदा. शर्मा किराना स्टोर' : 'e.g. Sharma Kirana'}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-navy-900"
                        required={mode === 'signup'}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'ईमेल पता (Email)' : 'Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kirana@gmail.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-navy-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-navy-900"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-navy-900 hover:bg-slate-800 text-white font-black text-sm shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>
                      {mode === 'signin'
                        ? (language === 'hi' ? 'लॉगिन करें' : 'Sign In')
                        : (language === 'hi' ? 'नया खाता बनाएं' : 'Create Account')}
                    </span>
                  )}
                </button>
              </form>

              {/* Guest / Offline Mode Note */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  {language === 'hi'
                    ? 'बिना लॉगिन के ऑफ़लाइन उपयोग जारी रखें'
                    : 'Continue as offline guest'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
