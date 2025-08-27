"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // لمنع سباقات طلبات checkAuth المتعددة
  const checkingRef = useRef(null);

  const readToken = () => {
    try { return localStorage.getItem('token'); } catch { return null; }
  };
  const writeToken = (val) => {
    try {
      if (val) localStorage.setItem('token', val);
      else localStorage.removeItem('token');
    } catch {}
  };

  const updateUser = useCallback(async (userData) => {
    try {
      console.log('Updating user data in context:', userData);
      setUser(prevUser => ({
        ...prevUser,
        ...userData
      }));
      return userData;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    if (checkingRef.current) return checkingRef.current;
    
    const run = (async () => {
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
            
            // تحويل القيم النصية إلى قيم منطقية
            if (typeof currentUser.onboarding_done === 'string') {
              currentUser.onboarding_done = currentUser.onboarding_done === 'true' || currentUser.onboarding_done === '1';
            }
            
            // تعيين قيمة افتراضية لحالة الإعداد إذا لم تكن محددة
            if (currentUser.onboarding_done === undefined || currentUser.onboarding_done === null) {
              console.log('Setting default onboarding_done to false');
              currentUser.onboarding_done = false;
              
              // تحديث حالة المستخدم في الخادم
              try {
                await fetch('/api/user/update-onboarding', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser.id
                  },
                  body: JSON.stringify({ 
                    onboarding_done: false,
                    onboarding_done_at: null
                  })
                });
              } catch (error) {
                console.error('Error updating user onboarding status:', error);
              }
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

  useEffect(() => {
    checkAuth();

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
    checkAuth,
    updateUser,
    getToken: readToken,
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
