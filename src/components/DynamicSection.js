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
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '@/app/auth/AuthProvider';

const PostDetailsModal = dynamic(() => import('./PostDetailsModal'), { ssr: false });

const defaultIcons = {
  'صحة ولياقة': 'FaClinicMedical',
  'خدمات أخرى': 'FaBriefcase',
  'خدمات تجارية': 'FaStore',
  'تعليم وتطوير': 'FaGraduationCap',
  'مركبات ومواصلات': 'FaCar',
  'عقارات وأراضي': 'FaHome',
  'متاجر': 'FaStore',
  'صيدليات': 'FaPills',
  'مجوهرات': 'FaRing',
  'مجوهرات وذهب': 'FaRing',
  'مراكز تجارية': 'FaShoppingBag',
  'مطاعم': 'FaUtensils',
  'فنادق': 'FaHotel',
  'سيارات': 'FaCar',
  'عقارات': 'FaHome',
  'أراضي': 'FaMapMarkedAlt',
  'فرص عمل': 'FaBriefcase',
  'وظائف': 'FaBriefcase',
  'ملابس وأزياء': 'FaTshirt',
  'أزياء': 'FaTshirt',
  'دورات دراسية': 'FaGraduationCap',
  'دورات': 'FaGraduationCap',
  'مستشفيات': 'FaHospital',
  'عيادات طبية': 'FaClinicMedical',
  'عيادات': 'FaClinicMedical',
  'أماكن ترفيهية': 'FaTheaterMasks',
  'ترفيه': 'FaTheaterMasks',
  'صالات أفراح': 'FaGlassCheers',
  'خدمات توصيل': 'FaTruck',
  'توصيل': 'FaTruck',
  'محطات وقود': 'FaGasPump',
  'صالات رياضية': 'FaDumbbell',
  'نوادي رياضية': 'FaDumbbell',
  'مكتبات وكتب': 'FaBook',
  'مكتبات': 'FaBook',
  'هدايا وتحف': 'FaGift',
  'هدايا': 'FaGift',
  'مراكز تجميل': 'FaCut',
  'صحة': 'FaClinicMedical'
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

const DynamicSection = () => {
  const { theme } = useTheme();
  const { isAuthenticated, token: ctxToken } = useAuth();

  const [categories, setCategories] = useState([]);
  const [favoritesSet, setFavoritesSet] = useState(new Set()); // مركزي
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [error, setError] = useState(null);

  const authToken = ctxToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  // جلب الأقسام
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        const data = await response.json();

        let formatted = data.map(category => ({
          id: category.id,
          name: category.name,
          icon: defaultIcons[category.name] || 'FaStore',
          parent_id: category.parent_id,
          sort_order: category.sort_order,
          is_active: category.is_active,
          apiEndpoint: `/api/posts?categoryName=${encodeURIComponent(category.name)}`,
          viewAllLink: `/services?category=${encodeURIComponent(category.name)}`
        }));

        formatted.sort((a, b) => {
          if ((a.sort_order || 0) !== (b.sort_order || 0)) {
            return (a.sort_order || 0) - (b.sort_order || 0);
          }
          return a.name.localeCompare(b.name, 'ar');
        });

        setCategories(formatted);
      } catch (err) {
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // جلب المفضلات مرة واحدة فقط
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!authToken) {
        setFavoritesSet(new Set());
        return;
      }
      try {
        setFavLoading(true);
        const res = await fetch('/api/favorites?archived=false&limit=500', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) {
          // لا توقف الصفحة — فقط تجاهل
          console.warn('favorites fetch failed with status', res.status);
          setFavoritesSet(new Set());
          return;
        }
        const json = await res.json().catch(() => ({ data: [] }));
        const list = Array.isArray(json?.data) ? json.data : [];
        setFavoritesSet(new Set(list.map(row => row.item_id)));
      } catch (e) {
        console.warn('favorites fetch error', e);
        setFavoritesSet(new Set());
      } finally {
        setFavLoading(false);
      }
    };
    fetchFavorites();
  }, [authToken]);

  // دالة تحديث مركزية بعد التبديل (ليتزامن كل الأقسام)
  const updateFavoritesSet = useCallback((postId, isFavorited) => {
    setFavoritesSet(prev => {
      const next = new Set(prev);
      if (isFavorited) next.add(postId); else next.delete(postId);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-2"></div>
        <p className="text-gray-500">جاري تحميل الأقسام...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-red-500 mb-2">حدث خطأ: {error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          isAuthenticated={isAuthenticated}
          authToken={authToken}
          favoritesSet={favoritesSet}
          updateFavoritesSet={updateFavoritesSet}
        />
      ))}
    </div>
  );
};

