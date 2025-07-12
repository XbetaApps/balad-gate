'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { WiDaySunny, WiRain, WiCloudy, WiDayCloudy, WiThunderstorm, WiSnow, WiFog, WiDayHaze } from 'react-icons/wi';
import { FiRefreshCw, FiDroplet, FiWind, FiThermometer, FiCompass, FiEye } from 'react-icons/fi';

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
  { id: 13, name: 'خان يونس', lat: 31.3465, lon: 34.3062 },
  { id: 14, name: 'رفح', lat: 31.2969, lon: 34.2439 },
  { id: 15, name: 'دير البلح', lat: 31.4187, lon: 34.3493 },
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

const WeatherCard = ({ governorate, weatherData, loading }) => {
  const getWeatherIcon = (weatherId) => {
    if (weatherId >= 200 && weatherId < 300) return <WiThunderstorm className="text-4xl text-yellow-500" />;
    if (weatherId >= 300 && weatherId < 400) return <WiRain className="text-4xl text-blue-400" />;
    if (weatherId >= 500 && weatherId < 600) return <WiRain className="text-4xl text-blue-400" />;
    if (weatherId >= 600 && weatherId < 700) return <WiSnow className="text-4xl text-blue-200" />;
    if (weatherId >= 700 && weatherId < 800) return <WiFog className="text-4xl text-gray-300" />;
    if (weatherId === 800) return <WiDaySunny className="text-4xl text-yellow-400" />;
    if (weatherId > 800) return <WiCloudy className="text-4xl text-gray-300" />;
    return <WiDayHaze className="text-4xl text-gray-400" />;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 hover:border-gray-700 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">{governorate.name}</h3>
        {weatherData && (
          <div className="text-gray-400 text-sm">
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
              <div className="text-5xl font-bold text-white mb-1">
                {Math.round(weatherData.main.temp)}°
              </div>
              <div className="text-gray-400 capitalize">
                {weatherData.weather[0].description}
              </div>
            </div>
            
            <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center">
              <div className="text-white text-4xl">
                {getWeatherIcon(weatherData.weather[0].id)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-400">
                <FiDroplet className="ml-2 text-blue-400" />
                الرطوبة
              </div>
              <span className="text-white">{weatherData.main.humidity}%</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-400">
                <FiWind className="ml-2 text-blue-400" />
                سرعة الرياح
              </div>
              <span className="text-white">{Math.round(weatherData.wind.speed * 3.6)} كم/س</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-400">
                <FiThermometer className="ml-2 text-red-400" />
                تشعر به
              </div>
              <span className="text-white">{Math.round(weatherData.main.feels_like)}°</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-400">
                <FiCompass className="ml-2 text-purple-400" />
                الضغط الجوي
              </div>
              <span className="text-white">{weatherData.main.pressure} هيكتوباسكال</span>
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
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

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

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">حالة الطقس في فلسطين</h1>
          <p className="text-gray-400">آخر تحديث: {new Date().toLocaleString('ar-PS')}</p>
          
          <button 
            onClick={fetchWeatherData}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center mx-auto"
          >
            <FiRefreshCw className={`ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
          
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
        
        {/* City Selector */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex space-x-2 rtl:space-x-reverse">
            {GOVERNORATES.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCity === city.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {selectedCity ? (
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
              <WeatherCard
                governorate={GOVERNORATES.find(c => c.id === selectedCity)}
                weatherData={weatherData[selectedCity]}
                loading={loading}
              />
            </div>
          ) : null}
          
          {GOVERNORATES.map((governorate) => (
            <div key={governorate.id} className="hidden xl:block">
              <WeatherCard
                governorate={governorate}
                weatherData={weatherData[governorate.id]}
                loading={loading && !weatherData[governorate.id]}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>بيانات الطقس مقدمة من OpenWeatherMap</p>
          <p className="mt-2">© {new Date().getFullYear()} - بوابة البلاد</p>
        </div>
      </div>
    </div>
  );
}
