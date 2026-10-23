/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db as firestoreDb, isFirebaseConfigured } from '@/lib/firebase';
import { ShopkeeperProfile } from '@/domain/types';

interface SignUpInput {
  shopkeeperName: string;
  storeName: string;
  storeCategory: ShopkeeperProfile['storeCategory'];
  storeAddress: string;
  pincode: string;
  phone: string;
  gstin?: string;
  email: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  profile: ShopkeeperProfile | null;
  loading: boolean;
  isFirebaseAvailable: boolean;
  isGuest: boolean;
  storeName: string;
  signIn: (identifier: string, password?: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  logOut: () => Promise<void>;
  updateProfileData: (updates: Partial<ShopkeeperProfile>) => Promise<void>;
  setGuest: (guest: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORE_NAME_KEY = 'dukaan_dost_store_name';
const LOCAL_PROFILE_KEY = 'dukaan_dost_shopkeeper_profile';
const LOCAL_GUEST_KEY = 'dukaan_dost_is_guest';

export const DEFAULT_SHOPKEEPER_PROFILE: ShopkeeperProfile = {
  shopkeeperName: 'रमेश शर्मा',
  storeName: 'शर्मा किराना स्टोर',
  storeCategory: 'Kirana / Grocery',
  storeAddress: 'मेन मार्केट, चौक चौराहा',
  pincode: '226001',
  phone: '9876543210',
  gstin: '09AAAAA0000A1Z5',
  email: 'sharma.kirana@dukandost.in',
  createdAt: Date.now(),
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuestState] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_GUEST_KEY) === 'true';
  });

  const [profile, setProfile] = useState<ShopkeeperProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (saved) {
        return JSON.parse(saved) as ShopkeeperProfile;
      }
    } catch (e) {
      console.warn('Failed to parse local profile:', e);
    }
    return null;
  });

  const [storeName, setStoreName] = useState<string>(() => {
    return profile?.storeName || localStorage.getItem(LOCAL_STORE_NAME_KEY) || 'शर्मा किराना स्टोर';
  });

  const setGuest = (guest: boolean) => {
    setIsGuestState(guest);
    localStorage.setItem(LOCAL_GUEST_KEY, String(guest));
  };

  // Keep storeName in sync with profile
  useEffect(() => {
    if (profile?.storeName) {
      setStoreName(profile.storeName);
      localStorage.setItem(LOCAL_STORE_NAME_KEY, profile.storeName);
    }
  }, [profile]);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuestState(false);
        localStorage.setItem(LOCAL_GUEST_KEY, 'false');

        // Attempt to fetch profile from Firestore if online
        if (firestoreDb) {
          try {
            const profileRef = doc(firestoreDb, 'users', currentUser.uid, 'profile', 'info');
            const snap = await getDoc(profileRef);
            if (snap.exists()) {
              const remoteProfile = snap.data() as ShopkeeperProfile;
              setProfile(remoteProfile);
              localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(remoteProfile));
              if (remoteProfile.storeName) {
                setStoreName(remoteProfile.storeName);
                localStorage.setItem(LOCAL_STORE_NAME_KEY, remoteProfile.storeName);
              }
            }
          } catch (err) {
            console.warn('[AuthContext] Firestore profile fetch skipped/failed:', err);
          }
        }

        if (currentUser.displayName) {
          setStoreName(currentUser.displayName);
          localStorage.setItem(LOCAL_STORE_NAME_KEY, currentUser.displayName);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (identifier: string, password: string = '123456') => {
    // Check if offline/demo sign-in or Firebase Auth sign-in
    const trimmedId = identifier.trim();

    if (auth && isFirebaseConfigured && trimmedId.includes('@')) {
      const result = await signInWithEmailAndPassword(auth, trimmedId, password);
      setUser(result.user);
      setIsGuestState(false);
      localStorage.setItem(LOCAL_GUEST_KEY, 'false');

      if (result.user.displayName) {
        setStoreName(result.user.displayName);
        localStorage.setItem(LOCAL_STORE_NAME_KEY, result.user.displayName);
      }
      return;
    }

    // Local / Phone / Demo sign-in
    // If identifier matches saved profile or demo, restore/set it
    let effectiveProfile: ShopkeeperProfile = profile || {
      ...DEFAULT_SHOPKEEPER_PROFILE,
      phone: trimmedId.replace(/\D/g, '') || DEFAULT_SHOPKEEPER_PROFILE.phone,
    };

    if (trimmedId && trimmedId.includes('@')) {
      effectiveProfile = { ...effectiveProfile, email: trimmedId };
    }

    setProfile(effectiveProfile);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(effectiveProfile));
    setStoreName(effectiveProfile.storeName);
    localStorage.setItem(LOCAL_STORE_NAME_KEY, effectiveProfile.storeName);
    setIsGuestState(false);
    localStorage.setItem(LOCAL_GUEST_KEY, 'false');
  };

  const signUp = async (input: SignUpInput) => {
    const newProfile: ShopkeeperProfile = {
      shopkeeperName: input.shopkeeperName.trim(),
      storeName: input.storeName.trim() || 'दुकान दोस्त',
      storeCategory: input.storeCategory,
      storeAddress: input.storeAddress.trim(),
      pincode: input.pincode.trim(),
      phone: input.phone.trim(),
      gstin: input.gstin?.trim() || undefined,
      email: input.email.trim(),
      createdAt: Date.now(),
    };

    // Attempt Firebase registration if configured
    if (auth && isFirebaseConfigured && input.email && input.password) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
        await firebaseUpdateProfile(cred.user, { displayName: newProfile.storeName });
        setUser(cred.user);

        // Save profile to Firestore
        if (firestoreDb) {
          try {
            const profileRef = doc(firestoreDb, 'users', cred.user.uid, 'profile', 'info');
            await setDoc(profileRef, newProfile, { merge: true });
          } catch (syncErr) {
            console.warn('[AuthContext] Firestore profile save failed:', syncErr);
          }
        }
      } catch (authErr) {
        console.warn('[AuthContext] Firebase Auth failed, proceeding with local profile:', authErr);
        throw authErr;
      }
    }

    // Save locally
    setProfile(newProfile);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
    setStoreName(newProfile.storeName);
    localStorage.setItem(LOCAL_STORE_NAME_KEY, newProfile.storeName);
    setIsGuestState(false);
    localStorage.setItem(LOCAL_GUEST_KEY, 'false');
  };

  const updateProfileData = async (updates: Partial<ShopkeeperProfile>) => {
    if (!profile) return;
    const updated: ShopkeeperProfile = { ...profile, ...updates };
    setProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));

    if (updated.storeName) {
      setStoreName(updated.storeName);
      localStorage.setItem(LOCAL_STORE_NAME_KEY, updated.storeName);
    }

    if (user && firestoreDb) {
      try {
        const profileRef = doc(firestoreDb, 'users', user.uid, 'profile', 'info');
        await setDoc(profileRef, updated, { merge: true });
      } catch (e) {
        console.warn('Failed to update remote profile:', e);
      }
    }
  };

  const logOut = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Signout error:', e);
      }
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    localStorage.removeItem(LOCAL_GUEST_KEY);
    setIsGuestState(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isFirebaseAvailable: isFirebaseConfigured,
        isGuest,
        storeName,
        signIn,
        signUp,
        logOut,
        updateProfileData,
        setGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
