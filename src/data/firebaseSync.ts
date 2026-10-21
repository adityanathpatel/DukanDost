import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase';
import { Product, StockMovement } from '@/domain/types';
import { productRepository } from './productRepository';

export interface SyncStatus {
  lastSyncedAt: number | null;
  isSyncing: boolean;
  error: string | null;
  syncedCount: { products: number; movements: number };
}

const LAST_SYNC_KEY = 'dukaan_dost_last_firestore_sync';

export class FirebaseSyncService {
  private lastSyncedAt: number | null = null;

  constructor() {
    const saved = localStorage.getItem(LAST_SYNC_KEY);
    if (saved) {
      this.lastSyncedAt = parseInt(saved, 10) || null;
    }
  }

  getLastSyncedAt(): number | null {
    return this.lastSyncedAt;
  }

  /**
   * Pushes a single product to Firestore under users/{userId}/products/{productId}
   */
  async saveProduct(userId: string, product: Product): Promise<void> {
    if (!firestoreDb || !isFirebaseConfigured || !userId) return;
    try {
      const productRef = doc(firestoreDb, 'users', userId, 'products', product.id);
      await setDoc(productRef, {
        ...product,
        syncedAt: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Error saving product to Firestore:', err);
    }
  }

  /**
   * Pushes a single stock movement to Firestore under users/{userId}/movements/{movementId}
   */
  async saveMovement(userId: string, movement: StockMovement): Promise<void> {
    if (!firestoreDb || !isFirebaseConfigured || !userId) return;
    try {
      const movementRef = doc(firestoreDb, 'users', userId, 'movements', movement.id);
      await setDoc(movementRef, {
        ...movement,
        syncedAt: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] Error saving movement to Firestore:', err);
    }
  }

  /**
   * Pulls products and movements from Firestore into local IndexedDB
   * Useful when signing in on a new device or restoring cloud backup
   */
  async pullFromFirestore(userId: string): Promise<{ productsCount: number; movementsCount: number }> {
    if (!firestoreDb || !isFirebaseConfigured || !userId) {
      return { productsCount: 0, movementsCount: 0 };
    }

    try {
      // 1. Fetch products
      const productsCol = collection(firestoreDb, 'users', userId, 'products');
      const productsSnapshot = await getDocs(productsCol);
      const remoteProducts: Product[] = [];
      productsSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        if (data && data.id && data.name) {
          remoteProducts.push(data);
        }
      });

      // 2. Fetch recent movements
      const movementsCol = collection(firestoreDb, 'users', userId, 'movements');
      const movementsQuery = query(movementsCol, orderBy('timestamp', 'desc'), limit(100));
      const movementsSnapshot = await getDocs(movementsQuery);
      const remoteMovements: StockMovement[] = [];
      movementsSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as StockMovement;
        if (data && data.id && data.productId) {
          remoteMovements.push(data);
        }
      });

      // Merge into local IndexedDB if remote items exist
      if (remoteProducts.length > 0) {
        for (const p of remoteProducts) {
          const existing = await productRepository.getProductById(p.id);
          if (!existing) {
            await productRepository.createProduct(p);
          } else if (p.updatedAt > existing.updatedAt) {
            await productRepository.updateProduct(p.id, p);
          }
        }
      }

      this.updateLastSynced();
      return {
        productsCount: remoteProducts.length,
        movementsCount: remoteMovements.length,
      };
    } catch (err) {
      console.error('[FirebaseSync] Error pulling from Firestore:', err);
      throw err;
    }
  }

  /**
   * Full push of all local IndexedDB products and movements to Firestore
   */
  async pushAllToFirestore(userId: string): Promise<{ productsCount: number; movementsCount: number }> {
    if (!firestoreDb || !isFirebaseConfigured || !userId) {
      throw new Error('Firebase Firestore is not configured or user is not authenticated');
    }

    const [products, movements] = await Promise.all([
      productRepository.listProducts({ includeArchived: true }),
      productRepository.getRecentMovements(200),
    ]);

    const batch = writeBatch(firestoreDb);
    let operationCount = 0;

    // Add products to batch
    for (const prod of products) {
      const prodRef = doc(firestoreDb, 'users', userId, 'products', prod.id);
      batch.set(prodRef, { ...prod, syncedAt: Date.now() }, { merge: true });
      operationCount++;
      if (operationCount >= 450) break; // Firestore 500-op limit
    }

    // Add movements to batch
    for (const mov of movements) {
      if (operationCount >= 480) break;
      const movRef = doc(firestoreDb, 'users', userId, 'movements', mov.id);
      batch.set(movRef, { ...mov, syncedAt: Date.now() }, { merge: true });
      operationCount++;
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    this.updateLastSynced();
    return {
      productsCount: products.length,
      movementsCount: movements.length,
    };
  }

  private updateLastSynced() {
    const now = Date.now();
    this.lastSyncedAt = now;
    localStorage.setItem(LAST_SYNC_KEY, now.toString());
  }
}

export const firebaseSyncService = new FirebaseSyncService();
