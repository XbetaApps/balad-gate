'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../app/auth/AuthProvider';
import { useSession } from '../../contexts/SessionContext';

/**
 * SessionVerification
 * 
 * مكون للتحقق من صحة الجلسة والتحكم في الوصول
 * 
 * Props:
 * - children: العناصر المراد عرضها إذا كان المستخدم مصادقاً
 */
export default function SessionVerification({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { isLoading, setVerified } = useSession();

  useEffect(() => {
    // تخطي الصفحات التي لا تتطلب تحقق
    if (pathname === '/auth' || pathname.startsWith('/_next')) {
      return;
    }

    if (loading || isLoading) return;
    
    if (!user) {
      // إذا لم يكن المستخدم مسجل الدخول، قم بتوجيهه إلى صفحة تسجيل الدخول
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // إذا كان المستخدم مسجل الدخول، قم بتعيين الحالة على أنها تم التحقق منها
    if (user) {
      setVerified(true);
    }
  }, [user, loading, pathname, router, isLoading, setVerified]);

  // إرجاع null أثناء التحميل
  if (loading || isLoading) return null;

  // إذا كان المستخدم غير مسجل، لا تعرض شيئاً (سيتم توجيهه)
  if (!user) return null;

  // اعرض المحتوى للأعضاء المسجلين
  return children;
}
