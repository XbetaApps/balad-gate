'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  FaChevronLeft, FaChevronRight, FaStore, FaHome, FaCar, FaUtensils, FaBriefcase, FaTshirt, FaMobileAlt, 
  FaLaptop, FaGamepad, FaPills, FaGem, FaShoppingBag, FaHotel, FaGlassCheers, FaGasPump, FaTruck, 
  FaHospital, FaClinicMedical, FaSprayCan, FaDumbbell, FaGraduationCap, FaBook, FaGift, FaMapMarkerAlt,
  FaRing, FaCut, FaTheaterMasks, FaMapMarkedAlt, FaBuilding, FaBoxes
} from 'react-icons/fa';

// Default icon mapping for categories
const defaultIcons = {
  // الأقسام الرئيسية
  'صحة ولياقة': FaClinicMedical,
  'خدمات أخرى': FaBriefcase,
  'خدمات تجارية': FaStore,
  'تعليم وتطوير': FaGraduationCap,
  'مركبات ومواصلات': FaCar,
  'عقارات وأراضي': FaHome,
  
  // الأقسام الفرعية
  'متاجر': FaStore,
  'صيدليات': FaPills,
  'مجوهرات': FaRing,
  'مجوهرات وذهب': FaRing,
  'مراكز تجارية': FaShoppingBag,
  'مطاعم': FaUtensils,
  'فنادق': FaHotel,
  'سيارات': FaCar,
  'عقارات': FaHome,
  'أراضي': FaMapMarkedAlt,
  'فرص عمل': FaBriefcase,
  'وظائف': FaBriefcase,
  'ملابس وأزياء': FaTshirt,
  'أزياء': FaTshirt,
  'دورات دراسية': FaGraduationCap,
  'دورات': FaGraduationCap,
  'مستشفيات': FaHospital,
  'عيادات طبية': FaClinicMedical,
  'عيادات': FaClinicMedical,
  'أماكن ترفيهية': FaTheaterMasks,
  'ترفيه': FaTheaterMasks,
  'صالات أفراح': FaGlassCheers,
  'خدمات توصيل': FaTruck,
  'توصيل': FaTruck,
  'محطات وقود': FaGasPump,
  'صالات رياضية': FaDumbbell,
  'نوادي رياضية': FaDumbbell,
  'مكتبات وكتب': FaBook,
  'مكتبات': FaBook,
  'هدايا وتحف': FaGift,
  'هدايا': FaGift,
  'مراكز تجميل': FaCut,
  'صحة': FaClinicMedical
};

const DynamicCategories = ({ darkMode }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching categories from API...');
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received categories from API:', data);
        
        // Transform categories to include icon and path
        const formattedCategories = data.map(category => {
          const IconComponent = defaultIcons[category.name] || FaBoxes;
          
          return {
            id: category.id,
            name: category.name,
            icon: IconComponent,
            path: `/services?category=${encodeURIComponent(category.name)}`,
            parent_id: category.parent_id,
            sort_order: category.sort_order,
            is_active: category.is_active
          };
        });
        
        // Sort by sort_order, then by name
        formattedCategories.sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return (a.sort_order || 0) - (b.sort_order || 0);
          }
          return a.name.localeCompare(b.name, 'ar');
        });
        
        setCategories(formattedCategories);
        console.log('Formatted categories:', formattedCategories);
        
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          <span className="mr-3 text-gray-500">جاري تحميل الأقسام...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto py-8">
        <div className="text-center text-red-500">
          <p>حدث خطأ في تحميل الأقسام: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* 🧩 Dynamic Categories Cards */}
      <div className="relative">
        <button 
          onClick={scrollLeft}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${
            darkMode ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-white text-amber-600 hover:bg-gray-100'
          } shadow-lg transition-all`}
          aria-label="Scroll left"
        >
          <FaChevronRight className="text-xl" />
        </button>
        
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide space-x-4 px-8 py-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Link
                href={category.path || '#'}
                key={category.id || index}
                className="group flex-shrink-0 w-24 flex flex-col items-center"
              >
                <div className={`
                  w-16 h-16 rounded-xl flex items-center justify-center
                  transition-all duration-300 mb-2
                  ${darkMode 
                    ? 'bg-gray-800 text-amber-400 group-hover:bg-amber-500/10' 
                    : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'}
                `}>
                  <IconComponent className="text-2xl transition-transform group-hover:scale-110" />
                </div>
                <span className={`
                  text-xs font-medium text-center font-sans whitespace-nowrap
                  transition-colors duration-300
                  ${darkMode 
                    ? 'text-gray-200 group-hover:text-amber-300' 
                    : 'text-gray-700 group-hover:text-amber-600'}
                `}>
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
        
        <button 
          onClick={scrollRight}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${
            darkMode ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-white text-amber-600 hover:bg-gray-100'
          } shadow-lg transition-all`}
          aria-label="Scroll right"
        >
          <FaChevronLeft className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default DynamicCategories;
