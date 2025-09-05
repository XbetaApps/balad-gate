"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const AdsBanner = ({ adId }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await fetch(`/api/ads/${adId}`);
        if (!response.ok) {
          throw new Error('فشل في جلب الإعلان');
        }
        const data = await response.json();
        setAd(data);
      } catch (err) {
        console.error('خطأ في جلب الإعلان:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [adId]);

  if (loading) return <div className="w-full h-32 bg-gray-200 animate-pulse"></div>;
  if (error) return <div className="text-red-500 p-4">خطأ: {error}</div>;
  if (!ad) return null;

  return (
    <div className="w-full bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <a 
        href={ad.link || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        <div className="relative w-full h-32 md:h-48">
          <Image
            src={ad.imageUrl}
            alt={ad.title || 'إعلان'}
            fill
            className="object-cover"
            priority
          />
        </div>
        {ad.title && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">{ad.title}</h3>
            {ad.description && (
              <p className="text-gray-600 mt-1">{ad.description}</p>
            )}
          </div>
        )}
      </a>
    </div>
  );
};

export default AdsBanner;
