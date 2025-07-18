'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// إنشاء السياق
const SessionContext = createContext();

// مكون الموفر للسياق
export function SessionProvider({ children }) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // تحميل حالة التحقق من التخزين المحلي عند التحميل
  useEffect(() => {
    const loadVerification = () => {
      try {
        const saved = localStorage.getItem('session_verified');
        if (saved) {
          const { isVerified, expiresAt } = JSON.parse(saved);
          // التحقق من انتهاء الصلاحية
          if (expiresAt > Date.now()) {
            setIsVerified(true);
          } else {
            localStorage.removeItem('session_verified');
          }
        }
      } catch (error) {
        console.error('Error loading session verification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVerification();
  }, []);

  // تعيين حالة التحقق
  const setVerified = useCallback((verified) => {
    if (verified) {
      // حفظ في التخزين المحلي مع تاريخ انتهاء الصلاحية (24 ساعة)
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('session_verified', JSON.stringify({ isVerified: true, expiresAt }));
    } else {
      localStorage.removeItem('session_verified');
    }
    setIsVerified(verified);
  }, []);

  // إعادة تعيين حالة التحقق
  const resetVerification = useCallback(() => {
    localStorage.removeItem('session_verified');
    setIsVerified(false);
  }, []);

  // قيمة السياق
  const value = {
    isVerified,
    isLoading,
    setVerified,
    resetVerification,
  };

  return (
    <SessionContext.Provider value={value}>
      {!isLoading && children}
    </SessionContext.Provider>
  );
}

// خطاف مخصص لاستخدام السياق
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
