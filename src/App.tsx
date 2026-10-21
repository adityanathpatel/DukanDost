import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Navigation, NavigationTab } from '@/components/Navigation';
import { HomeScreen } from '@/features/home/HomeScreen';
import { InventoryScreen } from '@/features/inventory/InventoryScreen';
import { ReportsScreen } from '@/features/reports/ReportsScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { RecordSaleModal } from '@/features/sales/RecordSaleModal';
import { AddStockModal } from '@/features/stock/AddStockModal';
import { AuthProvider, AuthModal, useAuth } from '@/features/auth';
import { firebaseSyncService } from '@/data/firebaseSync';
import { INITIAL_SAMPLE_PRODUCTS } from '@/data/sampleProducts';
import { productRepository, generateId } from '@/data/productRepository';
import { Product, StockMovement, CreateProductInput, UpdateProductInput } from '@/domain/types';
import { CheckCircle2, AlertCircle, Database, PackagePlus } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [preSelectedProductId, setPreSelectedProductId] = useState<string | undefined>(undefined);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => firebaseSyncService.getLastSyncedAt());

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError: boolean = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  // Load products and recent movements directly from IndexedDB
  const refreshProducts = useCallback(async () => {
    try {
      const [persistedProducts, movements] = await Promise.all([
        productRepository.listProducts(),
        productRepository.getRecentMovements(10),
      ]);
      setProducts(persistedProducts);
      setRecentMovements(movements);
    } catch (err: unknown) {
      console.error('Failed to load products from IndexedDB:', err);
      showToast(language === 'hi' ? 'डेटाबेस लोड करने में त्रुटि' : 'Error reading database', true);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Synchronize with Firebase when user signs in
  useEffect(() => {
    if (user) {
      setIsSyncing(true);
      firebaseSyncService.pullFromFirestore(user.uid)
        .then(() => refreshProducts())
        .catch((err) => console.warn('[App] Pull error:', err))
        .finally(() => {
          setIsSyncing(false);
          setLastSyncedAt(firebaseSyncService.getLastSyncedAt());
        });
    }
  }, [user, refreshProducts]);

  const handleOpenRecordSale = (productId?: string) => {
    setPreSelectedProductId(productId);
    setIsSaleModalOpen(true);
  };

  const handleOpenAddStock = (productId?: string) => {
    setPreSelectedProductId(productId);
    setIsAddStockModalOpen(true);
  };

  // Atomic Record Sale via IndexedDB + Async Firebase Sync
  const handleRecordSale = async (productId: string, quantity: number) => {
    const operationId = generateId('op_sale');
    try {
      const { product, movement } = await productRepository.recordSale({
        productId,
        quantity,
        operationId,
        note: language === 'hi' ? 'दुकान बिक्री' : 'Retail Sale',
      });

      await refreshProducts();

      // Async sync to Firebase Firestore if logged in
      if (user) {
        firebaseSyncService.saveProduct(user.uid, product).catch(console.warn);
        firebaseSyncService.saveMovement(user.uid, movement).catch(console.warn);
      }

      const prodName = language === 'hi' ? product.nameHi || product.name : product.name;
      showToast(
        language === 'hi'
          ? `✅ बिक्री दर्ज: ${prodName} (-${quantity} ${product.unit}) [लेजर ID: ${movement.id.slice(-6)}]`
          : `✅ Sale recorded: ${prodName} (-${quantity} ${product.unit}) [Ledger ID: ${movement.id.slice(-6)}]`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'बिक्री दर्ज करने में त्रुटि';
      showToast(message, true);
      throw err;
    }
  };

  // Atomic Add Stock via IndexedDB + Async Firebase Sync
  const handleAddStock = async (productId: string, quantity: number) => {
    const operationId = generateId('op_inward');
    try {
      const { product, movement } = await productRepository.recordStockInward({
        productId,
        quantity,
        operationId,
        note: language === 'hi' ? 'सप्लायर माल आवक' : 'Supplier stock inward',
      });

      await refreshProducts();

      // Async sync to Firebase Firestore if logged in
      if (user) {
        firebaseSyncService.saveProduct(user.uid, product).catch(console.warn);
        firebaseSyncService.saveMovement(user.uid, movement).catch(console.warn);
      }

      const prodName = language === 'hi' ? product.nameHi || product.name : product.name;
      showToast(
        language === 'hi'
          ? `📦 नया माल जुड़ा: ${prodName} (+${quantity} ${product.unit}) [लेजर ID: ${movement.id.slice(-6)}]`
          : `📦 Stock added: ${prodName} (+${quantity} ${product.unit}) [Ledger ID: ${movement.id.slice(-6)}]`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'माल जोड़ने में त्रुटि';
      showToast(message, true);
      throw err;
    }
  };

  // Create Product via IndexedDB + Async Firebase Sync
  const handleAddProduct = async (input: CreateProductInput) => {
    try {
      const newProd = await productRepository.createProduct(input);
      await refreshProducts();

      if (user) {
        firebaseSyncService.saveProduct(user.uid, newProd).catch(console.warn);
      }

      showToast(
        language === 'hi'
          ? `✅ नया सामान जुड़ा: ${newProd.name} (स्टॉक: ${newProd.stockQty} ${newProd.unit})`
          : `✅ Product added: ${newProd.name} (Stock: ${newProd.stockQty} ${newProd.unit})`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'सामान जोड़ने में त्रुटि';
      showToast(message, true);
      throw err;
    }
  };

  // Update Product metadata via IndexedDB + Async Firebase Sync
  const handleUpdateProduct = async (id: string, updates: UpdateProductInput) => {
    try {
      const updated = await productRepository.updateProduct(id, updates);
      await refreshProducts();

      if (user) {
        firebaseSyncService.saveProduct(user.uid, updated).catch(console.warn);
      }

      showToast(
        language === 'hi'
          ? `✅ विवरण अपडेट: ${updated.name}`
          : `✅ Product updated: ${updated.name}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'अपडेट में त्रुटि';
      showToast(message, true);
      throw err;
    }
  };

  // Manual Trigger to sync all IndexedDB data to Firestore
  const handleSyncNow = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      const { productsCount, movementsCount } = await firebaseSyncService.pushAllToFirestore(user.uid);
      await refreshProducts();
      setLastSyncedAt(firebaseSyncService.getLastSyncedAt());
      showToast(
        language === 'hi'
          ? `✅ Firebase में सुरक्षित: ${productsCount} सामान, ${movementsCount} लेन-देन!`
          : `✅ Synced to Firebase: ${productsCount} products, ${movementsCount} ledger entries!`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'सिंक त्रुटि';
      showToast(message, true);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Load sample Kirana dataset into empty IndexedDB
  const handleLoadSampleData = async () => {
    try {
      setIsLoading(true);
      await productRepository.seedSampleDataIfEmpty(INITIAL_SAMPLE_PRODUCTS);
      await refreshProducts();
      showToast(
        language === 'hi'
          ? 'डेमो किराना डेटा IndexedDB में सुरक्षित लोड हो गया है।'
          : 'Sample Kirana data persisted into IndexedDB.'
      );
    } catch (err: unknown) {
      console.error(err);
      showToast(language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error seeding database', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset data: Clears IndexedDB and re-seeds
  const handleResetData = async () => {
    try {
      setIsLoading(true);
      await productRepository.clearAllData();
      await productRepository.seedSampleDataIfEmpty(INITIAL_SAMPLE_PRODUCTS);
      await refreshProducts();
      showToast(
        language === 'hi'
          ? 'IndexedDB डेटाबेस रीसेट हो गया है।'
          : 'IndexedDB database reset and re-seeded.'
      );
    } catch (err: unknown) {
      console.error(err);
      showToast(language === 'hi' ? 'रीसेट में त्रुटि' : 'Error resetting database', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col font-sans selection:bg-dukaan-green-100">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed top-18 right-4 z-50 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce border ${
            toastMessage.isError ? 'bg-rose-900 border-rose-700' : 'bg-slate-900 border-slate-700'
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          )}
          <span className="text-xs font-black">{toastMessage.text}</span>
        </div>
      )}

      {/* Modern Responsive Web Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        language={language}
        onLanguageToggle={toggleLanguage}
        onOpenSearch={() => setCurrentTab('inventory')}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Main Responsive Web Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black text-slate-500">
              {language === 'hi' ? 'IndexedDB डेटाबेस लोड हो रहा है...' : 'Loading local IndexedDB...'}
            </p>
          </div>
        ) : products.length === 0 ? (
          // Graceful Empty Database State
          <div className="py-16 max-w-lg mx-auto text-center space-y-4 bg-white rounded-3xl p-8 border border-slate-200 mt-6 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-pastel-lavender flex items-center justify-center mx-auto text-violet-700 shadow-sm">
              <Database className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                {language === 'hi' ? 'दुकान की इन्वेंट्री खाली है' : 'Store Inventory is Empty'}
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {language === 'hi'
                  ? 'स्थानीय IndexedDB डेटाबेस सक्रिय है, लेकिन अभी कोई सामान नहीं है। आप नमूना किराना डेटा लोड कर सकते हैं या नया सामान जोड़ सकते हैं।'
                  : 'Your local IndexedDB is active, but contains zero products. You can load realistic Kirana sample items to test.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleLoadSampleData}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <PackagePlus className="w-4 h-4 text-amber-300" />
                <span>
                  {language === 'hi'
                    ? 'डेमो डेटा लोड करें'
                    : 'Load Demo Kirana Products'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeScreen
                products={products}
                recentMovements={recentMovements}
                onOpenRecordSale={handleOpenRecordSale}
                onOpenAddStock={handleOpenAddStock}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                language={language}
              />
            )}

            {currentTab === 'inventory' && (
              <div className="max-w-4xl mx-auto py-4">
                <InventoryScreen
                  products={products}
                  onOpenRecordSale={handleOpenRecordSale}
                  onOpenAddStock={handleOpenAddStock}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  language={language}
                />
              </div>
            )}

            {currentTab === 'reports' && (
              <div className="max-w-4xl mx-auto py-4">
                <ReportsScreen
                  products={products}
                  language={language}
                  onReorderClick={(prodId) => handleOpenAddStock(prodId)}
                />
              </div>
            )}

            {currentTab === 'profile' && (
              <div className="max-w-2xl mx-auto py-4">
                <ProfileScreen
                  language={language}
                  onToggleLanguage={toggleLanguage}
                  onResetData={handleResetData}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onSyncNow={handleSyncNow}
                  isSyncing={isSyncing}
                  lastSyncedAt={lastSyncedAt}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Visible on mobile/tablet viewports) */}
      <div className="md:hidden">
        <Navigation
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          language={language}
        />
      </div>

      {/* Record Sale Modal */}
      <RecordSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        products={
          preSelectedProductId
            ? [
                products.find((p) => p.id === preSelectedProductId)!,
                ...products.filter((p) => p.id !== preSelectedProductId),
              ].filter(Boolean)
            : products
        }
        onRecordSale={handleRecordSale}
        language={language}
      />

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        products={
          preSelectedProductId
            ? [
                products.find((p) => p.id === preSelectedProductId)!,
                ...products.filter((p) => p.id !== preSelectedProductId),
              ].filter(Boolean)
            : products
        }
        onAddStock={handleAddStock}
        language={language}
      />

      {/* Auth Modal (Firebase Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
