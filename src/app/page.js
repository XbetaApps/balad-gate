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
    { title: 'المتاجر', icon: FaStore, path: '/services/page_2#stores' },
    { title: 'عقارات', icon: FaHome, path: '/services/page_2#real-estate' },
    { title: 'أراضي', icon: FaBuilding, path: '/services/page_2#lands' },
    { title: 'سيارات', icon: FaCar, path: '/services/page_2#cars' },
    { title: 'مطاعم', icon: FaUtensils, path: '/services/page_2#restaurants' },
    { title: 'فرص عمل', icon: FaBriefcase, path: '/services/page_2#jobs' },
    { title: 'دورات دراسية', icon: FaGraduationCap, path: '/services/page_2#courses' },
    { title: 'مستشفيات', icon: FaHospital, path: '/services/page_2#hospitals' },
    { title: 'عيادات طبية', icon: FaClinicMedical, path: '/services/page_2#clinics' },
    { title: 'أماكن ترفيهية', icon: FaTheaterMasks, path: '/services/page_2#entertainment' },
    { title: 'فنادق', icon: FaHotel, path: '/services/page_2#hotels' },
    { title: 'صيدليات', icon: FaPills, path: '/services/page_2#pharmacies' },
    { title: 'محطات وقود', icon: FaGasPump, path: '/services/page_2#gas-stations' },
    { title: 'مراكز تجارية', icon: FaShoppingBag, path: '/services/page_2#malls' },
    { title: 'صالات أفراح', icon: FaGlassCheers, path: '/services/page_2#wedding-halls' },
    { title: 'خدمات توصيل', icon: FaTruck, path: '/services/page_2#delivery' },
    { title: 'مجوهرات وذهب', icon: FaRing, path: '/services/page_2#jewelry' },
    { title: 'أجهزة منزلية', icon: FaTools, path: '/services/page_2#appliances' },
    { title: 'ملابس وأزياء', icon: FaTshirt, path: '/services/page_2#fashion' },
    { title: 'صيانة سيارات', icon: FaWrench, path: '/services/page_2#car-maintenance' },
    { title: 'هدايا وتحف', icon: FaGift, path: '/services/page_2#gifts' },
    { title: 'مراكز تجميل', icon: FaCut, path: '/services/page_2#beauty-centers' },
    { title: 'صالات رياضية', icon: FaDumbbell, path: '/services/page_2#gyms' },
    { title: 'مكتبات وكتب', icon: FaBook, path: '/services/page_2#libraries' },
    { title: 'من نحن', icon: FaInfoCircle, path: '/contact' },
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