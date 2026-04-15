'use client';

import { useState, useEffect } from 'react';
import { FaFacebookF, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';
import { useColorMode } from '../nav/theme/ThemeProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import './auth.css';

export default function AuthPage() {
  const { mode } = useColorMode();
  const isDark = mode === 'dark';

  const router = useRouter();
  const searchParams = useSearchParams();

  // true = قسم إنشاء حساب
  // false = قسم تسجيل الدخول
  const [isSignIn, setIsSignIn] = useState(true);

  useEffect(() => {
    if (searchParams.get('mode') === 'signin') {
      setIsSignIn(false);
    }
  }, [searchParams]);

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
        setSignUpSuccess(`تم إرسال رابط تأكيد إلى بريدك الإلكتروني.
الرجاء فتح الإيميل وتأكيد الحساب ثم تسجيل الدخول.`);

        // افتح قسم تسجيل الدخول مباشرة
        setIsSignIn(false);

        setSignUpName('');
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpCity('');
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
        setSignInSuccess('تم تسجيل الدخول بنجاح! جاري تحويلك...');

        localStorage.setItem('token', data.token);

        const redirectPath = sessionStorage.getItem('redirectAfterLogin');

        setTimeout(() => {
          if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPath;
          } else {
            window.location.href = '/';
          }
        }, 1000);
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

  return (
    <div className={`flex items-center justify-center min-h-screen px-4 ${isDark ? '' : ''}`}>
      <div className="relative w-full max-w-5xl h-[700px] rounded-xl shadow-2xl overflow-hidden bg-white">
        <div className="flex h-full">
          {/* قسم إنشاء حساب */}
          <div
            className={`w-1/2 h-full flex justify-center items-center p-10 transition-transform duration-1000 ${
              isSignIn ? 'rotate-y-0' : 'rotate-y-180'
            }`}
          >
            <div className="w-full max-w-md">
              <h2 className="text-4xl font-extrabold mb-8 text-left text-black">
                Create Account
              </h2>

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

                {signUpError && (
                  <div className="text-red-600 font-bold text-center mt-2">
                    {signUpError}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* قسم تسجيل الدخول */}
          <div
            className={`w-1/2 h-full flex justify-center items-center p-10 transition-transform duration-1000 ${
              !isSignIn ? 'rotate-y-0' : 'rotate-y-180'
            }`}
          >
            <div className="w-full max-w-md">
              <h2 className="text-4xl font-extrabold mb-8 text-left text-black">
                Sign In
              </h2>

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

                {signInError && (
                  <div className="text-red-600 font-bold text-center mt-2">
                    {signInError}
                  </div>
                )}

                {signInSuccess && (
                  <div className="text-green-600 font-bold text-center mt-2">
                    {signInSuccess}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* اللوحة الجانبية */}
        <div
          className={`absolute top-0 h-full w-1/2 bg-gray-900 text-white transition-all duration-700 ease-in-out ${
            isSignIn ? 'left-0' : 'left-1/2'
          }`}
        >
          <div className="h-full flex items-center justify-center p-10">
            <div className="text-center max-w-xs">
              <img
                src="/Logo.png"
                alt="Logo"
                className="mx-auto mb-6 w-32 h-32 object-contain"
              />

              <h2 className="text-4xl font-extrabold mb-6">
                {!isSignIn ? 'Welcome Back!' : 'Hello, Friend!'}
              </h2>

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

        {/* Popup نجاح التسجيل */}
        {signUpSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-[90%] text-center relative">
              <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                Verify your email
              </h3>

              <p className="text-gray-600 leading-8 text-lg mb-6 whitespace-pre-line">
                {signUpSuccess}
              </p>

              <button
                onClick={() => setSignUpSuccess('')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-bold transition-colors"
              >
                حسناً
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
