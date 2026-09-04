import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
} from '@/lib/firebase';
import { message } from 'antd';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { fullName: string; identifier: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for promise timeout
const withTimeout = <T,>(promise: Promise<T>, ms = 2000): Promise<T | null> => {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage Cache
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('kelompokin_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to local cache
  useEffect(() => {
    if (user && user.uid) {
      localStorage.setItem('kelompokin_user', JSON.stringify(user));
      // Save permanently by UID so re-login never loses data
      localStorage.setItem(`kelompokin_profile_${user.uid}`, JSON.stringify(user));
    }
  }, [user]);

  // Robust Fetch and Sync User Profile
  const fetchAndSyncProfile = async (fbUser: any): Promise<UserProfile> => {
    let cachedIdentifier = '';
    let cachedFullName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Pengguna';

    // 1. Check permanent UID-keyed cache first
    try {
      const saved = localStorage.getItem(`kelompokin_profile_${fbUser.uid}`) || localStorage.getItem('kelompokin_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid === fbUser.uid) {
          if (parsed.identifier) cachedIdentifier = parsed.identifier;
          if (parsed.fullName) cachedFullName = parsed.fullName;
        }
      }
    } catch (e) {
      console.warn('Cache read note:', e);
    }

    let finalProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      fullName: cachedFullName,
      identifier: cachedIdentifier,
      avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Query Firestore with timeout
    if (db && db.app) {
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userSnap = await withTimeout(getDoc(userDocRef), 1800);

        if (userSnap && (userSnap as any).exists && (userSnap as any).exists()) {
          const remoteData = (userSnap as any).data() as Partial<UserProfile>;
          finalProfile = {
            uid: fbUser.uid,
            email: remoteData.email || fbUser.email || finalProfile.email,
            fullName: remoteData.fullName || finalProfile.fullName,
            identifier: remoteData.identifier || cachedIdentifier || '',
            avatarUrl: remoteData.avatarUrl || fbUser.photoURL || finalProfile.avatarUrl,
            createdAt: remoteData.createdAt || finalProfile.createdAt,
            updatedAt: remoteData.updatedAt || finalProfile.updatedAt,
          };
        } else {
          // Document not in Firestore yet, write it
          setDoc(userDocRef, finalProfile, { merge: true }).catch(console.warn);
        }
      } catch (err) {
        console.warn('Firestore user fetch note:', err);
      }
    }

    // Save permanently & update state
    localStorage.setItem('kelompokin_user', JSON.stringify(finalProfile));
    localStorage.setItem(`kelompokin_profile_${fbUser.uid}`, JSON.stringify(finalProfile));
    setUser(finalProfile);
    return finalProfile;
  };

  // Auth State Listener
  useEffect(() => {
    if (!auth || !auth.app) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await fetchAndSyncProfile(fbUser);
      } else {
        setUser(null);
        localStorage.removeItem('kelompokin_user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Google Sign-In
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        const profile = await fetchAndSyncProfile(result.user);
        setIsLoading(false);
        message.success(`Selamat datang, ${profile.fullName}!`);
        return { success: true };
      }
      return { success: false, error: 'Tidak ada data akun Google.' };
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        message.info('Jendela login ditutup.');
      } else if (err.code === 'auth/popup-blocked') {
        message.warning('Pop-up login diblokir browser. Harap izinkan pop-up untuk situs ini.');
      } else if (err.code !== 'auth/cancelled-popup-request') {
        message.error(err.message || 'Gagal masuk dengan Google.');
      }
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Update Profile (Identifier & Full Name)
  const updateProfile = async (updates: { fullName: string; identifier: string; avatarUrl?: string }) => {
    if (!user) return { success: false, error: 'User not logged in' };

    try {
      const updated: UserProfile = {
        ...user,
        fullName: updates.fullName.trim(),
        identifier: updates.identifier.trim(),
        avatarUrl: updates.avatarUrl || user.avatarUrl,
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to state & permanent localStorage immediately
      setUser(updated);
      localStorage.setItem('kelompokin_user', JSON.stringify(updated));
      localStorage.setItem(`kelompokin_profile_${user.uid}`, JSON.stringify(updated));

      // 2. Save to Firestore
      if (db && db.app && user.uid) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, updated, { merge: true });
      }

      message.success('Profil berhasil disimpan!');
      return { success: true };
    } catch (err: any) {
      console.error('Update profile error:', err);
      message.error('Gagal menyimpan profil.');
      return { success: false, error: err.message };
    }
  };

  // 3. Logout
  const logout = async () => {
    try {
      if (auth && auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('Signout warning:', e);
    }
    setUser(null);
    localStorage.removeItem('kelompokin_user');
    localStorage.removeItem('kelompokin_active_room_id');
    message.info('Anda telah keluar.');
  };

  const isAuthenticated = Boolean(user && user.uid);
  const isProfileComplete = Boolean(
    user && user.identifier && user.identifier.trim().length > 0
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isProfileComplete,
        isLoading,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
