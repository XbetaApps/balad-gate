'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from './nav/theme/ThemeProvider';
import { 
  FaNewspaper, 
  FaCloudSun, 
  FaRoad, 
  FaDollarSign,
  FaStore,
  FaHome,
  FaCar,
  FaUtensils,
  FaBriefcase,
  FaGraduationCap,
  FaHospital,
  FaClinicMedical,
  FaTheaterMasks,
  FaGlassCheers,
  FaWrench,
  FaHotel,
  FaPills,
  FaGasPump,
  FaShoppingBag,
  FaTruck,
  FaRing,
  FaTools,
  FaGift,
  FaCut,
  FaDumbbell,
  FaFutbol,
  FaBook,
  FaUtensilSpoon,
  FaMobile,
  FaPlane,
  FaTshirt,
  FaLaptop,
  FaBaby,
  FaBicycle,
  FaBuilding,
  FaCamera,
  FaCoffee,
  FaGamepad,
  FaHeadphones,
  FaHeart,
  FaMusic,
  FaPaw,
  FaPlaneDeparture,
  FaShoppingCart,
  FaUmbrellaBeach,
  FaWineGlassAlt
} from 'react-icons/fa';

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setTime(new Date()), 60000);
    
    // Check dark mode
    const checkDarkMode = () => {
      return document.documentElement.classList.contains('dark');
    };
    
    setIsDarkMode(checkDarkMode());
    
    return () => clearInterval(timer);
  }, []);

  // Format time to 12-hour format
  const formattedTime = time.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(time);

  // All cards with icons, colors and paths
  const allCards = [
    { 
      title: 'الطقس', 
      icon: <FaCloudSun className="text-2xl" />, 
      color: 'bg-cyan-500',
      path: '/weather'
    },
    { 
      title: 'عملات', 
      icon: <FaDollarSign className="text-2xl" />, 
      color: 'bg-green-500',
      path: '/money'
    },
    { 
      title: 'الأخبار', 
      icon: <FaNewspaper className="text-2xl" />, 
      color: 'bg-blue-500',
      path: '/news'
    },
    { 
      title: 'الطرق', 
      icon: <FaRoad className="text-2xl" />, 
      color: 'bg-amber-500',
      path: '/car'
    },
    { 
      title: 'المتاجر', 
      icon: <FaStore className="text-2xl" />, 
      color: 'bg-blue-600',
      path: '#'
    },
    { title: 'عقارات', icon: <FaHome className="text-2xl" />, color: 'bg-green-600' },
    { title: 'أراضي', icon: <FaBuilding className="text-2xl" />, color: 'bg-yellow-500' },
    { title: 'سيارات', icon: <FaCar className="text-2xl" />, color: 'bg-red-500' },
    { title: 'مطاعم', icon: <FaUtensils className="text-2xl" />, color: 'bg-purple-500' },
    { title: 'فرص عمل', icon: <FaBriefcase className="text-2xl" />, color: 'bg-indigo-500' },
    { title: 'دورات دراسية', icon: <FaGraduationCap className="text-2xl" />, color: 'bg-pink-500' },
    { title: 'مستشفيات', icon: <FaHospital className="text-2xl" />, color: 'bg-red-600' },
    { title: 'عيادات طبية', icon: <FaClinicMedical className="text-2xl" />, color: 'bg-pink-400' },
    { title: 'أماكن ترفيهية', icon: <FaTheaterMasks className="text-2xl" />, color: 'bg-emerald-500' },
    { title: 'فنادق', icon: <FaHotel className="text-2xl" />, color: 'bg-cyan-600' },
    { title: 'صيدليات', icon: <FaPills className="text-2xl" />, color: 'bg-green-500' },
    { title: 'محطات وقود', icon: <FaGasPump className="text-2xl" />, color: 'bg-yellow-600' },
    { title: 'مراكز تجارية', icon: <FaShoppingBag className="text-2xl" />, color: 'bg-amber-400' },
    { title: 'صالات أفراح', icon: <FaGlassCheers className="text-2xl" />, color: 'bg-pink-300' },
    { title: 'خدمات توصيل', icon: <FaTruck className="text-2xl" />, color: 'bg-blue-400' },
    { title: 'مجوهرات وذهب', icon: <FaRing className="text-2xl" />, color: 'bg-yellow-400' },
    { title: 'أجهزة منزلية', icon: <FaTools className="text-2xl" />, color: 'bg-blue-400' },
    { title: 'ملابس وأزياء', icon: <FaTshirt className="text-2xl" />, color: 'bg-pink-400' },
    { title: 'صيانة سيارات', icon: <FaWrench className="text-2xl" />, color: 'bg-red-500' },
    { title: 'هدايا وتحف', icon: <FaGift className="text-2xl" />, color: 'bg-red-400' },
    { title: 'مراكز تجميل', icon: <FaCut className="text-2xl" />, color: 'bg-pink-500' },
    { title: 'صالات رياضية', icon: <FaDumbbell className="text-2xl" />, color: 'bg-blue-500' },
    { title: 'مكتبات وكتب', icon: <FaBook className="text-2xl" />, color: 'bg-amber-600' }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 transition-colors duration-300">
      <div className="w-full max-w-5xl mx-auto pt-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
          {allCards.map((card, index) => (
            <Link 
              href={card.path || '#'} 
              key={index}
              className="group flex flex-col items-center transition-all duration-300 transform hover:scale-105"
            >
              <div className="relative">
                {/* Circular background with gradient effect */}
                <div className={`
                  w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center 
                  transition-all duration-300 group-hover:shadow-lg
                  ${card.color}
                `}>
                  <div className="text-2xl md:text-3xl text-black">
                    {card.icon}
                  </div>
                  
                  {/* Hover ring effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-amber-400 transition-all duration-300 pointer-events-none"></div>
                </div>
                
                {/* Subtle shadow */}
                <div className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              </div>
              
              {/* Label with smooth transition */}
              <span className="mt-2 text-xs font-medium text-center text-gray-700 dark:text-gray-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-300 px-1">
                {card.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
