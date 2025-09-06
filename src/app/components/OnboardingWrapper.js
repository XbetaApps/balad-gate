'use client';

import { useEffect, useState, useRef } from 'react';
import OnboardingModal from './OnboardingModal';
import { useAuth } from '../auth/AuthProvider';

export default function OnboardingWrapper() {
  const { user, loading: authLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const overlayRef = useRef(null);

  // Only run this effect when auth state changes
  useEffect(() => {
    // Don't do anything until auth is loaded
    if (authLoading) return;
    
    console.log('OnboardingWrapper - Auth state:', { 
      hasUser: !!user,
      userId: user?.id,
      onboardingDone: user?.onboarding_done
    });
    
    // Helper to read JWT from localStorage
    const readToken = () => {
      try { return localStorage.getItem('token'); } catch { return null; }
    };

    // Show modal only if user needs onboarding AND JWT token exists (API requires it)
    if (user && user.onboarding_done !== true && readToken()) {
      console.log('OnboardingWrapper - Showing modal for user:', { 
        userId: user.id,
        onboarding_done: user.onboarding_done 
      });
      setShowModal(true);
    } else {
      console.log('OnboardingWrapper - Not showing modal', { 
        hasUser: !!user,
        onboardingDone: user?.onboarding_done 
      });
      setShowModal(false);
    }
    
    setInitialized(true);
  }, [user, authLoading]);
  
  // Don't render anything until we've checked the auth state
  if (authLoading || !initialized || !showModal) {
    return null;
  }

  const handleOnboardingComplete = ({ skipped, alreadyCompleted }) => {
    console.log('Onboarding completed', { skipped, alreadyCompleted });
    setShowModal(false);
  };
  
  console.log('OnboardingWrapper - Render:', { 
    showModal, 
    user: { 
      id: user?.id, 
      onboarding_done: user?.onboarding_done 
    } 
  });

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        animation: 'fadeIn 0.2s ease-in-out',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <style jsx global>{"\n        @keyframes fadeIn {\n          from { opacity: 0; }\n          to { opacity: 1; }\n        }\n      "}</style>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <OnboardingModal onDone={handleOnboardingComplete} />
      </div>
    </div>
  );
}
