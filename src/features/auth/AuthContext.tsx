import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, storeName?: string) => Promise<void>;
  logOut: () => Promise<void>;
  storeName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORE_NAME_KEY = 'dukaan_dost_store_name';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [storeName, setStoreName] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORE_NAME_KEY) || 'शर्मा किराना स्टोर';
  });

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setStoreName(currentUser.displayName);
        localStorage.setItem(LOCAL_STORE_NAME_KEY, currentUser.displayName);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);
    if (result.user.displayName) {
      setStoreName(result.user.displayName);
      localStorage.setItem(LOCAL_STORE_NAME_KEY, result.user.displayName);
    }
  };

  const signUp = async (email: string, password: string, newStoreName?: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const chosenName = newStoreName?.trim() || 'मेरी दुकान';
    await updateProfile(result.user, { displayName: chosenName });
    setUser(result.user);
    setStoreName(chosenName);
    localStorage.setItem(LOCAL_STORE_NAME_KEY, chosenName);
  };

  const logOut = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseAvailable: isFirebaseConfigured,
        signIn,
        signUp,
        logOut,
        storeName,
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
