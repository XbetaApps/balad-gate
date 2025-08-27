'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

// Function to format date in Arabic
const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory' // استخدام التقويم الميلادي
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

// Function to decode JWT token
const parseJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
};

export default function TestDataPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, loading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data when auth state changes
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);
        
        // Debug: Show token information
        if (token) {
          const decodedToken = parseJwt(token);
          console.log('Decoded token:', decodedToken);
          
          // Check if token is expired
          const isExpired = decodedToken.exp * 1000 < Date.now();
          console.log('Is token expired?', isExpired);
          
          if (isExpired) {
            console.log('Token is expired, removing from storage');
            localStorage.removeItem('token');
            setError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
            return;
          }
        } else {
          console.log('No token found in localStorage');
          setError('لم يتم العثور على رمز الجلسة');
          return;
        }
        
        // Temporarily disable auto-redirect for debugging
        if (!authUser) {
          console.log('No authenticated user, but continuing for debugging');
          // router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
          // return;
        }

        if (!token) {
          throw new Error('لم يتم العثور على رمز الجلسة في التخزين المحلي');
        }

        console.log('Fetching user data...');
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API Response status:', response.status);
        
        if (response.status === 401) {
          console.log('Unauthorized - removing token and redirecting');
          localStorage.removeItem('token');
          router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error response:', errorText);
          let errorMessage = 'فشل في جلب البيانات';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('User data received:', data);
        setUserData(data);
      } catch (err) {
        console.error('Error in checkAuthAndFetchData:', err);
        setError(err.message || 'حدث خطأ في جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [authUser, loading, pathname, router]);

  // Show loading state
  if (loading || isLoading) return <div>جاري التحميل...</div>;

  // Debug information
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const decodedToken = token ? parseJwt(token) : null;
  const isTokenExpired = decodedToken ? decodedToken.exp * 1000 < Date.now() : true;

  // Debug info section
  const debugInfo = (
    <div style={{
      margin: '20px 0',
      padding: '15px',
      backgroundColor: '#f0f0f0',
      borderRadius: '5px',
      border: '1px solid #ddd'
    }}>
      <h3>معلومات التصحيح:</h3>
      <div style={{ marginTop: '10px' }}>
        <p><strong>حالة المصادقة:</strong> {authUser ? '✅ مسجل الدخول' : '❌ غير مسجل'}</p>
        <p><strong>وجود الرمز:</strong> {token ? '✅ موجود' : '❌ غير موجود'}</p>
        {token && (
          <p><strong>صلاحية الرمز:</strong> {isTokenExpired ? '❌ منتهي' : '✅ صالح'}</p>
        )}
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <p><strong>الخطأ:</strong> {error}</p>
          </div>
        )}
      </div>
    </div>
  );

  // If there's an error
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>خطأ</h1>
        {debugInfo}
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // If not authenticated, show nothing (will be redirected)
  if (!authUser) return null;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>بيانات المستخدم</h1>
      {debugInfo}
      
      {userData ? (
        <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <h2>المعلومات الشخصية:</h2>
          <pre style={{ 
            backgroundColor: '#fff', 
            padding: '15px', 
            borderRadius: '5px',
            overflowX: 'auto',
            direction: 'ltr',
            textAlign: 'left'
          }}>
            {JSON.stringify(userData, null, 2)}
          </pre>
          
          <div style={{ marginTop: '20px' }}>
            <h3>تفاصيل الحساب:</h3>
            <p><strong>الاسم:</strong> {userData.name || 'غير محدد'}</p>
            <p><strong>البريد الإلكتروني:</strong> {userData.email}</p>
            {userData.phone && <p><strong>رقم الهاتف:</strong> {userData.phone}</p>}
            {userData.city && <p><strong>المدينة:</strong> {userData.city}</p>}
            {userData.serial_id && <p><strong>رقم العضوية:</strong> {userData.serial_id}</p>}
            {userData.created_at && (
              <p>
                <strong>تاريخ التسجيل:</strong>{' '}
                {formatDate(userData.created_at)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p>لا توجد بيانات متاحة</p>
      )}
    </div>
  );
}
