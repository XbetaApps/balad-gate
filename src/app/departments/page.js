'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  FaCloudSun,
  FaMoneyBillWave,
  FaHandsHelping,
  FaSignInAlt,
  FaInfoCircle,
  FaEnvelope,
  FaCloud,
  FaDollarSign,
  FaTools,
  FaUserCircle,
  FaAddressBook,
  FaNewspaper
} from 'react-icons/fa';

export default function DepartmentsPage() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check for dark mode on mount
    const checkDarkMode = () => {
      return document.documentElement.classList.contains('dark');
    };
    
    setIsDarkMode(checkDarkMode());
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(checkDarkMode());
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return <div className="min-h-screen"></div>;
  }

  const sections = [
    { 
      title: 'الأخبار', 
      icon: <FaNewspaper className="text-4xl" />, 
      link: '/news',
      color: 'from-indigo-400 to-indigo-600'
    },
    { 
      title: 'حالة الطقس', 
      icon: <FaCloudSun className="text-4xl" />, 
      link: '/weather',
      color: 'from-blue-400 to-blue-600'
    },
    { 
      title: 'أسعار العملات', 
      icon: <FaMoneyBillWave className="text-4xl" />, 
      link: '/money',
      color: 'from-green-400 to-green-600'
    },
    { 
      title: 'الخدمات', 
      icon: <FaTools className="text-4xl" />, 
      link: '/services',
      color: 'from-yellow-400 to-yellow-600'
    },
    { 
      title: 'تسجيل الدخول', 
      icon: <FaUserCircle className="text-4xl" />, 
      link: '/auth',
      color: 'from-purple-400 to-purple-600'
    },
    { 
      title: 'من نحن', 
      icon: <FaInfoCircle className="text-4xl" />, 
      link: '/about',
      color: 'from-orange-400 to-orange-600'
    },
    { 
      title: 'تواصل معنا', 
      icon: <FaEnvelope className="text-4xl" />, 
      link: '/contact',
      color: 'from-red-400 to-red-600'
    },
  ];

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-right transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-4xl font-bold mb-12 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          أقسام الموقع
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <Link 
              key={index} 
              href={section.link}
              className="group block h-full"
            >
              <div className={`
                h-full rounded-2xl overflow-hidden 
                ${isDarkMode ? 'bg-gray-900 group-hover:bg-gray-800' : 'bg-gray-50 group-hover:bg-gray-100'}
                shadow-md
                group-hover:shadow-xl 
                group-hover:-translate-y-1
                border-2
                ${isDarkMode ? 'border-gray-600 group-hover:border-amber-500' : 'border-amber-200 group-hover:border-amber-400'}
                border-opacity-50
                group-hover:border-opacity-100
                transition-all duration-300
                relative
                after:absolute after:inset-0 after:rounded-2xl after:pointer-events-none
                after:transition-all after:duration-300
                group-hover:shadow-amber-200/50 dark:group-hover:shadow-amber-500/20
                transform hover:scale-105
                ${isDarkMode ? 
                  'group-hover:after:shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 
                  'group-hover:after:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                }
              `}>
                <div className="p-6 text-center">
                  <div 
                    className={`
                      w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center
                      bg-gradient-to-r ${section.color} text-white
                      shadow-lg group-hover:scale-110 transition-transform duration-300
                    `}
                  >
                    {section.icon}
                  </div>
                  <h2 className={`
                    text-xl font-semibold mb-2
                    ${isDarkMode ? 'text-white' : 'text-gray-800'}
                  `}>
                    {section.title}
                  </h2>
                  <p className={`
                    text-sm opacity-80 transition-colors duration-300
                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    اضغط للدخول
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
