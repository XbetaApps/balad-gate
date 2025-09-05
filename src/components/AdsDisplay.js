'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const AdsDisplay = ({ position = 'top', limit }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // افتراض limit حسب مكان الإعلان
  const effectiveLimit =
    limit ?? (position === 'top' ? 10 : position === 'bottom' ? 20 : 3);

  const isBanner = position === 'middle';
  const isSideBanner = position === 'left' || position === 'right';
  const isBottom = position === 'bottom';

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/ads?position=${position}&limit=${effectiveLimit}&includeInactive=false`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`فشل تحميل الإعلانات: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setAds(data);
        } else if (data && Array.isArray(data.ads)) {
          setAds(data.ads);
        } else if (data && data.data && Array.isArray(data.data)) {
          setAds(data.data);
        } else {
          setAds([]);
        }
      } catch (err) {
        setError('حدث خطأ في تحميل الإعلانات');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [position, effectiveLimit]);

  if (loading) return <div className="text-center py-4">جاري تحميل الإعلانات...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;
  if (ads.length === 0) return <div className="text-center py-4">لا توجد إعلانات متاحة حالياً</div>;

  // ✅ إعلانات جانبية (يسار أو يمين) - معطلة حالياً
  if (isSideBanner) {
    return null; // لا تظهر أي إعلانات جانبية
  }

  // ✅ إعلانات أسفل الصفحة (صف واحد أفقي مع scroll)
  if (isBottom) {
    return (
      <div className="w-full py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
            إعلانات
          </h2>
          <div className="flex flex-nowrap overflow-x-auto pb-6 gap-6 scrollbar-hide px-2">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="flex-shrink-0 w-80 rounded-2xl shadow-xl hover:shadow-2xl bg-white dark:bg-gray-800 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="relative w-full h-56">
                  {ad?.image_url ? (
                    <Image
                      src={ad.image_url}
                      alt={ad.title || 'إعلان'}
                      width={320}
                      height={224}
                      className="w-full h-full object-cover hover:opacity-95 transition-opacity duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      <span className="text-6xl">📢</span>
                    </div>
                  )}
                  {ad.is_featured && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full z-10 shadow-lg">
                      مميز
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 line-clamp-2 h-16">
                    {ad.title || 'عنوان الإعلان'}
                  </h3>
                  <div className="flex items-center justify-between mt-4">
                    {ad.price ? (
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {ad.price} شيكل
                        {ad.old_price && (
                          <span className="mr-2 text-sm text-gray-400 line-through">
                            {ad.old_price} شيكل
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-base font-medium text-green-600 dark:text-green-400">
                        إعلان مجاني
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✅ باقي الأماكن (top, middle) شبكة أو بانر
  return (
    <div className={`w-full ${isBanner ? '' : 'py-4'}`}>
      <div className={isBanner ? 'w-full' : 'container mx-auto px-4'}>
        <div
          className={
            isBanner
              ? 'w-full'
              : 'grid grid-cols-1 md:grid-cols-3 gap-6 max-w-8xl mx-auto'
          }
        >
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`group relative overflow-hidden transition-all duration-300 ${
                isBanner
                  ? 'w-full max-h-[500px]'
                  : 'w-full rounded-2xl shadow-xl hover:shadow-2xl bg-white dark:bg-gray-800 h-full flex flex-col'
              }`}
            >
              <div
                className={`relative w-full ${
                  isBanner ? 'h-[500px]' : 'h-80'
                } overflow-hidden`}
              >
                {isBanner && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent z-10"></div>
                )}
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdsDisplay;
