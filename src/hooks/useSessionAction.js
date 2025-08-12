'use client';

import { useState } from 'react';
import { useAuth } from '@/app/auth/AuthProvider';

const useSessionAction = (action, actionName = 'هذا الإجراء') => {
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const executeAction = async (...args) => {
    if (user) {
      return action(...args);
    } else {
      // Return a promise that will be resolved when the user logs in
      return new Promise((resolve, reject) => {
        const handleLoginSuccess = () => {
          // Remove the event listener
          window.removeEventListener('auth:login', handleLoginSuccess);
          // Retry the action after login
          action(...args).then(resolve).catch(reject);
        };

        // Listen for login success event
        window.addEventListener('auth:login', handleLoginSuccess);

        // Show login prompt
        setShowLoginPrompt(true);
      });
    }
  };

  const LoginPrompt = () => (
    showLoginPrompt && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">يجب تسجيل الدخول</h3>
          <p className="mb-6">يجب أن تكون مسجلاً الدخول لـ {actionName}.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                setShowLoginPrompt(false);
                window.location.href = '/auth';
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    )
  );

  return { executeAction, LoginPrompt };
};

export default useSessionAction;
