'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../app/auth/AuthProvider';
import { useSession } from 'next-auth/react';

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
  const { status } = useSession();

  useEffect(() => {
    // تخطي الصفحات التي لا تتطلب تحقق
    if (pathname === '/auth' || pathname.startsWith('/_next')) {
      return;
    }

    if (loading || status === 'loading') return;
    
    if (!user) {
      // إذا لم يكن المستخدم مسجل الدخول، قم بتوجيهه إلى صفحة تسجيل الدخول
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // لا حاجة لتعيين الحالة حيث أن next-auth يتعامل مع الحالة تلقائياً
  }, [user, loading, pathname, router, status]);

  // إرجاع null أثناء التحميل
  if (loading || status === 'loading') return null;

  // إذا كان المستخدم غير مسجل، لا تعرض شيئاً (سيتم توجيهه)
  if (!user) return null;

  // اعرض المحتوى للأعضاء المسجلين
  return children;
}
