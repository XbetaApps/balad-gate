// قائمة بمدن فلسطين وإحداثياتها
const PALESTINIAN_CITIES = {
  'القدس': { lat: 31.7683, lon: 35.2137 },
  'رام الله': { lat: 31.9074, lon: 35.1880 },
  'نابلس': { lat: 32.2222, lon: 35.2541 },
  'الخليل': { lat: 31.5297, lon: 35.0938 },
  'بديا': { lat: 32.0833, lon: 35.1500 },

  'أريحا': { lat: 31.8573, lon: 35.4444 },
  'بيت لحم': { lat: 31.7054, lon: 35.2026 },
  'جنين': { lat: 32.4606, lon: 35.3020 },
  'قلقيلية': { lat: 32.1923, lon: 34.9772 },
  'طولكرم': { lat: 32.3119, lon: 35.0269 },
  'سلفيت': { lat: 32.0861, lon: 35.1722 },
  'طوباس': { lat: 32.3242, lon: 35.4222 },
  'أريحا': { lat: 31.8573, lon: 35.4444 },
  'غزة': { lat: 31.5016, lon: 34.4584 },
  'رفح': { lat: 31.2969, lon: 34.2436 },
  'خان يونس': { lat: 31.3467, lon: 34.3022 },
  'دير البلح': { lat: 31.4178, lon: 34.3489 },
  'بيت لاهيا': { lat: 31.5536, lon: 34.5022 },
  'بيت حانون': { lat: 31.5400, lon: 34.5369 },
  'جباليا': { lat: 31.5347, lon: 34.4958 },
  'المغازي': { lat: 31.4236, lon: 34.3842 }
};

// دالة للحصول على حالة الطقس لمدينة فلسطينية
async function getWeatherForCity(cityName) {
  try {
    const city = PALESTINIAN_CITIES[cityName];
    if (!city) {
      throw new Error('المدينة غير معروفة في قاعدة البيانات');
    }

    // استخدام API الطقس المفتوحة مع مفتاح جديد
    const API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // مفتاح API جديد
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric&lang=ar`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('تفاصيل خطأ API الطقس:', errorData);
      throw new Error('فشل في الحصول على بيانات الطقس');
    }

    const data = await response.json();
    return formatWeatherData(data, cityName);
  } catch (error) {
    console.error('خطأ في الحصول على بيانات الطقس:', error);
    throw new Error(`لا يمكن الحصول على بيانات الطقس حاليًا: ${error.message}`);
  }
}

// تنسيق بيانات الطقس
function formatWeatherData(data, cityName) {
  const weather = data.weather[0];
  const main = data.main;
  const wind = data.wind;

  return {
    city: cityName,
    temperature: Math.round(main.temp),
    feels_like: Math.round(main.feels_like),
    humidity: main.humidity,
    description: weather.description,
    wind_speed: wind.speed,
    icon: `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
  };
}

// دالة للتحقق مما إذا كان السؤال يتعلق بالطقس
function isWeatherQuestion(message) {
  // قائمة بكلمات مفتاحية للطقس
  const weatherKeywords = [
    'الطقس', 'الجو', 'درجة الحرارة', 'الرطوبة', 'الرياح',
    'طقس', 'حالة الجو', 'الطقس اليوم', 'الجو اليوم',
    'كيف الجو', 'كيف الطقس', 'ما هي درجة الحرارة', 'ما درجة الحرارة',
    'كيف الجو في', 'كيف الطقس في', 'ما هي درجة الحرارة في', 'ما درجة الحرارة في',
    'شو الجو', 'شو الطقس', 'شو درجة الحرارة',
    'بدي اعرف الجو', 'بدي اعرف الطقس', 'عايز اعرف الجو', 'عايز اعرف الطقس',
    'شو وضع الجو', 'شو وضع الطقس', 'كيف الجو النه', 'كيف الطقس النه'
  ];

  // تحويل الرسالة إلى حروف صغيرة لتسهيل البحث
  const lowerMessage = message.toLowerCase();
  
  // التحقق من وجود كلمات الطقس في الرسالة
  const hasWeatherKeyword = weatherKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  // البحث عن اسم المدينة المذكورة
  const cityNames = Object.keys(PALESTINIAN_CITIES);
  let mentionedCity = null;
  
  // البحث عن المدينة في الرسالة
  for (const city of cityNames) {
    if (lowerMessage.includes(city.toLowerCase())) {
      mentionedCity = city;
      break;
    }
  }

  // إذا كانت الرسالة تحتوي على كلمات الطقس أو كانت مجرد اسم مدينة
  const isWeatherQuery = hasWeatherKeyword || 
                        cityNames.some(city => message.trim() === city);

  return {
    isWeatherQuery,
    city: mentionedCity,
    isGeneralQuery: hasWeatherKeyword && !mentionedCity
  };
}

export { getWeatherForCity, isWeatherQuestion, PALESTINIAN_CITIES };