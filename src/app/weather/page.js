'use client';

import { useState, useEffect, useContext } from 'react';
import { useColorMode } from '../nav/theme/ThemeProvider';
import axios from 'axios';
import { 
  WiDaySunny, WiRain, WiCloudy, WiDayCloudy, WiThunderstorm, 
  WiSnow, WiFog, WiDayHaze, WiNightClear, WiHumidity, 
  WiStrongWind, WiBarometer, WiSunrise, WiSunset 
} from 'react-icons/wi';
import { FiRefreshCw, FiDroplet, FiWind, FiThermometer, FiCompass, FiEye } from 'react-icons/fi';
import { BsDropletHalf, BsWind, BsThermometerHalf, BsEye, BsSunrise, BsSunset } from 'react-icons/bs';

// Palestinian governorates with their coordinates
const GOVERNORATES = [
  { id: 1, name: 'القدس', lat: 31.7683, lon: 35.2137 },
  { id: 2, name: 'رام الله', lat: 31.9074, lon: 35.1881 },
  { id: 3, name: 'نابلس', lat: 32.2226, lon: 35.2546 },
  { id: 4, name: 'الخليل', lat: 31.5326, lon: 35.0998 },
  { id: 5, name: 'بيت لحم', lat: 31.7054, lon: 35.2026 },
  { id: 6, name: 'أريحا', lat: 31.8572, lon: 35.4444 },
  { id: 7, name: 'طولكرم', lat: 32.3114, lon: 35.0270 },
  { id: 8, name: 'قلقيلية', lat: 32.1909, lon: 34.9706 },
  { id: 9, name: 'سلفيت', lat: 32.0853, lon: 35.1724 },
  { id: 10, name: 'جنين', lat: 32.4619, lon: 35.3020 },
  { id: 11, name: 'طوباس', lat: 32.3209, lon: 35.3699 },
  { id: 12, name: 'غزة', lat: 31.5016, lon: 34.4584 },
  { id: 13, name: 'بديا', lat: 32.0833, lon: 35.1500 },
  { id: 14, name: 'فرعون', lat: 32.3000, lon: 35.0333 },
  { id: 15, name: 'عكا', lat: 32.9333, lon: 35.0833 },
  { id: 16, name: 'حيفا', lat: 32.8192, lon: 34.9999 },
  { id: 17, name: 'يافا', lat: 32.0500, lon: 34.7500 },
];

// Cache to store weather data temporarily
const weatherCache = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes cache
};

// OpenWeatherMap API Key
const OPENWEATHER_API_KEY = 'eb5423add9f28d7d1485a07e3f6a9c56';

// إضافة رسالة تأكيد أن التطبيق يعمل الآن
console.log('تم تهيئة تطبيق الطقس مع مفتاح API');

