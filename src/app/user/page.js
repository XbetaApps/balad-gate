/*'use client';

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
      icon: <FaStore className="text-4xl text-black" />, 
      link: '/services/page_2#stores',
      color: 'from-blue-400 to-blue-600'
    },
    { 
      title: 'عقارات', 
      icon: <FaHome className="text-4xl text-black" />, 
      link: '/services/page_2#real-estate',
      color: 'from-green-400 to-green-600'
    },
    { 
      title: 'أراضي', 
      icon: <FaMapMarkedAlt className="text-4xl text-black" />, 
      link: '/services/page_2#lands',
      color: 'from-yellow-400 to-yellow-600'
    },
    { 
      title: 'سيارات', 
      icon: <FaCar className="text-4xl text-black" />, 
      link: '/services/page_2#cars',
      color: 'from-red-400 to-red-600'
    },
    { 
      title: 'مطاعم', 
      icon: <FaUtensils className="text-4xl text-black" />, 
      link: '/services/page_2#restaurants',
      color: 'from-purple-400 to-purple-600'
    },
    { 
      title: 'فرص عمل', 
      icon: <FaBriefcase className="text-4xl text-black" />, 
      link: '/services/page_2#jobs',
      color: 'from-indigo-400 to-indigo-600'
    },
    { 
      title: 'دورات دراسية', 
      icon: <FaGraduationCap className="text-4xl text-black" />,
      link: '/services/page_2#education',
      color: 'from-pink-400 to-pink-600'
    },
    {
      title: 'مستشفيات',
      icon: <FaHospital className="text-4xl text-black" />,
      link: '/services/page_2#hospitals',
      color: 'from-red-400 to-red-600'
    },
    {
      title: 'عيادات طبية',
      icon: <FaClinicMedical className="text-4xl text-black" />,
      link: '/services/page_2#clinics',
      color: 'from-teal-400 to-teal-600'
    },
    {
      title: 'أماكن ترفيهية',
      icon: <FaTheaterMasks className="text-4xl text-black" />,
      link: '/services/page_2#entertainment',
      color: 'from-amber-400 to-amber-600'
    },
    {
      title: 'فنادق وشقق فندقية',
      icon: <FaHotel className="text-4xl text-black" />,
      link: '/services/page_2#hotels',
      color: 'from-rose-400 to-rose-600',
      emoji: '🏨'
    },
    {
      title: 'صيدليات',
      icon: <FaPills className="text-4xl text-black" />,
      link: '/services/page_2#pharmacies',
      color: 'from-emerald-400 to-emerald-600',
      emoji: '💊'
    },
    {
      title: 'محطات وقود',
      icon: <FaGasPump className="text-4xl text-black" />,
      link: '/services/page_2#gas-stations',
      color: 'from-orange-400 to-orange-600',
      emoji: '⛽'
    },
    {
      title: 'مراكز تجارية',
      icon: <FaShoppingBag className="text-4xl text-black" />,
      link: '/services/page_2#shopping',
      color: 'from-sky-400 to-sky-600',
      emoji: '🛍️'
    },
    {
      title: 'صالات أفراح',
      icon: <FaGift className="text-4xl text-black" />,
      link: '/services/page_2#wedding-halls',
      color: 'from-fuchsia-400 to-fuchsia-600',
      emoji: '🎉'
    },
    {
      title: 'خدمات التوصيل',
      icon: <FaTruck className="text-4xl text-black" />,
      link: '/services/page_2#delivery',
      color: 'from-amber-400 to-amber-600',
      emoji: '🚚'
    },
    {
      title: 'مجوهرات وذهب',
      icon: <FaRing className="text-4xl text-black" />,
      link: '/services/page_2#jewelry',
      color: 'from-yellow-400 to-yellow-600',
      emoji: '💍'
    },
    {
      title: 'أجهزة منزلية',
      icon: <FaGlassCheers className="text-4xl text-black" />,
      link: '/services/page_2#home-appliances',
      color: 'from-blue-400 to-blue-600',
      emoji: '🏠'
    },
    {
      title: 'ملابس وأزياء',
      icon: <FaTshirt className="text-4xl text-black" />,
      link: '/services/page_2#fashion',
      color: 'from-pink-400 to-pink-600',
      emoji: '👕'
    },
    {
      title: 'صيانة سيارات',
      icon: <FaTools className="text-4xl text-black" />,
      link: '/services/page_2#car-maintenance',
      color: 'from-gray-400 to-gray-600',
      emoji: '🔧'
    },
    {
      title: 'هدايا وتحف' ,
      icon: <FaGift className="text-4xl text-black" />,
      link: '/services/page_2#gifts',
      color: 'from-pink-400 to-pink-600',
      emoji: '🎁'
    },
    {
      title: 'مراكز تجميل',
      icon: <FaCut className="text-4xl text-black" />,
      link: '/services/page_2#beauty-centers',
      color: 'from-purple-400 to-purple-600',
      emoji: '💇‍♀️'
    },
    {
      title: 'صالات رياضية',
      icon: <FaDumbbell className="text-4xl text-black" />,
      link: '/services/page_2#gyms',
      color: 'from-red-400 to-red-600',
      emoji: '🏋️'
    },
    {
      title: 'مكتبات وكتب',
      icon: <FaBook className="text-4xl text-black" />,
      link: '/services/page_2#libraries',
      color: 'from-amber-400 to-amber-600',
      emoji: '📚'
    }
  ];

  // Filter services based on search query
  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={` py-12 px-4 sm:px-6 lg:px-8 text-right transition-colors duration-300 ${
        isDarkMode ? 'bg-black' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <h1
          className={`text-4xl font-bold mb-6 text-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}
        >
          خدماتنا
        </h1>
*/

        {/* Search Bar */}
        /*
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
            <FaSearch
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
          </div>
          {searchQuery && (
            <p
              className={`mt-2 text-sm text-right ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
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
                <div
                  className={`
                    h-full rounded-2xl overflow-hidden 
                    ${isDarkMode
                      ? 'bg-gray-900 group-hover:bg-gray-800'
                      : 'bg-gray-50 group-hover:bg-gray-100'}
                    shadow-md
                    group-hover:shadow-xl 
                    group-hover:-translate-y-1
                    border-2
                    ${isDarkMode
                      ? 'border-gray-600 group-hover:border-amber-500'
                      : 'border-amber-200 group-hover:border-amber-400'}
                    border-opacity-50
                    group-hover:border-opacity-100
                    transition-all duration-300
                    relative
                    after:absolute after:inset-0 after:rounded-2xl after:pointer-events-none
                    after:transition-all after:duration-300
                    group-hover:shadow-amber-200/50 dark:group-hover:shadow-amber-500/20
                    transform hover:scale-105
                    ${isDarkMode
                      ? 'group-hover:after:shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                      : 'group-hover:after:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    }
                  `}
                >
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
                    <h2
                      className={`
                        text-xl font-semibold mb-2
                        ${isDarkMode ? 'text-white' : 'text-gray-800'}
                      `}
                    >
                      {service.title} {service.emoji || ''}
                    </h2>
                    <p
                      className={`
                        text-sm opacity-80 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                      `}
                    >
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
*/


