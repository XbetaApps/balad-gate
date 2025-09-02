'use client';

import { useEffect, useState } from 'react';
import OnboardingModal from './OnboardingModal';
import { useAuth } from '../auth/AuthProvider';

export default function OnboardingWrapper() {
  const { user, loading: authLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // إذا كان التحميل لا يزال جارياً، لا تفعل شيئاً
    if (authLoading) return;
    
    console.log('OnboardingWrapper - Auth state:', { 
      hasUser: !!user,
      userId: user?.id,
      onboardingDone: user?.onboarding_done
    });
    
    // إذا كان المستخدم مسجل الدخول
    if (user) {
      // إذا كانت حالة الإعداد غير معرفة أو false، اعرض النافذة
      const shouldShow = user.onboarding_done === false || user.onboarding_done === undefined;
      console.log('OnboardingWrapper - Should show modal:', shouldShow);
      
      setShowModal(shouldShow);
    } else {
      // إذا لم يكن المستخدم مسجل الدخول، أخفي النافذة
      setShowModal(false);
    }
    
    setInitialized(true);
  }, [user, authLoading]);
  
  // لا تعرض شيئًا حتى يكتمل التحميل الأولي
  if (authLoading || !initialized) {
    console.log('OnboardingWrapper - Waiting for auth to initialize...');
    return null;
  }

  const handleOnboardingComplete = ({ skipped }) => {
    setShowModal(false);
    // يمكنك إضافة أي إجراء إضافي هنا بعد اكتمال الإعداد
    console.log('Onboarding completed', { skipped });
  };

  if (!showModal) return null;
  
  console.log('OnboardingWrapper - Render:', { 
    showModal, 
    user: { 
      id: user?.id, 
      onboarding_done: user?.onboarding_done 
    } 
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <OnboardingModal onDone={handleOnboardingComplete} />
      </div>
    </div>
  );
}
