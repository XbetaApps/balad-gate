'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Logout Page Component
 * Handles the logout process by:
 * 1. Clearing client-side storage
 * 2. Calling the logout API
 * 3. Redirecting to the home page or a specified redirect URL
 */
export default function LogoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    async function handleLogout() {
      try {
        // 1. Clear client-side storage
        if (typeof window !== 'undefined') {
          // Clear all auth-related items from localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('session');
          
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Clear any service worker caches
          if ('caches' in window) {
            caches.keys().then(cacheNames => {
              cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
              });
            });
          }
        }

        // 2. Call the logout API
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          },
          credentials: 'include',
          cache: 'no-store'
        });

        // 3. Force a hard redirect to ensure all caches are bypassed
        if (response.ok) {
          // Add a timestamp to prevent caching
          const timestamp = new Date().getTime();
          const redirectWithTimestamp = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}_=${timestamp}`;
          
          // Force a hard redirect to ensure all caches are bypassed
          window.location.href = redirectWithTimestamp;
        } else {
          console.error('Logout failed:', await response.text());
          window.location.href = redirectUrl;
        }
      } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = redirectUrl;
      }
    }

    handleLogout();
  }, [router, redirectUrl]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">جاري تسجيل الخروج...</h1>
          <p className="text-gray-600 dark:text-gray-300">يرجى الانتظار بينما نقوم بتسجيل خروجك من الحساب.</p>
        </div>
      </div>
    </div>
  );
}
