'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FaChevronLeft, FaChevronRight, FaStore, FaHome, FaCar, FaUtensils, FaBriefcase, FaTshirt, FaMobileAlt, 
  FaLaptop, FaGamepad, FaPills, FaGem, FaShoppingBag, FaHotel, FaGlassCheers, FaGasPump, FaTruck, 
  FaHospital, FaClinicMedical, FaSprayCan, FaDumbbell, FaGraduationCap, FaBook, FaGift, FaMapMarkerAlt,
  FaRing, FaCut, FaTheaterMasks, FaMapMarkedAlt 
} from 'react-icons/fa';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const PostDetailsModal = dynamic(() => import('./PostDetailsModal'), { ssr: false });

// احتفظنا بالخريطة كاحتياطي، لكن العرض سيعتمد على section.icon و section.title
const categoryIcons = {
  'commercial-stores': { name: 'متاجر', icon: 'FaStore' },
  'pharmacies': { name: 'صيدليات', icon: 'FaPills' },
  'jewelry': { name: 'مجوهرات وذهب', icon: 'FaRing' },
  'malls': { name: 'مراكز تجارية', icon: 'FaShoppingBag' },
  'restaurants': { name: 'مطاعم', icon: 'FaUtensils' },
  'hotels': { name: 'فنادق', icon: 'FaHotel' },
  'cars': { name: 'سيارات', icon: 'FaCar' },
  'real-estate': { name: 'عقارات', icon: 'FaHome' },
  'lands': { name: 'أراضي', icon: 'FaMapMarkedAlt' },
  'jobs': { name: 'فرص عمل', icon: 'FaBriefcase' },
  'clothing': { name: 'ملابس وأزياء', icon: 'FaTshirt' },
  'education': { name: 'دورات دراسية', icon: 'FaGraduationCap' },
  'hospitals': { name: 'مستشفيات', icon: 'FaHospital' },
  'clinics': { name: 'عيادات طبية', icon: 'FaClinicMedical' },
  'entertainment': { name: 'أماكن ترفيهية', icon: 'FaTheaterMasks' },
  'wedding-halls': { name: 'صالات أفراح', icon: 'FaGlassCheers' },
  'transport': { name: 'خدمات توصيل', icon: 'FaTruck' },
  'fuel': { name: 'محطات وقود', icon: 'FaGasPump' },
  'sports': { name: 'صالات رياضية', icon: 'FaDumbbell' },
  'books': { name: 'مكتبات وكتب', icon: 'FaBook' },
  'gifts': { name: 'هدايا وتحف', icon: 'FaGift' },
  'beauty': { name: 'مراكز تجميل', icon: 'FaCut' },
  'health': { name: 'صحة', icon: 'FaClinicMedical' }
};

const getIconComponent = (iconName) => {
  const iconMap = {
    FaStore, FaHome, FaCar, FaUtensils, FaBriefcase, FaTshirt, FaMobileAlt, FaLaptop, FaGamepad,
    FaPills, FaGem, FaShoppingBag, FaHotel, FaGlassCheers, FaGasPump, FaTruck,
    FaHospital, FaClinicMedical, FaSprayCan, FaDumbbell, FaGraduationCap, FaBook, FaGift, FaMapMarkerAlt,
    FaRing, FaCut, FaTheaterMasks, FaMapMarkedAlt
  };
  return iconMap[iconName] || FaStore;
};