// Function to fetch weather data from OpenWeatherMap API
const fetchWeatherForGovernorate = async (governorate) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${governorate.lat}&lon=${governorate.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ar`;
  console.log('جاري جلب بيانات الطقس لـ', governorate.name, 'من:', url);
  
  try {
    const response = await axios.get(url, { 
      timeout: 10000,
      validateStatus: (status) => status < 500
    });
    
    console.log('استجابة API لـ', governorate.name, ':', response.status, response.statusText);
    
    if (response.status === 401) {
      console.error('تفاصيل الخطأ 401:', {
        url,
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      throw new Error('مفتاح API غير صالح أو منتهي الصلاحية. يرجى التحقق من المفتاح في حساب OpenWeatherMap');
    }
    
    if (response.status !== 200) {
      throw new Error(`خطأ في استجابة الخادم: ${response.status} ${response.statusText}`);
    }
    
    // تحويل درجات الحرارة إلى أرقام صحيحة
    const temp = Math.round(response.data.main.temp);
    const feelsLike = Math.round(response.data.main.feels_like);
    
    return {
      ...response.data,
      main: {
        ...response.data.main,
        temp,
        feels_like: feelsLike,
        temp_min: Math.round(response.data.main.temp_min),
        temp_max: Math.round(response.data.main.temp_max),
      },
      weather: response.data.weather.map(w => ({
        ...w,
        description: translateWeatherDescription(w.description)
      }))
    };
  } catch (error) {
    console.error(`Error fetching weather for ${governorate.name}:`, error.message);
    throw new Error(`فشل في جلب بيانات الطقس لـ ${governorate.name}: ${error.message}`);
  }
};

// دالة مساعدة لترجمة أوصاف الطقس
const translateWeatherDescription = (description) => {
  const translations = {
    'clear sky': 'سماء صافية',
    'few clouds': 'قليل من السحب',
    'scattered clouds': 'سحب متفرقة',
    'broken clouds': 'سحب مكسرة',
    'shower rain': 'زخات مطر',
    'rain': 'مطر',
    'thunderstorm': 'عاصفة رعدية',
    'snow': 'ثلج',
    'mist': 'ضباب',
    'haze': 'ضباب خفيف',
    'fog': 'ضباب كثيف'
  };
  
  return translations[description] || description;
};

// Function to fetch all weather data
const fetchAllWeatherData = async () => {
  const now = Date.now();
  
  // إرجاع البيانات المخزنة مؤقتًا إذا كانت لا تزال حديثة
  if (weatherCache.data && (now - weatherCache.timestamp) < weatherCache.CACHE_DURATION) {
    return weatherCache.data;
  }
  
  try {
    const result = {};
    
    // جلب بيانات كل محافظة على حدة (OpenWeatherMap لا يدعم الطلب المجمع)
    for (const governorate of GOVERNORATES) {
      try {
        const data = await fetchWeatherForGovernorate(governorate);
        result[governorate.id] = data;
        
        // إضافة تأخير بسيط بين الطلبات لتجنب تجاوز حد المعدل
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to fetch data for ${governorate.name}`);
        // تخطي هذه المحافظة في حالة الخطأ
        continue;
      }
    }
    
    // تحديث ذاكرة التخزين المؤقت
    weatherCache.data = result;
    weatherCache.timestamp = now;
    
    return result;
    
  } catch (error) {
    console.error('Error in fetchAllWeatherData:', error);
    throw new Error('فشل في جلب بيانات الطقس. يرجى المحاولة مرة أخرى لاحقًا.');
  }
};

