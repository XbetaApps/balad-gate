'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from './nav/theme/ThemeProvider';
import {
  FaNewspaper, FaCloudSun, FaRoad, FaDollarSign, FaStore, FaHome,
  FaCar, FaUtensils, FaBriefcase, FaGraduationCap, FaHospital,
  FaClinicMedical, FaTheaterMasks, FaGlassCheers, FaWrench, FaHotel,
  FaPills, FaGasPump, FaShoppingBag, FaTruck, FaRing, FaTools, FaGift,
  FaCut, FaDumbbell, FaFutbol, FaBook, FaUtensilSpoon, FaMobile, FaPlane,
  FaTshirt, FaLaptop, FaBaby, FaBicycle, FaBuilding, FaCamera, FaCoffee,
  FaGamepad, FaHeadphones, FaHeart, FaInfoCircle, FaMusic, FaPaw, FaPlaneDeparture,
  FaShoppingCart, FaSignInAlt, FaUmbrellaBeach, FaWineGlassAlt
} from 'react-icons/fa';

export default function HomePage() {
  const { darkMode } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const allCards = [
    { title: 'تسجيل دخول', icon: FaSignInAlt, path: '/auth' },

    { title: 'الطقس', icon: FaCloudSun, path: '/weather' },
    { title: 'عملات', icon: FaDollarSign, path: '/money' },
    { title: 'الأخبار', icon: FaNewspaper, path: '/news' },
    { title: 'الطرق', icon: FaRoad, path: '/car' },
    { title: 'المتاجر', icon: FaStore, path: '#' },
    { title: 'عقارات', icon: FaHome },
    { title: 'أراضي', icon: FaBuilding },
    { title: 'سيارات', icon: FaCar },
    { title: 'مطاعم', icon: FaUtensils },
    { title: 'فرص عمل', icon: FaBriefcase },
    { title: 'دورات دراسية', icon: FaGraduationCap },
    { title: 'مستشفيات', icon: FaHospital },
    { title: 'عيادات طبية', icon: FaClinicMedical },
    { title: 'أماكن ترفيهية', icon: FaTheaterMasks },
    { title: 'فنادق', icon: FaHotel },
    { title: 'صيدليات', icon: FaPills },
    { title: 'محطات وقود', icon: FaGasPump },
    { title: 'مراكز تجارية', icon: FaShoppingBag },
    { title: 'صالات أفراح', icon: FaGlassCheers },
    { title: 'خدمات توصيل', icon: FaTruck },
    { title: 'مجوهرات وذهب', icon: FaRing },
    { title: 'أجهزة منزلية', icon: FaTools },
    { title: 'ملابس وأزياء', icon: FaTshirt },
    { title: 'صيانة سيارات', icon: FaWrench },
    { title: 'هدايا وتحف', icon: FaGift },
    { title: 'مراكز تجميل', icon: FaCut },
    { title: 'صالات رياضية', icon: FaDumbbell },
    { title: 'مكتبات وكتب', icon: FaBook },
    { title: 'من نحن', icon: FaInfoCircle, path: '/about' },

  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4">
      <div className="w-full max-w-5xl mx-auto pt-6">
        <div className="mb-8 px-4">
          <div className="relative max-w-4xl mx-auto">
          <input
  type="text"
  dir="rtl"
  placeholder="ابحث عن الخدمات والمحلات..."
  className={`
    w-full p-3 pr-12 rounded-full border outline-none transition-all duration-300
    ${darkMode 
      ? 'bg-[#001a33] text-white border-gray-700 hover:border-amber-500 focus:border-amber-500'
      : 'bg-white text-black border-gray-300 hover:border-amber-400 focus:border-amber-400'}
  `}
/>

            <button className={`
              absolute left-3 top-1/2 transform -translate-y-1/2 
              transition-colors duration-300
              ${darkMode 
                ? 'text-gray-300 hover:text-amber-400' 
                : 'text-gray-400 hover:text-amber-500'}
            `}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-x-15 gap-y-3">
          {allCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Link
                href={card.path || '#'}
                key={index}
                className="group flex flex-col items-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="relative">
                <div className={`
                  w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border
                  transition-all duration-300 group-hover:shadow-lg
                  ${darkMode 
                    ? 'bg-[#001a33] text-white border-gray-600 group-hover:border-amber-500' 
                    : 'bg-white text-black border-amber-300 group-hover:border-amber-500'}
                `}>
                  <IconComponent className="text-2xl md:text-3xl" />
                </div>

                </div>
                <span className={`
                  mt-2 text-xs font-medium text-center transition-colors duration-300 px-1
                  ${darkMode 
                    ? 'text-white group-hover:text-amber-400' 
                    : 'text-black group-hover:text-amber-500'}
                `}>
                  {card.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
