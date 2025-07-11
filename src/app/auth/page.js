'use client';

import { useState, useEffect } from 'react';
import { FaFacebookF, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';
import { useColorMode } from '../nav/theme/ThemeProvider';
import './auth.css';

export default function AuthPage() {
  const { mode } = useColorMode();
  const isDark = mode === 'dark';
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className={`flex items-center justify-center min-h-screen px-4 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <div className={`relative w-full max-w-5xl h-[700px] rounded-xl shadow-2xl overflow-hidden ${isDark ? 'bg-white' : 'bg-white'}`}>
        {/* Forms Container - Always visible both forms */}
        <div className="flex h-full">
          {/* Sign Up Form - On left side */}
          <div className={`w-1/2 h-full flex justify-center items-center p-10 transition-transform duration-1000 ${isSignIn ? 'rotate-y-0' : 'rotate-y-180'}`}>
            <div className="w-full max-w-md">
              <h2 className={`text-4xl font-extrabold mb-8 text-left ${isDark ? 'text-black' : 'text-black'}`}>Create Account</h2>
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="text"
                  placeholder="Username"
                  dir="ltr"
                  required
                />
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="email"
                  placeholder="Email"
                  dir="ltr"
                  required
                />
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="password"
                  placeholder="Password"
                  dir="ltr"
                  required
                />
                <select 
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  required
                >
                  <option value="">Select Location</option>
                  <optgroup label="Palestinian Governorates">
                    <option value="jenin">Jenin</option>
                    <option value="tubas">Tubas</option>
                    <option value="tulkarm">Tulkarm</option>
                    <option value="nablus">Nablus</option>
                    <option value="qalqilya">Qalqilya</option>
                    <option value="salfit">Salfit</option>
                    <option value="ramallah">Ramallah</option>
                    <option value="jericho">Jericho</option>
                    <option value="jerusalem">Jerusalem</option>
                    <option value="bethlehem">Bethlehem</option>
                    <option value="hebron">Hebron</option>
                    <option value="north gaza">North Gaza</option>
                    <option value="gaza">Gaza</option>
                    <option value="deir al-balah">Deir Al-Balah</option>
                    <option value="khan younis">Khan Younis</option>
                    <option value="rafah">Rafah</option>
                  </optgroup>
                </select>
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-full font-bold text-lg w-full transition-colors"
                >
                  SIGN UP
                </button>
              </form>
            </div>
          </div>

          {/* Sign In Form - On right side */}
          <div className={`w-1/2 h-full flex justify-center items-center p-10 transition-transform duration-1000 ${!isSignIn ? 'rotate-y-0' : 'rotate-y-180'}`}>
            <div className="w-full max-w-md">
              <h2 className={`text-4xl font-extrabold mb-8 text-left ${isDark ? 'text-black' : 'text-black'}`}>Sign In</h2>
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="text"
                  placeholder="Username"
                  dir="rtl"
                  required
                />
                <input
                  className={`${isDark ? 'bg-black text-white border border-gray-700' : 'bg-gray-200 text-black'} px-6 py-4 rounded-md outline-none text-lg text-left w-full`}
                  type="password"
                  placeholder="Password"
                  dir="rtl"
                  required
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-full font-bold text-lg w-full transition-colors"
                >
                  SIGN IN
                </button>
                <div className="flex justify-center gap-4 mt-4">
                  <a href="#" className="text-blue-600 text-2xl hover:scale-110 transition">
                    <FaFacebookF />
                  </a>
                  <a href="#" className="text-green-500 text-2xl hover:scale-110 transition">
                    <FaWhatsapp />
                  </a>
                  <a href="#" className="text-blue-800 text-2xl hover:scale-110 transition">
                    <FaLinkedinIn />
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Moving Overlay - Slides between forms */}
        <div className={`absolute top-0 h-full w-1/2 ${isDark ? 'bg-black text-white' : 'bg-black text-white'} transition-all duration-700 ease-in-out ${isSignIn ? 'left-0' : 'left-1/2'}`}>
          <div className="h-full flex items-center justify-center p-10">
            <div className="text-center max-w-xs">
              <img
                src="/1111.png"
                alt="Logo"
                className="mx-auto mb-6 w-32 h-32 object-contain"
              />
              <h2 className="text-4xl font-extrabold mb-6">
                {!isSignIn ? 'Welcome Back!' : 'Hello, Friend!'}
              </h2>
              <p className={`text-lg mb-10 ${isDark ? 'text-gray-200' : 'text-gray-200'}`}>
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