'use client';

import { useEffect, useState } from 'react';

export default function TestSession() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        // جلب التوكن من localStorage
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/test-session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          cache: 'no-store'
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'فشل في جلب بيانات الجلسة');
        }

        setSessionData(data);
        setError('');
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err.message || 'حدث خطأ في جلب بيانات الجلسة');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>جاري تحميل بيانات الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">اختبار جلسة المستخدم</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong>خطأ:</strong> {error}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">حالة المصادقة:</h2>
          <div className={`p-3 rounded-md mb-6 ${
            sessionData?.authenticated 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-yellow-100 border border-yellow-400 text-yellow-700'
          }`}>
            {sessionData?.authenticated ? '✅ تم تسجيل الدخول بنجاح' : '❌ غير مسجل الدخول'}
          </div>
          
          <h2 className="text-xl font-semibold mb-4">بيانات الجلسة:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-semibold mb-2">كيفية الاستخدام:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>هذه الصفحة تقوم بجلب بيانات الجلسة من <code>/api/test-session</code></li>
              <li>يتم إرسال التوكن تلقائياً من <code>localStorage</code> إذا كان موجوداً</li>
              <li>يمكنك فتح وحدة تحكم المتصفح (F12) لمشاهدة الطلبات والاستجابات</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
