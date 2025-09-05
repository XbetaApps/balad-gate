'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const AdsDisplay = ({ position = 'top', limit = 3 }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isBanner = position === 'middle';
  const isSideBanner = position === 'left' || position === 'right';

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/ads?position=${position}&limit=${limit}&includeInactive=false`
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`فشل تحميل الإعلانات: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        // التحقق من هيكل البيانات المستلمة
        if (Array.isArray(data)) {
          setAds(data);
        } else if (data && Array.isArray(data.ads)) {
          setAds(data.ads);
        } else if (data && data.data && Array.isArray(data.data)) {
          setAds(data.data);
        } else {
          console.warn('Unexpected API response format:', data);
          setAds([]);
        }
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError('حدث خطأ في تحميل الإعلانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [position, limit]);

  if (loading) {
    return <div className="text-center py-4">جاري تحميل الإعلانات...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (ads.length === 0) {
    return (
      <div className={`w-full ${isBanner ? 'my-8' : 'py-4'}`}>
        <div className={isBanner ? 'w-full' : 'container mx-auto px-4'}>
          <div className={isBanner ? 'w-full' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-8xl mx-auto'}>
            لا توجد إعلانات متاحة حالياً
          </div>
        </div>
      </div>
    );
  }

  // For side banners, we'll show exactly 3 ads stacked vertically
  if (isSideBanner) {
    // Take only the first 3 ads
    const displayAds = ads.slice(0, 1);
    
    return (
      <div className={`fixed top-1/2 -translate-y-1/2 ${position === 'left' ? 'left-4' : 'right-4'} z-40 flex flex-col gap-4`}>
        {displayAds.map((ad, index) => (
          <div key={ad.id} className="w-[300px] flex-shrink-0">
            <div className="relative w-full">
              {ad?.image_url ? (
                <Image
                  src={ad.image_url}
                  alt={ad.title || `إعلان ${index + 1}`}
                  width={300}
                  height={600}
                  className="w-full h-auto object-contain rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center rounded-xl">
                  <span className="text-6xl">📢</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Add empty placeholders if less than 3 ads */}
        {Array(3 - displayAds.length).fill().map((_, i) => (
          <div key={`empty-${i}`} className="w-[300px] h-48 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <span className="text-4xl text-gray-400">📢</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full ${isBanner ? '' : 'py-4'}`}>
      <div className={isBanner ? 'w-full' : 'container mx-auto px-4'}>
        <div className={isBanner ? 'w-full' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-8xl mx-auto'}>
          {ads.map((ad) => (
            <div 
              key={ad.id} 
              className={`group relative overflow-hidden transition-all duration-300 ${
                isBanner 
                  ? 'w-full max-h-[500px]' 
                  : 'w-full rounded-2xl shadow-xl hover:shadow-2xl bg-white dark:bg-gray-800 h-full flex flex-col'
              }`}
            >
              <div className={`relative w-full ${isBanner ? 'h-[500px]' : 'h-80'} overflow-hidden`}>
                {isBanner && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent z-10"></div>}
                {ad.image_url ? (
                  <Image
                    src={ad.image_url}
                    alt={ad.title || 'إعلان'}
                    layout="fill"
                    objectFit="contain"
                    className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <span className="text-6xl">📢</span>
                  </div>
                )}
                
                {ad.is_featured && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-white text-sm font-bold px-4 py-1 rounded-full z-10 shadow-lg">
                    مميز
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-xl font-bold text-white">
                    {ad.title || 'عنوان الإعلان'}
                  </h3>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                {ad.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-base mb-6 line-clamp-3 flex-1">
                    {ad.description}
                  </p>
                )}
                
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    {ad.price ? (
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {ad.price} شيكل
                        </span>
                        {ad.old_price && (
                          <span className="mr-3 text-sm text-gray-400 line-through">
                            {ad.old_price} شيكل
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-base font-medium text-green-600 dark:text-green-400">
                        إعلان مجاني
                      </span>
                    )}
                    
                    
                  </div>
                  
                  {(ad.location || ad.date) && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                      {ad.location && (
                        <span className="flex items-center ml-4">
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {ad.location}
                        </span>
                      )}
                      {ad.date && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {ad.date}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          
        </div>
      </div>
    </div>
  );
};

export default AdsDisplay;