'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  FaStore, FaHome, FaMapMarkedAlt, FaCar, FaUtensils,
  FaBriefcase, FaGraduationCap, FaHospital, FaClinicMedical,
  FaTheaterMasks, FaHotel, FaPills, FaGasPump, FaShoppingBag,
  FaGlassCheers, FaTruck, FaRing, FaTshirt, FaTools, FaBook,
  FaDumbbell, FaCut, FaChevronUp, FaGift, FaPlus, FaFilter, FaBoxes,
  FaChevronDown, FaSlidersH
} from 'react-icons/fa';

// Palestinian governorates list
const palestinianGovernorates = [
  'القدس',
  'رام الله والبيرة',
  'الخليل',
  'نابلس',
  'جنين',
  'أريحا والأغوار',
  'طوباس',
  'طولكرم',
  'قلقيلية',
  'سلفيت',
  'بيت لحم',
  'غزة',
  'شمال غزة',
  'دير البلح',
  'خان يونس',
  'رفح'
];

// Governorate filter component
const GovernorateFilter = ({ selectedGov, onSelectGov }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  


  // Close on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-right mr-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-black hover:bg-gray-900 transition-all duration-300 focus:outline-none shadow-lg hover:shadow-xl active:scale-95 transform hover:-translate-y-0.5 border-2 border-amber-400"
          title="تصفية حسب المحافظة"
          aria-label="تصفية حسب المحافظة"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="relative">
            <FaFilter className="text-white text-xl" />
            {selectedGov && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                ✓
              </span>
            )}
          </div>
        </button>
        {!isOpen && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border-2 border-amber-400 flex items-center justify-center">
            <FaChevronDown className="text-white text-xs" />
          </div>
        )}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed left-4 top-4 w-80 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            overflowY: 'auto',
            top: '1rem',
            bottom: '1rem',
            left: '1rem'
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-2">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
              اختر المحافظة
            </div>
            {palestinianGovernorates.map((gov) => (
              <button
                key={gov}
                onClick={() => {
                  onSelectGov(gov);
                  setIsOpen(false);
                }}
                className={`block w-full text-right px-4 py-3 text-sm transition-colors duration-150 ${
                  selectedGov === gov
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                role="menuitem"
              >
                {gov}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
              <button
                onClick={() => {
                  onSelectGov('');
                  setIsOpen(false);
                }}
                className="block w-full text-right px-4 py-3 text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 font-medium transition-colors duration-150"
                role="menuitem"
              >
                إزالة الفلتر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Services data
const services = [
  {
    id: 'stores',
    title: 'متاجر',
    icon: <FaStore className="text-4xl " />,
    description: 'اكتشف أفضل المتاجر المحلية والعالمية في منطقتك',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400' // <-- هذا هو البوردر الذهبي
  },
  
  {
    id: 'real-estate',
    title: 'عقارات',
    icon: <FaHome className="text-4xl " />,
    description: 'عروض مميزة للشقق والفلل والمباني السكنية والتجارية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'lands',
    title: 'أراضي',
    icon: <FaMapMarkedAlt className="text-4xl " />,
    description: 'أراضي سكنية وتجارية بمساحات وأسعار مناسبة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'cars',
    title: 'سيارات',
    icon: <FaCar className="text-4xl " />,
    description: 'أحدث السيارات الجديدة والمستعملة بأسعار تنافسية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'restaurants',
    title: 'مطاعم',
    icon: <FaUtensils className="text-4xl " />,
    description: 'أشهى المأكولات من أفضل المطاعم في مدينتك',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'jobs',
    title: 'فرص عمل',
    icon: <FaBriefcase className="text-4xl " />,
    description: 'فرص عمل شاغرة في مختلف التخصصات والمجالات',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'education',
    title: 'دورات دراسية',
    icon: <FaGraduationCap className="text-4xl " />,
    description: 'معاهد ومراكز تعليمية ودورات تدريبية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },


  {
    id: 'hospitals',
    title: 'مستشفيات',
    icon: <FaHospital className="text-4xl " />,
    description: 'أفضل المستشفيات والمراكز الطبية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },


  {
    id: 'clinics',
    title: 'عيادات طبية',
    icon: <FaClinicMedical className="text-4xl " />,
    description: 'عيادات متخصصة وأطباء في مختلف التخصصات',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'entertainment',
    title: ' اماكن ترفيهية ',
    icon: <FaTheaterMasks className="text-4xl " />,
    description: 'أماكن ترفيهية وأحداث ثقافية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'hotels',
    title: 'فنادق',
    icon: <FaHotel className="text-4xl " />,
    description: 'فنادق ومنتجعات وشقق فندقية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'pharmacies',
    title: 'صيدليات',
    icon: <FaPills className="text-4xl " />,
    description: 'صيدليات ومراكز بيع الأدوية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'gas-stations',
    title: 'محطات وقود',
    icon: <FaGasPump className="text-4xl" />,
    description: 'أقرب محطات الوقود ومراكز الخدمة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'shopping',
    title: 'مراكز تجارية',
    icon: <FaShoppingBag className="text-4xl" />,
    description: 'مراكز تجارية وأسواق شعبية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'wedding-halls',
    title: 'صالات أفراح',
    icon: <FaGlassCheers className="text-4xl" />,
    description: 'أجواء هادئة ومشروبات منعشة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'delivery',
    title: 'خدمات التوصيل',
    icon: <FaTruck className="text-4xl" />,
    description: 'خدمات النقل والشحن',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'jewelry',
    title: 'مجوهرات وذهب',
    icon: <FaRing className="text-4xl" />,
    description: 'مجوهرات ومصوغات ذهبية وفضية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'home-appliances',
    title: 'أجهزة منزلية',
    icon: <FaBoxes className="text-4xl" />,
    description: 'أحدث صيحات  الأجهزة المنزلية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'fashion',
    title: 'ملابس وأزياء',
    icon: <FaTshirt className="text-4xl" />,
    description: 'أحدث صيحات الموضة والأزياء',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'car-maintenance',
    title: 'صيانة سيارات',  
    icon: <FaTools className="text-4xl" />,
    description: 'خدمات الصيانة والإصلاح',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'gifts',
    title: 'هدايا وتحف',
    icon: <FaGift className="text-4xl" />,
    description: 'هدايا وتحف مميزة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'beauty-centers',
    title: 'مراكز تجميل',
    icon: <FaCut className="text-4xl" />,
    description: 'مراكز تجميل وعناية شخصية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'gyms',
    title: 'صالات رياضية',
    icon: <FaDumbbell className="text-4xl" />,
    description: 'النادي الرياضي',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'libraries',
    title: 'مكتبات',
    icon: <FaBook className="text-4xl" />,
    description: 'أشهر المكتبات وأحدث الإصدارات',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  }
];

// Function to get appropriate button text for each service
const getAddButtonText = (serviceId) => {
  const buttonTexts = {
    stores: 'إضافة متجر',
    'real-estate': 'إضافة عقار',
    lands: 'إضافة أرض',
    cars: 'إضافة سيارة',
    restaurants: 'إضافة مطعم',
    jobs: 'إضافة وظيفة',
    courses: 'إضافة دورة',
    hospitals: 'إضافة مستشفى',
    clinics: 'إضافة عيادة',
    entertainment: 'إضافة مكان ترفيهي',
    hotels: 'إضافة فندق',
    pharmacies: 'إضافة صيدلية',
    'gas-stations': 'إضافة محطة وقود',
    malls: 'إضافة مركز تجاري',
    'wedding-halls': 'إضافة صالة أفراح',
    delivery: 'إضافة خدمة توصيل',
    jewelry: 'إضافة معرض مجوهرات',
    'home-appliances': 'إضافة معرض أجهزة',
    fashion: 'إضافة متجر أزياء',
    'car-maintenance': 'إضافة ورشة صيانة',
    gifts: 'إضافة متجر هدايا',
    'beauty-centers': 'إضافة مركز تجميل',
    gyms: 'إضافة نادٍ رياضي',
    libraries: 'إضافة مكتبة'
  };
  return buttonTexts[serviceId] || 'إضافة';
};

export default function ServicesPage() {
  const [activeSection, setActiveSection] = useState('');
  const [showScroll, setShowScroll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentService, setCurrentService] = useState('');
  const [filters, setFilters] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    image: null,
    governorate: ''
  });

  const sectionRefs = useRef({});
  const fileInputRef = useRef(null);

  // Function to get field labels based on service type
  const getFieldLabel = (fieldName) => {
    const labels = {
      name: {
        'real-estate': 'اسم العقار',
        lands: 'اسم الأرض',
        cars: 'اسم السيارة',
        restaurants: 'اسم المطعم',
        hospitals: 'اسم المستشفى',
        clinics: 'اسم العيادة',
        hotels: 'اسم الفندق',
        pharmacies: 'اسم الصيدلية',
        gyms: 'اسم النادي الرياضي',
        default: 'الاسم'
      },
      description: 'الوصف',
      location: 'العنوان التفصيلي',
      phone: 'رقم الهاتف',
      image: 'صورة',
      governorate: 'المحافظة'
    };

    if (fieldName === 'name' && currentService) {
      return labels.name[currentService] || labels.name.default;
    }
    return labels[fieldName] || fieldName;
  };

  // Handle filter change
  const handleFilterChange = (serviceId, gov) => {
    setFilters((prev) => ({
      ...prev,
      [serviceId]: gov
    }));
  };

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };

  // Handle closing the form
  const handleCloseForm = () => {
    setShowAddForm(false);
    setFormData({
      name: '',
      description: '',
      location: '',
      governorate: '',
      phone: '',
      image: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', {
      ...formData,
      serviceType: currentService,
      fullLocation: formData.governorate
        ? `${formData.location} - ${formData.governorate}`
        : formData.location
    });
    handleCloseForm();
  };

  // Handle scroll and active section detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      setShowScroll(scrollPosition > 300);

      for (const [id, ref] of Object.entries(sectionRefs.current)) {
        if (!ref) continue;
        const sectionTop = ref.offsetTop;
        const sectionHeight = ref.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(id);
          break;
        }
      }
    };

    const handleHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(hash);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', handleHash);

    handleHash();
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);





  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'auto';
    }
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="">
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Sidebar */}
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-56 lg:w-64 bg-white dark:bg-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-black/20 hidden md:block p-4 overflow-y-auto z-20">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">الخدمات</h2>
        <nav>
          <ul className="space-y-2">
            {services.map((service) => (
              <li key={service.id}>
                <a
                  href={`#${service.id}`}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                    activeSection === service.id
                      ? 'bg-gradient-to-l from-amber-400 to-amber-500 text-gray-900 dark:text-white shadow-lg border-2 border-amber-300 transform -translate-x-1'
                      : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-2 hover:border-amber-400 hover:transform hover:-translate-x-1'
                  }`}
                  aria-current={activeSection === service.id ? 'page' : undefined}
                >
                  <span className="ml-2 text-gray-900 dark:text-white text-xl">{service.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{service.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-20 md:hidden">
        <div className="flex overflow-x-auto py-2 px-1">
          {services.map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              className={`flex flex-col items-center justify-center p-2 mx-1 rounded-lg min-w-[70px] ${
                activeSection === service.id
                  ? 'bg-amber-500 text-gray-900 dark:text-white'
                  : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-current={activeSection === service.id ? 'page' : undefined}
            >
              <span className="text-2xl text-amber-500 dark:text-amber-400 mb-1">{service.icon}</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{service.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:pl-56 lg:pl-64">
        <div className="text-center mb-8 md:mb-12 px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">خدماتنا</h1>
          <p className="text-base md:text-lg font-medium">
            اكتشف الخدمات المميزة المتاحة في منطقتك
          </p>
        </div>

        <div className="space-y-12">
          {services.map((service) => {
            const selectedGov = filters[service.id] || '';

            return (
              <section
                key={service.id}
                id={service.id}
                ref={(el) => (sectionRefs.current[service.id] = el)}
                className="scroll-mt-20"
              >
               <div
                 className={`bg-gradient-to-br ${service.color} rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 mb-6`}
                 style={{ width: '100%', height: '160px', marginLeft: '-1rem', marginRight: '-1rem', width: 'calc(100% + 2rem)' }}
               >

                  <div className="p-4 md:p-6 text-white">
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 md:p-3 rounded-full flex items-center justify-center w-12 h-12 md:w-14 md:h-14 ${service.bgColor}`}>
                          {React.cloneElement(service.icon, { 
                            className: 'text-3xl text-black',
                            style: { 
                              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
                            }
                          })}
                        </div>
                        <h3 className="text-xl font-bold text-white">{service.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentService(service.id);
                            setShowAddForm(true);
                          }}
                          className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm md:text-base"
                          aria-label={getAddButtonText(service.id)}
                        >
                          <FaPlus className="text-sm md:text-base" />
                          <span>{getAddButtonText(service.id)}</span>
                        </button>
                        <GovernorateFilter
                          selectedGov={selectedGov}
                          onSelectGov={(gov) => handleFilterChange(service.id, gov)}
                        />
                      </div>
                    </div>

                    {selectedGov && (
                      <div className="mb-2 flex justify-end">
                        <span className="text-xs bg-white bg-opacity-90 px-3 py-1 rounded-full text-gray-900 font-medium shadow-md whitespace-nowrap">
                          {selectedGov}
                        </span>
                      </div>
                    )}
                    <p className="text-base md:text-lg mb-2 text-white text-opacity-90 font-medium">
                      {service.id === 'stores' 
                        ? 'اكتشف أفضل المتاجر المحلية والعالمية في منطقتك'
                        : service.description
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow w-full">
                  <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-white">
                    محتوى {service.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-6">
                    هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من
                    مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص
                    الأخرى.
                  </p>
                  <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 w-full">
                  {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow dark:border-gray-700"
                        >
                          <div className="from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-white"></div>
                          <h4 className="font-medium text-gray-800 dark:text-white">عنصر {item}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">وصف قصير للعنصر</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Scroll to Top Button */}
        {showScroll && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 md:right-auto md:left-4 bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-10"
            aria-label="الانتقال إلى الأعلى"
          >
            <FaChevronUp className="text-xl" />
          </button>
        )}

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
              <button
                onClick={handleCloseForm}
                type="button"
                className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="إغلاق النموذج"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
                {getAddButtonText(currentService)}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {getFieldLabel('name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder={`أدخل ${getFieldLabel('name').toLowerCase()}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {getFieldLabel('description')}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="أدخل وصفًا مختصرًا"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {getFieldLabel('governorate')}
                    </label>
                    <select
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">اختر المحافظة</option>
                      {palestinianGovernorates.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {getFieldLabel('location')}
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="الشارع والمنطقة"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {getFieldLabel('phone')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="أدخل رقم الهاتف"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {getFieldLabel('image')} (اختياري)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/30 dark:file:text-amber-300 dark:hover:file:bg-amber-900/50"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      يمكنك رفع صورة أو تخطي هذه الخطوة
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}