const WeatherCard = ({ governorate, weatherData, loading, mode = 'light', isDetailed = false }) => {
  const getWeatherIcon = (weatherId) => {
    const iconClass = "text-5xl text-yellow-500 drop-shadow-lg";
    if (weatherId >= 200 && weatherId < 300) return <WiThunderstorm className={iconClass} />;
    if (weatherId >= 300 && weatherId < 400) return <WiRain className={iconClass} />;
    if (weatherId >= 500 && weatherId < 600) return <WiRain className={iconClass} />;
    if (weatherId >= 600 && weatherId < 700) return <WiSnow className={`${iconClass} text-blue-100`} />;
    if (weatherId >= 700 && weatherId < 800) return <WiFog className={`${iconClass} text-gray-400`} />;
    if (weatherId === 800) return <WiDaySunny className={`${iconClass} text-yellow-400`} />;
    if (weatherId === 801) return <WiDayCloudy className={`${iconClass} text-yellow-400`} />;
    if (weatherId > 801) return <WiCloudy className={`${iconClass} text-gray-400`} />;
    return <WiDayHaze className={`${iconClass} text-yellow-300`} />;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit' });
  };

  // Compact view for grid items
  if (!isDetailed) {
    return (
      <div className={`h-full flex flex-col rounded-2xl p-5 transition-all duration-200 border-2 ${
        mode === 'dark' 
          ? 'bg-gray-900/95 border-gray-600 hover:border-amber-500 shadow-lg shadow-black/20' 
          : 'bg-white/90 border-amber-200 hover:border-amber-400 shadow-md hover:shadow-lg hover:shadow-amber-100/50'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-xl font-bold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {governorate.name}
            </h3>
            <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
              {new Date().toLocaleDateString('ar-PS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {weatherData?.weather?.[0]?.id && (
            <div className="text-4xl">
              {getWeatherIcon(weatherData.weather[0].id)}
            </div>
          )}
        </div>
        
        {/* Main Content */}
        {weatherData && !loading ? (
          <div className="flex-1 flex flex-col">
            {/* Temperature */}
            <div className="mt-2 mb-4">
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round(weatherData.main.temp)}°
                </span>
                <span className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-1`}>
                  {weatherData.weather[0].description}
                </span>
              </div>
              <div className={`text-sm ${mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} mt-1`}>
                تشعر بـ {Math.round(weatherData.main.feels_like)}°
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  mode === 'dark' ? 'bg-gray-800/70 border border-gray-700' : 'bg-white shadow-sm border border-amber-100'
                }`}>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <div className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>الرطوبة</div>
                  <div className="font-medium">{weatherData.main.humidity}%</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  mode === 'dark' ? 'bg-gray-800/70 border border-gray-700' : 'bg-white shadow-sm border border-amber-100'
                }`}>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0m0 0l-3 3m3-3l3 3m6.364 3.364l-3-3m0 0l-3 3m3-3l3-3" />
                  </svg>
                </div>
                <div>
                  <div className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>الرياح</div>
                  <div className="font-medium">{Math.round(weatherData.wind.speed * 3.6)} كم/س</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  mode === 'dark' ? 'bg-gray-800/70 border border-gray-700' : 'bg-white shadow-sm border border-amber-100'
                }`}>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>الشروق</div>
                  <div className="font-medium">{formatTime(weatherData.sys.sunrise).split(' ')[0]}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  mode === 'dark' ? 'bg-gray-800/70 border border-gray-700' : 'bg-white shadow-sm border border-amber-100'
                }`}>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <div className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>الضغط</div>
                  <div className="font-medium">{weatherData.main.pressure} هبا</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse space-y-3 mt-2">
            <div className="h-8 bg-amber-200/50 dark:bg-gray-700/80 rounded w-3/4"></div>
            <div className="h-4 bg-amber-200/50 dark:bg-gray-700/80 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-gray-800 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700/80 rounded w-3/4 mb-1.5"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700/80 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <div className={`${mode === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-xl p-6 shadow-lg border ${mode === 'dark' ? 'border-amber-900/30' : 'border-gray-100'} transition-all duration-300`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-bold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>{governorate.name}</h3>
        {weatherData && (
          <div className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {new Date(weatherData.dt * 1000).toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FiRefreshCw className="animate-spin text-2xl text-white" />
        </div>
      ) : weatherData ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <div className={`text-5xl font-bold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                {Math.round(weatherData.main.temp)}°
              </div>
              <div className={`${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} capitalize`}>
                {weatherData.weather[0].description}
              </div>
            </div>
            
            <div className={`w-24 h-24 rounded-full ${mode === 'dark' ? 'bg-gradient-to-br from-yellow-600 to-yellow-800' : 'bg-gradient-to-br from-yellow-400 to-yellow-600'} flex items-center justify-center shadow-lg shadow-yellow-500/20`}>
              <div className="text-white text-4xl">
                {getWeatherIcon(weatherData.weather[0].id)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className={`flex items-center p-3 rounded-lg ${mode === 'dark' ? 'bg-gray-800/50' : 'bg-amber-50'}`}>
              <div className={`p-2 rounded-full ${mode === 'dark' ? 'bg-amber-900/50' : 'bg-amber-100'} text-amber-500`}>
                <BsDropletHalf size={20} />
              </div>
              <div className="mr-3">
                <p className="text-sm text-yellow-500">الرطوبة</p>
                <p className="font-medium">{weatherData.main.humidity}%</p>
              </div>
            </div>
            
            <div className={`flex items-center p-3 rounded-lg ${mode === 'dark' ? 'bg-gray-800/50' : 'bg-amber-50'}`}>
              <div className={`p-2 rounded-full ${mode === 'dark' ? 'bg-amber-900/50' : 'bg-amber-100'} text-amber-500`}>
                <BsWind size={20} />
              </div>
              <div className="mr-3">
                <p className="text-sm text-yellow-500">سرعة الرياح</p>
                <p className="font-medium">{Math.round(weatherData.wind.speed * 3.6)} كم/س</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-400">
                <FiEye className="ml-2 text-green-400" />
                الرؤية
              </div>
              <span className="text-white">{weatherData.visibility / 1000} كم</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-800 text-center text-sm text-gray-500">
            آخر تحديث: {new Date(weatherData.dt * 1000).toLocaleTimeString('ar-PS')}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-red-400">فشل في تحميل البيانات</div>
      )}
    </div>
  );
};

export default function WeatherPage() {
  const { mode } = useColorMode();
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter cities based on search term
  const filteredCities = GOVERNORATES.filter(city => 
    city.name.includes(searchTerm) ||
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Auto-select city as user types
  useEffect(() => {
    if (searchTerm) {
      const matchedCity = GOVERNORATES.find(city => 
        city.name === searchTerm || 
        city.name.includes(searchTerm) ||
        city.name.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (matchedCity) {
        setSelectedCity(matchedCity.id);
        setShowDetailedView(true);
      }
    }
  }, [searchTerm, GOVERNORATES]);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // جلب بيانات الطقس الفعلية
      const weatherDataMap = await fetchAllWeatherData();
      
      setWeatherData(weatherDataMap);
      
      // تحديد المدينة الأولى إذا لم يتم تحديد مدينة
      if (!selectedCity) {
        setSelectedCity(GOVERNORATES[0].id);
      }
      
    } catch (error) {
    console.error('Error in fetchWeatherData:', error);
    let errorMessage = 'حدث خطأ غير معروف';
    
    if (error.message.includes('401')) {
      errorMessage = 'مفتاح API غير صالح. يرجى التحقق من المفتاح وتجديده إذا لزم الأمر.';
    } else if (error.message.includes('network')) {
      errorMessage = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
    } else if (error.response) {
      errorMessage = `خطأ من الخادم: ${error.response.status} ${error.response.statusText}`;
    } else {
      errorMessage = error.message || 'حدث خطأ غير معروف';
    }
    
    setError(`حدث خطأ أثناء جلب بيانات الطقس: ${errorMessage}`);
    console.error('تفاصيل الخطأ:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Refresh data every 30 minutes
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCityClick = (cityId, e) => {
    e.preventDefault();
    setSelectedCity(cityId);
    setShowDetailedView(true);
    
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${mode === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
              <h1 className={`text-3xl md:text-4xl font-bold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>حالة الطقس في فلسطين</h1>
              <p className={mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}>آخر تحديث: {new Date().toLocaleString('ar-PS')}</p>
          
          <button 
            onClick={fetchWeatherData}
            disabled={loading}
            className={`mt-4 px-6 py-2 ${mode === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'} rounded-lg transition-all flex items-center mx-auto disabled:opacity-50 shadow-md`}
          >
            <FiRefreshCw className={`ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
          
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
        
        {/* City Search */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن مدينة..."
              className={`w-full px-4 py-3 pr-12 rounded-full border ${
                mode === 'dark' 
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          

        </div>
        
        {showDetailedView && selectedCity && (
          <div className="w-full mb-8">
            <div className="relative">
              <WeatherCard 
                governorate={GOVERNORATES.find(g => g.id === selectedCity)} 
                weatherData={weatherData[selectedCity]} 
                loading={loading} 
                mode={mode} 
                isDetailed={true} 
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailedView(false);
                }}
                className="absolute top-4 left-4 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors"
                aria-label="إغلاق العرض المفصل"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 w-full">
          {GOVERNORATES.map((governorate) => (
            <div 
              key={governorate.id} 
              onClick={(e) => handleCityClick(governorate.id, e)}
              className={`cursor-pointer transition-transform duration-200 hover:scale-[1.02] ${
                selectedCity === governorate.id && showDetailedView ? 'opacity-50 hover:opacity-75' : ''
              }`}
            >
              <WeatherCard 
                governorate={governorate} 
                weatherData={weatherData[governorate.id]} 
                loading={loading} 
                mode={mode} 
                isDetailed={false}
              />
            </div>
          ))}
        </div>
        
        <div className={`mt-12 text-center text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <p></p>
          <p className="mt-2"> {new Date().getFullYear()} - بوابة البلاد</p>
        </div>
      </div>
    </div>
  );
}
