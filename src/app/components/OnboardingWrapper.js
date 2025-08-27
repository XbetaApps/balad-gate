'use client';

import { useEffect, useState } from 'react';
import OnboardingModal from './OnboardingModal';
import { useAuth } from '../auth/AuthProvider';

export default function OnboardingWrapper() {
  const { user, loading: authLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // 1) ما عندنا مستخدم أو ما خلص تحميل الهوية -> لا نعرض
      if (authLoading) {
        console.log('[OnboardingWrapper] authLoading=true → wait');
        return;
      }
      if (!user?.id) {
        console.log('[OnboardingWrapper] no user.id → hide');
        setShowModal(false);
        setReady(true);
        return;
      }

      // 2) افتراض: اعرض المودال حتى يثبت العكس
      // هذا يمنع فترات “اختفاء” إذا تأخّر الشبك أو فشل الطلب
      setShowModal(true);

      try {
        console.log('[OnboardingWrapper] checking /api/onboarding?action=check for user', user.id);
        const res = await fetch('/api/onboarding?action=check', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-User-Id': user.id, // مهم جدًا
          },
          cache: 'no-store',
        });

        const data = await res.json().catch(() => ({}));
        console.log('[OnboardingWrapper] check result:', res.status, data);

        if (cancelled) return;

        if (!res.ok) {
          // في حال الخطأ، نظل على showModal=true
          console.warn('[OnboardingWrapper] check failed → keep modal visible');
          setShowModal(true);
          setReady(true);
          return;
        }

        // 3) منطق الإظهار: إذا كانت القيمة false أو غير موجودة → اعرض
        const done = data?.onboarding_done === true;
        if (!done) {
          console.log('[OnboardingWrapper] onboarding_done=false → show modal');
          setShowModal(true);
        } else {
          console.log('[OnboardingWrapper] onboarding_done=true → hide modal');
          setShowModal(false);
        }
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        console.error('[OnboardingWrapper] check error → show modal by default:', err);
        setShowModal(true); // الافتراضي عند الفشل: اعرض
        setReady(true);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [authLoading, user?.id]);

  // 4) ردّ نداءات الإنهاء من المودال
  const handleOnboardingComplete = async ({ skipped, saved }) => {
    console.log('[OnboardingWrapper] onDone', { skipped, saved });
    setShowModal(false);
  };

  // 5) منع الوميض أثناء التحميل
  if (authLoading || !ready) return null;
  if (!showModal || !user) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] pointer-events-none">
      {/* نجعل الحاوية pointer-events:none ثم نعيدها للمودال نفسه */}
      <div className="pointer-events-auto">
        <OnboardingModal
          open={showModal}
          onDone={handleOnboardingComplete}
          onClose={() => setShowModal(false)}
        />
      </div>
    </div>
  );
}