const DynamicSection = ({ section }) => {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // جلب البيانات (من apiEndpoint إن وجد)
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('جاري جلب البيانات للقسم:', section.title);
      console.log('API Endpoint:', section.apiEndpoint || 'غير محدد');

      // إذا كان هناك apiEndpoint مخصص، استخدمه مباشرة
      if (section.apiEndpoint) {
        console.log('جاري جلب البيانات من API المخصص');
        const response = await fetch(section.apiEndpoint);
        console.log('حالة الاستجابة:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('خطأ في الاستجابة:', errorText);
          throw new Error('فشل في تحميل البيانات: ' + response.status);
        }
        
        const data = await response.json();
        console.log('تم استلام البيانات:', data);
        
        const itemsData = Array.isArray(data?.items) ? data.items : [];
        console.log('عدد العناصر المستلمة:', itemsData.length);
        
        setItems(itemsData);
        return;
      }

      // إذا لم يكن هناك apiEndpoint، استخدم عنوان URL الافتراضي مع اسم القسم
      const url = `/api/posts?categoryName=${encodeURIComponent(section.title || '')}`;
      console.log('جاري جلب البيانات من URL:', url);
      
      const response = await fetch(url);
      console.log('حالة الاستجابة:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('خطأ في الاستجابة:', errorText);
        throw new Error('فشل في تحميل البيانات: ' + response.status);
      }

      const data = await response.json();
      console.log('تم استلام البيانات:', data);
      
      const itemsData = Array.isArray(data?.items) ? data.items : [];
      console.log('عدد العناصر المستلمة:', itemsData.length);
      setItems(itemsData);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [section.id, section.title]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const scrollTo = (direction) => {
    if (!containerRef.current) return;
    const { scrollLeft: currentScroll, clientWidth } = containerRef.current;
    containerRef.current.scrollTo({
      left: currentScroll + (direction === 'left' ? -clientWidth : clientWidth),
      behavior: 'smooth'
    });
  };

  const updateArrows = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateArrows);
      updateArrows();
      return () => container.removeEventListener('scroll', updateArrows);
    }
  }, [updateArrows]);

  const startDrag = (e) => {
    isDragging.current = true;
    startX.current = e.pageX || e.touches[0].pageX;
    scrollLeft.current = containerRef.current.scrollLeft;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const onDrag = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX || e.touches[0].pageX;
    containerRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 2;
  };

  const stopDrag = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const handleWheel = (e) => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    containerRef.current.scrollLeft += e.deltaY + e.deltaX;
  };

  if (loading) return <div className="py-10 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div></div>;
  if (error) return (
    <div className="py-6 text-center">
      <p className="text-red-500 mb-2">حدث خطأ: {error}</p>
      <button onClick={fetchItems} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">
        إعادة المحاولة
      </button>
    </div>
  );

  const Icon = getIconComponent(section.icon || categoryIcons[section.id]?.icon);

  return (
    <div className="relative py-10 border-b border-gray-200 last:border-0 overflow-hidden group">
      {/* Section Header */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex flex-col items-center justify-center text-center mb-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full">
              <Icon className="text-2xl text-amber-600" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
              {section.title}
            </h2>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mt-4 rounded-full"></div>
        </div>
      </div>

      {/* Cards Container */}
      <div className="relative">
        {(showLeftArrow || showRightArrow) && (
          <>
            <button onClick={() => scrollTo('left')} className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 ${!showLeftArrow ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <FaChevronLeft className="text-amber-600 text-xl" />
            </button>
            <button onClick={() => scrollTo('right')} className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 ${!showRightArrow ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <FaChevronRight className="text-amber-600 text-xl" />
            </button>
          </>
        )}

        <div 
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide px-8 py-8 gap-6 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={startDrag}
          onTouchMove={onDrag}
          onTouchEnd={stopDrag}
          onWheel={handleWheel}
        >
          {items.map(item => (
            <div key={item.id} className="flex-none w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer snap-center flex-shrink-0 border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800" onClick={() => setSelectedPost(item)}>
              <div className="relative h-56 flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-700 dark:to-gray-800">
                    <span className="text-4xl text-amber-400">
                      {React.createElement(getIconComponent(section.icon || categoryIcons[section.id]?.icon))}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {section.title || categoryIcons[section.id]?.name}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-relaxed break-words min-h-[3.5rem] flex items-center">
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {item.title}
                  </span>
                </h3>
                <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-4">
                  <FaMapMarkerAlt className="ml-1 text-amber-500 flex-shrink-0" />
                  <span className="line-clamp-1 rtl:mr-1">{item.governorate || item.location || 'غير محدد'}</span>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    {item.price && (
                      <div className="flex items-center">
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">{parseFloat(item.price).toLocaleString()}</span>
                        <span className="mr-1 text-gray-500 text-sm">شيكل</span>
                      </div>
                    )}
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setSelectedPost(item); }}>
                      <span>عرض التفاصيل</span>
                      <FaChevronLeft className="text-xs mt-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPost && <PostDetailsModal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} post={selectedPost} />}
    </div>
  );
};

export default DynamicSection;