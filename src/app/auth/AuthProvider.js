"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // تحميل حالة المستخدم عند التحميل الأولي
  useEffect(() => {
    checkAuth();
    
    // الاستماع لتغييرات التخزين المحلي
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        return;
      }

      // هنا عادةً يتم التحقق من صحة التوكن مع الخادم
      // في الوقت الحالي سنفترض أنه صالح
      const userData = {
        id: 1,
        name: 'Alexa A.',
        email: 'alexaandriana@gmail.com'
      };
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Authentication error:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      // في التطبيق الحقيقي، استبدل هذا باستدعاء API فعلي
      // const res = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();
      
      // لمحاكاة تسجيل الدخول الناجح
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          name: 'Alexa A.',
          email: email
        }
      };
      
      localStorage.setItem('token', mockResponse.token);
      setUser(mockResponse.user);
      
      // إرسال حدث لتحديث المكونات الأخرى
      window.dispatchEvent(new Event('auth-state-changed'));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    // إرسال حدث لتحديث المكونات الأخرى
    window.dispatchEvent(new Event('auth-state-changed'));
    router.push('/auth');
  }, [router]);

  // قيمة السياق
  const contextValue = {
    user,
    loading,
    login,
    logout,
    checkAuth
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
