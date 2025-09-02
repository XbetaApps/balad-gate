'use client';

import React, { useEffect, useState, useCallback, useContext } from 'react';
import Link from 'next/link';
import { FaNewspaper, FaClock, FaSync } from 'react-icons/fa';
import { ColorModeContext } from '../app/nav/theme/ThemeProvider';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function LatestNews() {
  const { mode } = useContext(ColorModeContext);
  const darkMode = mode === 'dark';
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchLatestNews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fetch-news');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      setLatestNews(data.items || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('حدث خطأ أثناء تحميل الأخبار');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchLatestNews();

    // Set up auto-refresh
    const intervalId = setInterval(fetchLatestNews, REFRESH_INTERVAL);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchLatestNews]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
      </div>
    );
  }

  if (latestNews.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        لا توجد أخبار متاحة حالياً
      </div>
    );
  }

  return (
    <div className="w-full mb-16 relative">
      <div 
        className={`${darkMode ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-amber-600' : ' from-white to-amber-50 border-amber-200'} 
        border-4 shadow-2l overflow-hidden w-full`}
        style={{

          borderRadius: '25px',
          margin: '0 -12%',
          width: '120%',
          minHeight: '100px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
        dir="rtl"
      >
       
        <div className={`flex items-center justify-between px-8 py-4 relative z-10`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'} shadow-lg`}>
              <FaNewspaper className={`${darkMode ? 'text-amber-400' : 'text-amber-500'} text-4xl`} />
            </div>
            <h2 className={`text-xl font-black mr-4 ${darkMode ? 'text-white' : 'text-gray-800'}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              آخر الأخبار
              <div className={`h-1 w-16 mt-2 rounded-full ${darkMode ? 'bg-amber-500' : 'bg-amber-400'}`}></div>
            </h2>
          </div>
        <div className="flex items-center text-lg space-x-6">
          {lastUpdated && (
            <span className={`text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            </span>
          )}
          
        </div>
      </div>
      
      {error ? (
        <div className="p-6 text-center text-red-500">{error}</div>
      ) : (
        <div className="w-full overflow-hidden">
          <div className="overflow-x-auto pb-4 scrollbar-hide w-full">
            <div className="flex space-x-4 px-4 py-4 w-max min-w-full">
              {loading && latestNews.length === 0 ? (
                // Loading skeleton
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-600"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-4/5 mb-3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : (
                latestNews.map((item, index) => (
                  <div key={item.guid || index} className={`flex-shrink-0 w-96 ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-amber-600' : 'bg-white border-amber-100 hover:border-amber-200'} rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-300 border`}>
                    <Link 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`block h-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-amber-50'} transition-colors duration-200`}
                    >
                      <div className={`h-36 ${darkMode ? 'bg-gray-700' : 'bg-amber-50'} overflow-hidden`}>
                        <img 
                          src={item.image || '/images.png'} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.target.src = '/images.png';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} line-clamp-2 text-base mb-3 h-16 overflow-hidden`}>
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <FaClock className={`ml-1 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                            <span>{new Date(item.pubDate).toLocaleDateString('ar-EG')}</span>
                          </span>
                          <span className={`${darkMode ? 'text-amber-400' : 'text-amber-600'} font-medium truncate max-w-[120px]`} dir="ltr">
                            {item.source}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className={`px-6 py-3 ${darkMode ? 'bg-gray-800' : 'bg-amber-50'} text-center`}>
        <Link 
          href="/news" 
          className={`inline-flex items-center ${darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-800'} text-sm font-medium transition-colors`}
        >
          عرض المزيد من الأخبار
          <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        </div>
      </div>
    </div>
  );
}