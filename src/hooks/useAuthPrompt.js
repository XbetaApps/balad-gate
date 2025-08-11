'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignInAlt, FaTimes } from 'react-icons/fa';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { useAuth } from '@/app/auth/AuthProvider';
import { useSession } from '@/contexts/SessionContext';

/**
 * useAuthPrompt
 * - يتحقق من user + isSessionVerified قبل تنفيذ أي إجراء
 * - يعرض نافذة منبثقة إن لم يكن المستخدم مسجل
 * - يحفظ returnUrl و ينفّذ الإجراء تلقائيًا بعد نجاح تسجيل الدخول
 */
const useAuthPrompt = () => {
  const router = useRouter();
  const theme = useTheme();

  // من مزوّدي السياق عندك
  const { user, loading: authLoading, logout } = useAuth();
  const { isVerified: isSessionVerified } = useSession();

  // حالات داخلية
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authActionName, setAuthActionName] = useState('هذا الإجراء');
  const [error, setError] = useState(null);

  // نخزّن الإجراء المطلوب تنفيذه بعد تسجيل الدخول
  const pendingActionRef = useRef(null);

  const isLoading = authLoading;

  // عند الموافقة على الذهاب لتسجيل الدخول
  const handleLoginConfirm = useCallback(() => {
    setShowLoginPrompt(false);
    // حفظ الصفحة الحالية للعودة إليها بعد تسجيل الدخول
    const currentPath = window.location.pathname + window.location.search;
    try {
      localStorage.setItem('returnUrl', currentPath);
    } catch {}
    router.push('/auth');
  }, [router]);

  const handleLoginCancel = useCallback(() => {
    setShowLoginPrompt(false);
    setError(null);
  }, []);

  /**
   * إرجاع رؤوس المصادقة للطلبات (JWT في localStorage إن وُجد)
   */
  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {}
    return headers;
  }, []);

  /**
   * requireAuth
   * @param {Function} action - يُنفّذ إذا كان المستخدم مسجلًا ومفعّل الجلسة
   * @param {string} actionName - اسم الإجراء للعرض داخل النافذة
   * @param {boolean} requireVerification - افتراضي true لتطلب isSessionVerified
   */
  const requireAuth = useCallback(
    async (action, actionName = 'هذا الإجراء', requireVerification = true) => {
      // لو لسه التحميل جارٍ، نمنع تكرار الضغط
      if (authLoading) return false;

      const authed = !!user && (!requireVerification || isSessionVerified);

      if (authed) {
        if (typeof action === 'function') await action();
        return true;
      }

      // غير مسجل/غير مفعّل → افتح الدايالوج واحفظ الإجراء
      pendingActionRef.current = typeof action === 'function' ? action : null;
      setAuthActionName(actionName);
      setShowLoginPrompt(true);
      return false;
    },
    [user, isSessionVerified, authLoading]
  );

  // لو كان الدايالوج مفتوحًا ثم أصبح user + isSessionVerified صحيحين → نفذ الإجراء واحفظ
  useEffect(() => {
    if (showLoginPrompt && user && isSessionVerified && pendingActionRef.current) {
      const fn = pendingActionRef.current;
      pendingActionRef.current = null;
      setShowLoginPrompt(false);
      Promise.resolve().then(() => fn()); // نفّذه بهدوء بعد إغلاق الدايالوج
    }
  }, [showLoginPrompt, user, isSessionVerified]);

  // مكوّن الدايالوج
  const AuthPromptDialog = useMemo(
    () => function DialogComponent() {
      return (
        <Dialog
          open={showLoginPrompt}
          onClose={handleLoginCancel}
          aria-labelledby="auth-dialog-title"
          aria-describedby="auth-dialog-description"
          dir="rtl"
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            id="auth-dialog-title"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              py: 1.5,
              textAlign: 'center',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="center">
              <FaSignInAlt style={{ marginLeft: 8 }} />
              <Typography variant="h6" component="span">
                تسجيل الدخول مطلوب
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ py: 3 }}>
            <Box textAlign="center" mb={2}>
              <Typography variant="body1" gutterBottom>
                {`يجب عليك تسجيل الدخول للوصول إلى ${authActionName}.`}
              </Typography>
              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: 'center',
              px: 3,
              pb: 3,
              '& > :not(style)': { mx: 1, minWidth: 100 },
            }}
          >
            <Button
              onClick={handleLoginCancel}
              variant="outlined"
              color="inherit"
              startIcon={<FaTimes />}
              fullWidth
            >
              إلغاء
            </Button>

            <Button
              onClick={handleLoginConfirm}
              variant="contained"
              color="primary"
              autoFocus
              startIcon={
                isLoading ? <CircularProgress size={20} color="inherit" /> : <FaSignInAlt />
              }
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    },
    [showLoginPrompt, authActionName, error, isLoading, theme, handleLoginCancel, handleLoginConfirm]
  );

  return {
    // الحالة
    user,
    isAuthenticated: !!user,
    isLoading,

    // الدوال
    requireAuth,
    getAuthHeaders,
    logout, // من AuthProvider

    // المكونات
    AuthPromptDialog,

    // أذونات بسيطة
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => roles?.includes?.(user?.role),
  };
};

export default useAuthPrompt;
