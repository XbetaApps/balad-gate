'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  FaStore,
  FaHome,
  FaMapMarkedAlt,
  FaCar,
  FaUtensils,
  FaBriefcase,
  FaGraduationCap,
  FaHospital,
  FaClinicMedical,
  FaTheaterMasks,
  FaGlassCheers,
  FaHotel,
  FaPills,
  FaGasPump,
  FaShoppingBag,
  FaGift,
  FaTruck,
  FaRing,
  FaTshirt,
  FaTools,
  FaSearch,
  FaBook,
  FaDumbbell,
  FaFutbol,
  FaCut
} from 'react-icons/fa';

export default function DepartmentsPage() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const services = [
    { 
      title: 'متاجر', 
      icon: <FaStore className="text-4xl" />, 
      link: '/services/stores',
      color: 'from-blue-400 to-blue-600'
    },
    { 
      title: 'عقارات', 
      icon: <FaHome className="text-4xl" />, 
      link: '/services/real-estate',
      color: 'from-green-400 to-green-600'
    },
    { 
      title: 'أراضي', 
      icon: <FaMapMarkedAlt className="text-4xl" />, 
      link: '/services/lands',
      color: 'from-yellow-400 to-yellow-600'
    },
    { 
      title: 'سيارات', 
      icon: <FaCar className="text-4xl" />, 
      link: '/services/cars',
      color: 'from-red-400 to-red-600'
    },
    { 
      title: 'مطاعم', 
      icon: <FaUtensils className="text-4xl" />, 
      link: '/services/restaurants',
      color: 'from-purple-400 to-purple-600'
    },
    { 
      title: 'فرص عمل', 
      icon: <FaBriefcase className="text-4xl" />, 
      link: '/services/jobs',
      color: 'from-indigo-400 to-indigo-600'
    },
    { 
      title: 'دورات دراسية', 
      icon: <FaGraduationCap className="text-4xl" />, 
      link: '/services/courses',
      color: 'from-pink-400 to-pink-600'
    },
    { 
      title: 'مستشفيات', 
      icon: <FaHospital className="text-4xl" />, 
      link: '/services/hospitals',
      color: 'from-red-400 to-red-600'
    },
    { 
      title: 'عيادات طبية', 
      icon: <FaClinicMedical className="text-4xl" />, 
      link: '/services/clinics',
      color: 'from-teal-400 to-teal-600'
    },
    { 
      title: 'أماكن ترفيهية', 
      icon: <FaTheaterMasks className="text-4xl" />, 
      link: '/services/entertainment',
      color: 'from-amber-400 to-amber-600'
    },
    { 
      title: 'فنادق وشقق فندقية', 
      icon: <FaHotel className="text-4xl" />, 
      link: '/services/hotels',
      color: 'from-rose-400 to-rose-600',
      emoji: '🏨'
    },
    { 
      title: 'صيدليات (24 ساعة)', 
      icon: <FaPills className="text-4xl" />, 
      link: '/services/pharmacies',
      color: 'from-emerald-400 to-emerald-600',
      emoji: '💊'
    },
    { 
      title: 'محطات وقود', 
      icon: <FaGasPump className="text-4xl" />, 
      link: '/services/gas-stations',
      color: 'from-orange-400 to-orange-600',
      emoji: '⛽'
    },
    { 
      title: 'مراكز تجارية', 
      icon: <FaShoppingBag className="text-4xl" />, 
      link: '/services/malls',
      color: 'from-sky-400 to-sky-600',
      emoji: '🛍️'
    },
    { 
      title: 'صالات أفراح', 
      icon: <FaGift className="text-4xl" />, 
      link: '/services/wedding-halls',
      color: 'from-fuchsia-400 to-fuchsia-600',
      emoji: '🎉'
    },
    { 
      title: 'خدمات التوصيل', 
      icon: <FaTruck className="text-4xl" />, 
      link: '/services/delivery',
      color: 'from-amber-400 to-amber-600',
      emoji: '🚚'
    },
    { 
      title: 'مجوهرات وذهب', 
      icon: <FaRing className="text-4xl" />, 
      link: '/services/jewelry',
      color: 'from-yellow-400 to-yellow-600',
      emoji: '💍'
    },
    { 
      title: 'أجهزة منزلية', 
      icon: <FaHome className="text-4xl" />, 
      link: '/services/home-appliances',
      color: 'from-blue-400 to-blue-600',
      emoji: '🏠'
    },
    { 
      title: 'ملابس وأزياء', 
      icon: <FaTshirt className="text-4xl" />, 
      link: '/services/fashion',
      color: 'from-pink-400 to-pink-600',
      emoji: '👕'
    },
    { 
      title: 'صيانة سيارات', 
      icon: <FaTools className="text-4xl" />, 
      link: '/services/car-maintenance',
      color: 'from-gray-400 to-gray-600',
      emoji: '🔧'
    },
    { 
      title: 'هدايا وتحف', 
      icon: <FaGift className="text-4xl" />, 
      link: '/services/gifts',
      color: 'from-pink-400 to-pink-600',
      emoji: '🎁'
    },
    { 
      title: 'مراكز تجميل', 
      icon: <FaCut className="text-4xl" />, 
      link: '/services/beauty-centers',
      color: 'from-purple-400 to-purple-600',
      emoji: '💇‍♀️'
    },
    { 
      title: 'صالات رياضية', 
      icon: <FaDumbbell className="text-4xl" />, 
      link: '/services/gyms',
      color: 'from-red-400 to-red-600',
      emoji: '🏋️'
    },
    { 
      title: 'مكتبات وكتب', 
      icon: <FaBook className="text-4xl" />, 
      link: '/services/libraries',
      color: 'from-amber-400 to-amber-600',
      emoji: '📚'
    }
  ];

  // Filter services based on search query
  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-right transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-4xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          خدماتنا
        </h1>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن خدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-12 pl-4 py-3 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-500'
              }`}
            />
            <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
          {searchQuery && (
            <p className={`mt-2 text-sm text-right ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {filteredServices.length} نتيجة للبحث عن: {searchQuery}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length > 0 ? (
            filteredServices.map((service, index) => (
            <Link 
              key={index} 
              href={service.link}
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
                      bg-gradient-to-r ${service.color} text-white
                      shadow-lg group-hover:scale-110 transition-transform duration-300
                    `}
                  >
                    {service.icon}
                  </div>
                  <h2 className={`
                    text-xl font-semibold mb-2
                    ${isDarkMode ? 'text-white' : 'text-gray-800'}
                  `}>
                    {service.title} {service.emoji || ''}
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
          ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                لم يتم العثور على خدمات تطابق بحثك
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className={`mt-4 px-6 py-2 rounded-full ${
                  isDarkMode 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                } transition-colors duration-200`}
              >
                عرض كل الخدمات
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
