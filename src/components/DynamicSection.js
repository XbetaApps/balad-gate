'use client';
import Link from 'next/link';
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { FaStore, FaHome, FaCar, FaUtensils, FaBriefcase, FaTshirt, FaMobileAlt, FaLaptop, FaGamepad, FaTshirt as FaShirt } from 'react-icons/fa';
import { getMockData } from '@/mockData';
import { useTheme } from '../app/nav/theme/ThemeProvider';

// دالة لتحويل اسم الأيقونة إلى مكون React
const getIconComponent = (iconName) => {
  const iconMap = {
    'FaStore': FaStore,
    'FaHome': FaHome,
    'FaCar': FaCar,
    'FaUtensils': FaUtensils,
    'FaBriefcase': FaBriefcase,
    'FaTshirt': FaShirt,
    'FaMobileAlt': FaMobileAlt,
    'FaLaptop': FaLaptop,
    'FaGamepad': FaGamepad
  };
  
  return iconMap[iconName] || FaStore;
};

const DynamicSection = ({ section }) => {
  const { darkMode } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  // Handle wheel event for horizontal scrolling
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (containerRef.current) {
      containerRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  const scroll = useCallback((direction) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const cards = container.querySelectorAll('.carousel-card');
    if (!cards.length) return;
    
    const card = cards[0];
    const cardWidth = card.offsetWidth + 16; // 16px for gap-4
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    // Calculate new scroll position
    const currentScroll = container.scrollLeft;
    let newScroll = currentScroll + scrollAmount;
    
    // Ensure we don't scroll past the start or end
    newScroll = Math.max(0, Math.min(newScroll, container.scrollWidth - container.clientWidth));
    
    container.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
    
    // Update arrow visibility after scroll completes
    setTimeout(handleScroll, 300);
  }, [handleScroll]);

  const startDrag = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftStart.current = containerRef.current.scrollLeft;
  };

  const onDrag = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; 
    containerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const stopDrag = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { id: category } = section;
        const data = getMockData(category);
        setItems(Array.isArray(data) ? data.slice(0, 15) : []);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [section]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  if (loading) {
    return (
      <div className="py-6 border-b border-gray-200 last:border-0">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow overflow-hidden border-2 border-amber-100 flex-shrink-0 w-64">
                <div className="h-48 bg-gray-100"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 border-b border-gray-200 last:border-0">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">حدث خطأ أثناء تحميل البيانات</div>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-amber-600 hover:text-amber-800"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const Icon = getIconComponent(section.icon);

  return (
    <div className="py-6 border-b border-gray-200 dark:border-gray-700 last:border-0 relative">
      {/* Navigation Arrows */}
     
       
      
     

      <div className="flex items-center mb-4 pr-120">
        <Icon className="ml-2 text-2xl text-amber-600" />
        <h2 className="text-3xl font-bold   ">
          {section.title}
        </h2>
      </div>

      <div 
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide px-4 py-8"
        style={{
            


            scrollbarWidth: 'auto',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'auto',
          gap: '1rem',
       
        }}
        onMouseDown={startDrag}
        onMouseMove={onDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={startDrag}
        onTouchMove={onDrag}
        onTouchEnd={stopDrag}
        onWheel={handleWheel}
      >
        {items.map((item, index) => (
          <div 
            key={item.id || index} 
            className="group flex-shrink-0 w-64 bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-amber-400 hover:border-amber-500 dark:border-amber-400 dark:hover:border-amber-500 rounded-lg shadow transition-all duration-300 hover:shadow-lg hover:-translate-y-1 carousel-card"
          >
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-medium mb-2 line-clamp-2 h-14">{item.title}</h3>
                {item.price && <p className="font-bold">{item.price}</p>}
                {item.location && <p className="text-sm">{item.location}</p>}
                {item.year && <p className="text-sm">{item.year}</p>}
              </div>
              <button className="mt-4 w-full py-2 px-4 bg-amber-100 hover:bg-amber-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-amber-900 dark:text-white rounded text-sm font-medium transition-colors">
                عرض التفاصيل
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicSection;