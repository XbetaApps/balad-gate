'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const CITIES = [
  { id: 1, name: 'القدس', country: 'PS', lat: 31.7683, lon: 35.2137 },
  { id: 2, name: 'رام الله', country: 'PS', lat: 31.9074, lon: 35.1889 },
  { id: 3, name: 'نابلس', country: 'PS', lat: 32.2222, lon: 35.2541 },
  { id: 4, name: 'جنين', country: 'PS', lat: 32.4608, lon: 35.3020 },
];

const API_KEY = 'eb5423add9f28d7d1485a07e3f6a9c56';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Weather Background Component
const WeatherBackground = ({ isDaytime }) => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0">
        {isDaytime ? (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-100 to-cyan-100">
            {/* Sun with pulse animation */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32">
              <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 bg-yellow-200 rounded-full animate-ping opacity-40"></div>
              <div className="absolute inset-0 bg-yellow-100 rounded-full animate-pulse"></div>
            </div>
            
            {/* Subtle moving clouds */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/3 left-1/4 w-48 h-16 bg-white rounded-full opacity-70 animate-float"></div>
              <div className="absolute top-1/2 right-1/4 w-32 h-12 bg-white rounded-full opacity-70 animate-float animation-delay-2000"></div>
              <div className="absolute top-1/4 right-1/3 w-24 h-10 bg-white rounded-full opacity-70 animate-float animation-delay-3000"></div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Moon with subtle glow */}
            <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gray-200 rounded-full shadow-[0_0_50px_20px_rgba(255,255,255,0.1)]">
              <div className="absolute top-2 right 2 w-4 h-4 bg-gray-300 rounded-full opacity-70"></div>
              <div className="absolute top-6 right-8 w-3 h-3 bg-gray-400 rounded-full opacity-50"></div>
            </div>
            
            {/* Stars */}
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={`star-${i}`}
                  className="absolute bg-white rounded-full animate-twinkle"
                  style={{
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.8 + 0.2,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${Math.random() * 3 + 2}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Global animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(0) translateY(-10px); }
          75% { transform: translateX(-10px) translateY(-5px); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

const WeatherWidget = ({ darkMode }) => {
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  
  // Initialize with default data to avoid loading state
  const [cachedWeather, setCachedWeather] = useState(
    CITIES.map(city => ({
      ...city,
      main: { 
        temp: 25, 
        humidity: 50,
        temp_max: 28,
        temp_min: 22
      },
      weather: [{ 
        description: 'مشمس', 
        icon: '01d',
        main: 'Clear'
      }],
      wind: { speed: 5 },
      loaded: false
    }))
  );
  
  // Determine if it's day or night based on darkMode prop
  const isDaytime = !darkMode;

  // Fetch weather data for all cities
  useEffect(() => {
    const fetchWeatherForAllCities = async () => {
      const updatedCities = await Promise.all(
        CITIES.map(async (city) => {
          try {
            const response = await fetch(
              `${BASE_URL}/weather?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric&lang=ar`
            );
            
            if (!response.ok) return { ...city, loaded: false };
            
            const data = await response.json();
            return {
              ...city,
              ...data,
              loaded: true
            };
          } catch (err) {
            console.error(`Error fetching weather for ${city.name}:`, err);
            return { ...city, loaded: false };
          }
        })
      );
      
      setCachedWeather(updatedCities);
    };

    fetchWeatherForAllCities();
    const interval = setInterval(fetchWeatherForAllCities, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Auto slide between cities every 7 seconds
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setIsSliding(true);
      setTimeout(() => {
        setCurrentCityIndex((prev) => (prev + 1) % CITIES.length);
        setIsSliding(false);
      }, 300);
    }, 7000);

    return () => clearInterval(slideInterval);
  }, []);

  // Get current weather data
  const currentWeather = cachedWeather[currentCityIndex] || cachedWeather[0];
  
  // Get weather icon with day/night variants
  const getWeatherIcon = (iconCode) => {
    if (!iconCode) return '01d';
    return isDaytime 
      ? iconCode.replace('n', 'd')
      : iconCode.replace('d', 'n');
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-xl min-h-[500px] transition-all duration-300 ${
      isSliding ? 'opacity-0' : 'opacity-100'
    } ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      
      <WeatherBackground isDaytime={isDaytime} />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* City name as title */}
        <div className="text-center pt-6">
        
        </div>

        {/* Main Weather Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold mb-2">
            {currentWeather.name}
          </h2>
          
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            {new Date().toLocaleDateString('ar-PS', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          
          <div className="relative w-40 h-40 my-4">
            <Image
              src={`https://openweathermap.org/img/wn/${getWeatherIcon(currentWeather.weather?.[0]?.icon || '01d')}@2x.png`}
              alt={currentWeather.weather?.[0]?.description || 'حالة الطقس'}
              width={160}
              height={160}
              className="drop-shadow-lg"
            />
          </div>
          
          <div className="text-6xl font-bold my-2">
            {Math.round(currentWeather.main?.temp || 0)}°
          </div>
          
          <div className={`text-xl font-medium mb-6 ${
            darkMode ? 'text-amber-300' : 'text-amber-600'
          }`}>
            {currentWeather.weather?.[0]?.description || 'مشمس'}
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
            <div className="bg-white/10 dark:bg-gray-700/50 p-3 rounded-lg">
            </div>
          </div>
          
          {/* More Details Button */}
          <Link 
            href="/weather"
            className={`px-9 py-3 rounded-2xl font-medium transition-all duration-300 border-2 ${
              darkMode 
                ? 'bg-gray-700 text-white border-amber-400 hover:bg-gray-600' 
                : 'bg-white text-gray-800 border-amber-400 hover:bg-gray-50'
            } shadow-md hover:shadow-lg flex items-center`}
          >
            <span>المزيد من التفاصيل</span>
            <svg 
              className="mr-2 w-4 h-4 rtl:rotate-180" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
