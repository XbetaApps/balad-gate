'use client';

import { useState, useEffect } from 'react';

export default function TestDBConnection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/test-connection');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'حدث خطأ في الاتصال بالخادم');
        }
        
        setData(result);
      } catch (err) {
        setError(err.message || 'حدث خطأ غير متوقع');
        console.error('Error testing DB connection:', err);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">اختبار اتصال قاعدة البيانات</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري اختبار الاتصال بقاعدة البيانات...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm text-green-700">
                  {data?.message || 'تم الاتصال بنجاح'}
                </p>
                {data?.data && (
                  <div className="mt-2">
                    <p className="font-medium">بيانات العينة من قاعدة البيانات:</p>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(data.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">تفاصيل الاتصال:</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">حالة الاتصال:</p>
                <p className="mt-1 text-sm text-gray-900">
                  {loading ? 'جاري الاختبار...' : error ? 'فشل الاتصال' : 'متصل بنجاح'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">عدد السجلات المسترجعة:</p>
                <p className="mt-1 text-sm text-gray-900">
                  {data?.data?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
