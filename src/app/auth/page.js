'use client';

import { useState } from 'react';
import { FaFacebookF, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';
import { useColorMode } from '../nav/theme/ThemeProvider';
import { useRouter } from 'next/navigation';
import './auth.css';

export default function AuthPage() {
  const { mode } = useColorMode();
  const isDark = mode === 'dark';

  // true  ⇒ نموذج إنشاء حساب   |   false ⇒ نموذج تسجيل دخول
  const [isSignIn, setIsSignIn] = useState(true);

  /* ------------------------------ حالات إنشاء حساب ------------------------------ */
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCity, setSignUpCity] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  /* ----------------------------- حالات تسجيل دخول ------------------------------ */
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInSuccess, setSignInSuccess] = useState('');

  const router = useRouter();

  /* ------------------------------ إنشاء حساب جديد ------------------------------ */
  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpLoading(true);
    setSignUpError('');
    setSignUpSuccess('');

    if (!signUpCity) {
      setSignUpError('المدينة مطلوبة');
      setSignUpLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signUpEmail,
          password: signUpPassword,
          name: signUpName,
          city: signUpCity,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 1️⃣ أظهر رسالة النجاح
        setSignUpSuccess('تم التسجيل بنجاح! يمكنك تسجيل الدخول الآن.');

        // 2️⃣ انتقل إلى واجهة تسجيل الدخول (مثل زر SIGN IN اليدوي)
        setIsSignIn(false);

        // 3️⃣ نظِّف الحقول بعد قليل (اختياري)
        setTimeout(() => {
          setSignUpName('');
          setSignUpEmail('');
          setSignUpPassword('');
          setSignUpCity('');
          setSignUpSuccess('');
        }, 1500);
      } else {
        setSignUpError(data.error || 'فشل التسجيل');
      }
    } catch {
      setSignUpError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setSignUpLoading(false);
    }
  };

  /* ------------------------------ تسجيل الدخول ------------------------------ */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError('');
    setSignInSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setSignInSuccess('تم تسجيل الدخول بنجاح! جاري تحديث الصفحة...');
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
          // التحقق من وجود مسار محفوظ للعودة إليه
          const redirectPath = sessionStorage.getItem('redirectAfterLogin');
          if (redirectPath) {
            // حذف المسار المحفوظ بعد استخدامه
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPath;
          } else {
            // إذا لم يكن هناك مسار محفوظ، يتم التوجيه للصفحة الرئيسية
            window.location.href = '/';
          }
        }
      } else {
        setSignInError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      console.error('Login error:', error);
      setSignInError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setSignInLoading(false);
    }
  };

  /* ------------------------------------ JSX ------------------------------------ */
  return (
    <div className={`flex items-center justify-center min-h-screen px-4 ${isDark ? '' : ''}`}>
      <div className="relative w-full max-w-5xl h-[700px] rounded-xl shadow-2xl overflow-hidden bg-white">
        {/* الحاوية الرئيسة للنموذجين */}
        <div className="flex h-full">
          {/* --------- نموذج إنشاء حساب --------- */}
          <div
            className={`w-1/2 h-full flex justify-center items-center p-10 transition-transform duration-1000 ${
              isSignIn ? 'rotate-y-0' : 'rotate-y-180'
            }`}
          >
            <div className="w-full max-w-md">
              <h2 className="text-4xl font-extrabold mb-8 text-left text-black">Create Account</h2>
              <form className="flex flex-col gap-6" onSubmit={handleSignUp}>
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="text"
                  placeholder="Username"
                  dir="ltr"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                />
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="email"
                  placeholder="Email"
                  dir="ltr"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="password"
                  placeholder="Password"
                  dir="ltr"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="text"
                  placeholder="المدينة"
                  required
                  value={signUpCity}
                  onChange={(e) => setSignUpCity(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-full font-bold text-lg w-full transition-colors"
                  disabled={signUpLoading}
                >
                  {signUpLoading ? 'جاري التسجيل...' : 'SIGN UP'}
                </button>
                {signUpError && <div className="text-red-600 font-bold text-center mt-2">{signUpError}</div>}
                {signUpSuccess && <div className="text-green-600 font-bold text-center mt-2">{signUpSuccess}</div>}
              </form>
            </div>
          </div>

          {/* --------- نموذج تسجيل دخول --------- */}
          <div
            className={`w-1/2 h-full flex justify-center items-center p-10 transition-transform duration-1000 ${
              !isSignIn ? 'rotate-y-0' : 'rotate-y-180'
            }`}
          >
            <div className="w-full max-w-md">
              <h2 className="text-4xl font-extrabold mb-8 text-left text-black">Sign In</h2>
              <form className="flex flex-col gap-6" onSubmit={handleSignIn}>
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="email"
                  placeholder="Email"
                  dir="ltr"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                />
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="password"
                  placeholder="Password"
                  dir="ltr"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-full font-bold text-lg w-full transition-colors"
                  disabled={signInLoading}
                >
                  {signInLoading ? 'جاري الدخول...' : 'SIGN IN'}
                </button>

                {/* روابط تواصل اجتماعي تجريبية */}
               
                {signInError && <div className="text-red-600 font-bold text-center mt-2">{signInError}</div>}
                {signInSuccess && <div className="text-green-600 font-bold text-center mt-2">{signInSuccess}</div>}
              </form>
            </div>
          </div>
        </div>

        {/* الشريط المتحرّك بين النموذجين */}
        <div
          className={`absolute top-0 h-full w-1/2 bg-gray-900 text-white transition-all duration-700 ease-in-out ${isSignIn ? 'left-0' : 'left-1/2'}`}
        >
          <div className="h-full flex items-center justify-center p-10">
            <div className="text-center max-w-xs">
              <img src="/1111.png" alt="Logo" className="mx-auto mb-6 w-32 h-32 object-contain" />
              <h2 className="text-4xl font-extrabold mb-6">{!isSignIn ? 'Welcome Back!' : 'Hello, Friend!'}</h2>
              <p className="text-lg mb-10 text-gray-200">
                {!isSignIn
                  ? 'To keep connected with us please login with your personal info'
                  : 'Enter your personal details and start journey with us'}
              </p>
              <button
                onClick={() => setIsSignIn(!isSignIn)}
                className="border-2 border-yellow-500 bg-transparent text-yellow-500 hover:bg-yellow-500 hover:text-white py-3 px-8 rounded-full font-bold transition-colors text-lg"
              >
                {isSignIn ? 'SIGN IN' : 'SIGN UP'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
