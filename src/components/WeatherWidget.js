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

// Using a direct API key for now - in production, this should be in environment variables
const API_KEY = 'eb5423add9f28d7d1485a07e3f6a9c56';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Weather Background Component
const WeatherBackground = ({ weatherType, isDaytime }) => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0">
        {/* Day Theme - White background with sun */}
        {isDaytime && (
          <div className="absolute inset-0 bg-white">
            <div className="sun absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-300 rounded-full shadow-[0_0_60px_30px_rgba(253,230,138,0.8)]"></div>
          </div>
        )}
        
        {/* Night Clear Sky */}
        {weatherType === 'clear' && !isDaytime && (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="moon absolute top-1/4 right-1/4 w-20 h-20 bg-gray-200 rounded-full shadow-[0_0_40px_15px_rgba(255,255,255,0.2)]"></div>
            <div className="stars absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={`star-${i}`}
                  className="absolute bg-white rounded-full"
                  style={{
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.8 + 0.2,
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
        
        {/* Rain - Day/Night */}
        {weatherType === 'rain' && (
          <div className={`absolute inset-0 ${isDaytime ? 'bg-gradient-to-b from-gray-400 to-gray-600' : 'bg-gradient-to-b from-gray-800 to-gray-900'}`}>
            <div className="rain absolute w-full h-full">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={`rain-${i}`}
                  className="absolute w-0.5 h-8 opacity-70"
                  style={{
                    backgroundColor: isDaytime ? '#bfdbfe' : '#93c5fd',
                    left: `${Math.random() * 100}%`,
                    animation: `rain ${0.5 + Math.random() * 0.5}s linear infinite`,
                    animationDelay: `${Math.random() * 1}s`,
                    top: '-20%',
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
        
        {/* Clouds - Day/Night */}
        {weatherType === 'clouds' && (
          <div className={`absolute inset-0 ${isDaytime ? 'bg-gradient-to-b from-gray-200 to-gray-400' : 'bg-gradient-to-b from-gray-800 to-gray-900'}`}>
            <div className="clouds">
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              <div className="cloud cloud-3"></div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .sun {
          animation: pulse 4s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .rain {
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L62 20 L50 40 L38 20 Z' fill='%23ffffff' fill-opacity='0.5'/%3E%3C/svg%3E");
          background-size: 50px 50px;
          animation: rain 0.5s linear infinite;
        }
        
        @keyframes rain {
          to { background-position: 0 50px; }
        }
        
        .cloud {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 1000px;
          filter: blur(8px);
          opacity: 0.8;
        }
        
        .cloud-1 {
          width: 200px;
          height: 60px;
          top: 20%;
          left: 10%;
          animation: float 25s linear infinite;
        }
        
        .cloud-2 {
          width: 300px;
          height: 80px;
          top: 40%;
          right: 10%;
          animation: float 30s linear infinite reverse;
        }
        
        .cloud-3 {
          width: 250px;
          height: 70px;
          bottom: 30%;
          left: 20%;
          animation: float 35s linear infinite;
        }
        
        @keyframes float {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(calc(100vw + 100%)); }
        }
      `}</style>
    </div>
  );
};

const WeatherWidget = ({ darkMode }) => {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  
  // Use darkMode prop to determine if it's day or night
  // darkMode = true means night mode (moon), false means day mode (sun)
  const isDaytime = !darkMode;

  // Get weather type for styling
  const getWeatherType = () => {
    if (!weatherData) return 'clear';
    const main = weatherData.weather[0].main.toLowerCase();
    if (['rain', 'drizzle', 'thunderstorm'].includes(main)) return 'rain';
    if (['clouds', 'mist', 'haze', 'fog'].includes(main)) return 'clouds';
    return 'clear';
  };

  // Text and border colors based on darkMode
  const textColor = !darkMode ? 'text-black' : 'text-white';
  const borderColor = !darkMode ? 'border-black' : 'border-amber-300';
  const buttonBg = !darkMode ? 'bg-black hover:bg-gray-800' : 'bg-white/10 hover:bg-white/20';
  const buttonText = 'text-white';

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (!API_KEY) {
          throw new Error('مفتاح API غير موجود. يرجى إضافة NEXT_PUBLIC_OPENWEATHERMAP_API_KEY إلى ملف .env.local');
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `${BASE_URL}/weather?lat=${selectedCity.lat}&lon=${selectedCity.lon}&appid=${API_KEY}&units=metric&lang=ar`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'فشل في جلب بيانات الطقس');
        }
        
        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        console.error('Weather API Error:', err);
        setError(err.message || 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [selectedCity]);

  // Auto slide every 7 seconds
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CITIES.length);
    }, 7000);

    return () => clearInterval(slideInterval);
  }, []);

  // Update selected city when slide changes
  useEffect(() => {
    setSelectedCity(CITIES[currentSlide]);
  }, [currentSlide]);

  // Manual slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Slide animation effect
  useEffect(() => {
    setIsSliding(true);
    const timer = setTimeout(() => setIsSliding(false), 500);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  // Get weather icon URL with day/night variants
  const getWeatherIcon = (iconCode, isDaytime) => {
    // Replace 'n' with 'd' for day icons if it's daytime
    const adjustedIconCode = isDaytime ? iconCode.replace('n', 'd') : iconCode;
    return `https://openweathermap.org/img/wn/${adjustedIconCode}@4x.png`;
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl shadow-xl min-h-[400px] flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900">
        <WeatherBackground weatherType="clear" isDaytime={isDaytime} />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">جاري تحميل بيانات الطقس...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-6 min-h-[400px] flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">عذراً، حدث خطأ</h3>
          <p className="mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const weatherType = getWeatherType();
  
  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-xl min-h-[500px] transition-all duration-500 ${isSliding ? 'opacity-0' : 'opacity-100'}`}>
      <WeatherBackground weatherType={getWeatherType()} isDaytime={isDaytime} />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* City Indicators */}
        <div className="flex justify-center space-x-2 p-4">
          {CITIES.map((city, index) => (
            <button
              key={city.id}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? `w-8 ${isDaytime ? 'bg-amber-600' : 'bg-white'}` 
                  : `w-2 ${isDaytime ? 'bg-amber-600/50' : 'bg-white/50'} hover:${isDaytime ? 'bg-amber-600/70' : 'bg-white/70'}`
              }`}
              aria-label={`عرض طقس ${city.name}`}
            />
          ))}
        </div>

        {/* Main Weather Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className={`text-4xl font-bold mb-2 ${textColor} drop-shadow-lg`}>
            {weatherData.name}
          </h2>
          
          <p className={`${isDaytime ? 'text-black' : 'text-gray-200'} mb-8 text-lg`}>
            {new Date().toLocaleDateString('ar-PS', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          
          <div className="relative w-48 h-48 mb-6">
            <Image
              src={getWeatherIcon(weatherData.weather[0].icon, isDaytime)}
              alt={weatherData.weather[0].description}
              width={192}
              height={192}
              className="drop-shadow-lg"
            />
          </div>
          
          <div className={`text-7xl font-bold mb-2 ${textColor} drop-shadow-lg`}>
            {Math.round(weatherData.main.temp)}°
          </div>
          
          <div className={`text-2xl font-medium mb-8 capitalize ${!darkMode ? 'text-amber-700' : 'text-amber-300'} drop-shadow-lg`}>
            {weatherData.weather[0].description}
          </div>
          
          {/* More Details Button */}
          <Link 
            href="/weather" 
            className={`${buttonBg} ${buttonText} font-bold py-3 px-8 rounded-full border-2 ${borderColor} hover:border-opacity-70 transition-all duration-300 flex items-center space-x-2 space-x-reverse`}
          >
            <span>المزيد من التفاصيل</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
