'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useRouter } from 'next/navigation';
import styles from './SessionVerification.module.css';

const SessionVerification = ({ children, onVerified, actionName = 'هذا الإجراء' }) => {
  const { user, loading, checkAuth } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();

  // التحقق من صحة الجلسة عند تحميل المكون
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
        console.log(user ? 'الجلسة موجودة' : 'الجلسة غير موجودة');
      } catch (error) {
        console.log('الجلسة غير موجودة (خطأ في التحقق)');
      } finally {
        setAuthChecked(true);
      }
    };

    verifyAuth();
  }, [checkAuth, user]);

  const handleClick = (e) => {
    e?.stopPropagation();
    console.log(user ? 'الجلسة موجودة' : 'الجلسة غير موجودة');
    
    if (user) {
      if (onVerified) onVerified();
    } else {
      setShowLoginPrompt(true);
    }
  };

  const handleLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleClose = () => {
    setShowLoginPrompt(false);
  };

  // إذا كان التحميل جارياً، لا نعرض شيئاً
  if (loading || !authChecked) {
    return null;
  }

  return (
    <>
      <div onClick={handleClick} style={{ display: 'inline-block' }}>
        {children}
      </div>

      {showLoginPrompt && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>يجب تسجيل الدخول</h3>
            <p>يجب أن تكون مسجلاً الدخول لـ {actionName}.</p>
            <div className={styles.buttons}>
              <button 
                className={styles.loginButton} 
                onClick={handleLogin}
              >
                تسجيل الدخول
              </button>
              <button 
                className={styles.cancelButton}
                onClick={handleClose}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionVerification;