const CategorySection = ({ category, isAuthenticated, authToken, favoritesSet, updateFavoritesSet }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hasData, setHasData] = useState(false);

  const containerRef = useRef(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const sLeft = useRef(0);

  // جلب منشورات القسم + حقن isFavorite بالاعتماد على favoritesSet المركزي
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(category.apiEndpoint);
      if (!response.ok) throw new Error('فشل في تحميل البيانات: ' + response.status);
      const data = await response.json();
      const itemsData = Array.isArray(data?.items) ? data.items : [];

      const withFav = itemsData.map(p => ({ ...p, isFavorite: favoritesSet.has(p.id) }));
      setItems(withFav);
      setHasData(withFav.length > 0);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
      setItems([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [category.apiEndpoint, favoritesSet]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const scrollTo = (dir) => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    containerRef.current.scrollTo({ left: scrollLeft + (dir === 'left' ? -clientWidth : clientWidth), behavior: 'smooth' });
  };

  const updateArrows = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', updateArrows);
      updateArrows();
      return () => el.removeEventListener('scroll', updateArrows);
    }
  }, [updateArrows]);

  const startDrag = (e) => {
    dragging.current = true;
    startX.current = e.pageX || e.touches[0].pageX;
    sLeft.current = containerRef.current.scrollLeft;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };
  const onDrag = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    const x = e.pageX || e.touches[0].pageX;
    containerRef.current.scrollLeft = sLeft.current - (x - startX.current) * 2;
  };
  const stopDrag = () => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  const handleWheel = (e) => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    containerRef.current.scrollLeft += e.deltaY + e.deltaX;
  };

  const Icon = getIconComponent(category.icon);

  // POST Toggle
  const toggleFavoriteOnServer = async (postId) => {
    console.log('toggleFavoriteOnServer called with postId:', postId);
    if (!authToken) {
      console.error('No auth token found');
      throw new Error('يرجى تسجيل الدخول');
    }

    try {
      console.log('Sending request to /api/favorites with:', { item_id: postId });
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ item_id: postId })
      });

      console.log('Response status:', res.status);
      
      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('استجابة غير صالحة من الخادم');
      }

      if (!res.ok) {
        console.error('Server returned error:', {
          status: res.status,
          statusText: res.statusText,
          data
        });
        throw new Error(data?.message || `خطأ في الخادم (${res.status})`);
      }

      if (data?.success === false) {
        console.error('Operation failed:', data);
        throw new Error(data.message || 'فشل تبديل المفضلة');
      }

      console.log('Toggle successful, new state:', data.isFavorited);
      return !!data.isFavorited;
    } catch (error) {
      console.error('Error in toggleFavoriteOnServer:', {
        error: error.message,
        stack: error.stack
      });
      throw error; // Re-throw to be handled by the caller
    }
  };

  const toggleFavorite = async (e, post) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('سجّل الدخول أولاً لإضافة للمفضلة');
      return;
    }

    // Save current state for potential rollback
    const prevItems = [...items];
    const wasFavorite = prevItems.find(i => i.id === post.id)?.isFavorite;
    
    // Optimistic update
    const optimisticItems = prevItems.map(i => 
      i.id === post.id ? { ...i, isFavorite: !wasFavorite } : i
    );
    setItems(optimisticItems);

    try {
      console.log(`Toggling favorite for post ${post.id}, current state: ${wasFavorite}`);
      const finalIsFav = await toggleFavoriteOnServer(post.id);
      
      // Final update with server response
      setItems(curr => 
        curr.map(i => (i.id === post.id ? { ...i, isFavorite: finalIsFav } : i))
      );
      
      // Update central state
      updateFavoritesSet(post.id, finalIsFav);
      
      console.log(`Favorite toggled successfully, new state: ${finalIsFav}`);
      
    } catch (error) {
      console.error('Error in toggleFavorite:', {
        postId: post.id,
        error: error.message,
        stack: error.stack
      });
      
      // Revert to previous state on error
      setItems(prevItems);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'حدث خطأ أثناء تحديث المفضلة';
      alert(errorMessage);
      
      // If it was a 401 error, consider refreshing auth
      if (error.message.includes('401') || error.message.includes('غير مصرح')) {
        console.log('Auth error detected, consider refreshing token or redirecting to login');
        // You might want to add auth refresh logic here
      }
    }
  };

  if (!loading && !error && !hasData) return null;

  if (loading) return (
    <div className="py-10 flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-2"></div>
      <p className="text-gray-500">جاري تحميل {category.name}...</p>
    </div>
  );

  if (error) return (
    <div className="py-6 text-center">
      <p className="text-red-500 mb-2">حدث خطأ في {category.name}: {error}</p>
      <button onClick={fetchItems} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">
        إعادة المحاولة
      </button>
    </div>
  );

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
              {category.name}
            </h2>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mt-4 rounded-full"></div>
        </div>
      </div>

      {/* Cards */}
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
            <div
              key={item.id}
              className="flex-none w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer snap-center flex-shrink-0 border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800"
              onClick={() => setSelectedPost(item)}
            >
              <div className="relative h-56 flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden group">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-700 dark:to-gray-800">
                    <span className="text-4xl text-amber-400"><Icon /></span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {category.name}
                </div>

                {isAuthenticated && !item.is_anonymous && (
                  <button
                    onClick={(e) => toggleFavorite(e, item)}
                    className="flex items-center text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1 rounded-full transition-colors absolute top-3 right-3"
                    title={item.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    {item.isFavorite ? (
                      <>
                        <FaHeart className="ml-1 text-red-500" />
                        <span>مفضل</span>
                      </>
                    ) : (
                      <>
                        <FaRegHeart className="ml-1" />
                        <span>إضافة للمفضلة</span>
                      </>
                    )}
                  </button>
                )}
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
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">
                          {parseFloat(item.price).toLocaleString()}
                        </span>
                        <span className="mr-1 text-gray-500 text-sm">شيكل</span>
                      </div>
                    )}
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-1"
                      onClick={(e) => { e.stopPropagation(); setSelectedPost(item); }}
                    >
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

      {selectedPost && (
        <PostDetailsModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
        />
      )}
    </div>
  );
};

export default DynamicSection;
