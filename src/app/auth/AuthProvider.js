"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Refs to track auth state and prevent unnecessary re-renders
  const checkingRef = useRef(null);
  const initialCheckDone = useRef(false);
  const authCheckTimeout = useRef(null);

  const readToken = () => {
    try { return localStorage.getItem('token'); } catch { return null; }
  };
  const writeToken = (val) => {
    try {
      if (val) localStorage.setItem('token', val);
      else localStorage.removeItem('token');
    } catch {}
  };

  const checkAuth = useCallback(async (force = false) => {
    // If already checking, return the current promise
    if (checkingRef.current) {
      console.log('Auth check already in progress');
      return checkingRef.current;
    }
    
    // If we have a user and not forcing a refresh, return current user
    if (user && !force) {
      console.log('Using cached user data');
      return user;
    }
    
    // Clear any pending timeouts
    if (authCheckTimeout.current) {
      clearTimeout(authCheckTimeout.current);
      authCheckTimeout.current = null;
    }
    
    const run = (async () => {
      console.log('Starting auth check...');
      setLoading(true);
      checkingRef.current = true;
      let currentUser = null;
      
      try {
        console.log('Starting authentication check...');
        
        // 1) التحقق بالكوكي أولاً
        let res = await fetch('/api/test-session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { 
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
        });

        console.log('Test session response:', res.status);
        
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          console.log('Session data:', data);
          
          if (data?.authenticated && data?.user) {
            console.log('User authenticated via session:', data.user);
            currentUser = data.user;
            // Ensure onboarding_done is always a boolean
            if (currentUser.onboarding_done === undefined || currentUser.onboarding_done === null) {
              currentUser.onboarding_done = false;
            }
            setUser(currentUser);
            return currentUser;
          }
        }

        // 2) احتياطيًا بالتوكن المحلي
        const token = readToken();
        if (token) {
          console.log('Trying token-based authentication...');
          res = await fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
          });

          if (res.ok) {
            const userData = await res.json().catch(() => null);
            if (userData) {
              setUser(userData);
              return;
            }
          }
        }

        setUser(null);
      } catch (err) {
        console.error('Authentication error:', err);
        setUser(null);
      } finally {
        setLoading(false);
        checkingRef.current = null;
      }
    })();

    checkingRef.current = run;
    return run;
  }, []);

  // Use a ref to store the last auth check time
  const lastAuthCheck = useRef(0);
  const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    let isMounted = true;
    let intervalId;
    
    const shouldCheckAuth = () => {
      // If we've never checked or it's been more than the interval since last check
      return !lastAuthCheck.current || 
             Date.now() - lastAuthCheck.current > AUTH_CHECK_INTERVAL;
    };

    const initializeAuth = async () => {
      try {
        // Only check if we need to
        if (shouldCheckAuth()) {
          await checkAuth();
          lastAuthCheck.current = Date.now();
        }
        
        if (isMounted) {
          // Set up polling to check auth status
          intervalId = setInterval(async () => {
            if (shouldCheckAuth()) {
              await checkAuth(true); // Force refresh
              lastAuthCheck.current = Date.now();
            }
          }, 30000); // Check every 30 seconds, but only refresh if needed
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    // Only run the initial check once
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      initializeAuth();
    }
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
        authCheckTimeout.current = null;
      }
    };
  }, [checkAuth]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') checkAuth();
    };
    const handleAuthStateChanged = () => { checkAuth(); };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-state-changed', handleAuthStateChanged);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include', // مهم لحفظ كوكي HttpOnly
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Login failed');
      }

      // إن عاد التوكن داخل الـ body
      if (data?.token) {
        writeToken(data.token);
      }

      await checkAuth();
      try { window.dispatchEvent(new Event('auth-state-changed')); } catch {}
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [checkAuth]);

  // Expose a lightweight refreshUser that simply re-runs checkAuth
  const refreshUser = useCallback(() => checkAuth(), [checkAuth]);

  const logout = useCallback(async () => {
    // تنظيف محلي دائمًا
    writeToken(null);
    setUser(null);
    try { window.dispatchEvent(new Event('auth-state-changed')); } catch {}

    // 1) حاول حذف الكوكي عبر POST (بلا انتقال صفحة)
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        // توجيه “ناعم”
        router.replace('/auth');
        router.refresh();
        return;
      }

      // إن لم يكن OK ننتقل للخطة B
      throw new Error(`Logout POST failed with status ${res.status}`);
    } catch (e) {
      console.warn('Soft logout failed, falling back to hard redirect:', e);
      // 2) خطة B: تحويل مباشر إلى GET endpoint ليمسح الكوكي ثم يعيدنا
      window.location.replace('/api/auth/logout?redirect=/auth');
    }
  }, [router]);

  // Function to get the current token
  const getToken = useCallback(() => {
    return new Promise((resolve) => {
      const token = readToken();
      if (token) {
        resolve(token);
      } else {
        // If no token, try to refresh auth state
        checkAuth().finally(() => {
          resolve(readToken());
        });
      }
    });
  }, [checkAuth]);

  const contextValue = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    checkAuth,
    getToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}