// ai/serviceHandler.js

// قائمة المدن الفلسطينية المدعومة
const PALESTINIAN_GOVERNORATES = [
    'نابلس', 'رام الله', 'الخليل', 'بيت لحم', 'أريحا',
    'طولكرم', 'قلقيلية', 'سلفيت', 'طوباس', 'جنين',
    'القدس', 'غزة', 'خان يونس', 'رفح', 'دير البلح',
    'بيت حانون', 'بيت لاهيا', 'جباليا', 'المغازي', 'خانيونس'
  ];
  
  // إزالة التشكيل من النص
  function removeTashkeel(str) {
    return str.replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/g, '');
  }
  
  // تحديد المدينة من النص
  function detectCity(text) {
    return PALESTINIAN_GOVERNORATES.find(city =>
      text.includes(city) || text.includes(removeTashkeel(city))
    ) || '';
  }
  
  // جلب البيانات من API بدون تصنيف محدد
  async function fetchAllServices(city) {
    try {
      let url = `/api/posts`;
      const params = new URLSearchParams();
  
      if (city) {
        const governorateMap = {
          'رام الله': 'رام الله والبيرة',
          'رام الله والبيرة': 'رام الله والبيرة',
          'القدس': 'القدس',
          'نابلس': 'نابلس',
          'الخليل': 'الخليل',
          'بيت لحم': 'بيت لحم',
          'أريحا': 'أريحا',
          'طولكرم': 'طولكرم',
          'قلقيلية': 'قلقيلية',
          'سلفيت': 'سلفيت',
          'طوباس': 'طوباس',
          'جنين': 'جنين',
          'غزة': 'غزة',
          'خان يونس': 'خان يونس',
          'رفح': 'رفح',
          'دير البلح': 'دير البلح'
        };
        const normalizedCity = city.trim();
        const governorate = governorateMap[normalizedCity] || normalizedCity;
        params.append('governorate', governorate);
      }
  
      // إضافة طابع زمني لمنع التخزين المؤقت
      params.append('_t', Date.now());
  
      const fullUrl = `${url}?${params.toString()}`;
      console.log('Fetching services from:', fullUrl);
  
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`فشل في جلب البيانات: ${res.status} ${res.statusText} - ${errorText}`);
      }
  
      const data = await res.json();
      const resultArray = Array.isArray(data.items) ? data.items : [];
      return resultArray.filter(item => item && (item.title || item.name));
  
    } catch (error) {
      console.error('Error in fetchAllServices:', error);
      throw error;
    }
  }
  
  // المعالج الرئيسي لعرض كل شيء موجود
  async function handleAllServicesQuestion(text) {
    try {
      console.log('Processing question:', text);
      const city = detectCity(text)?.trim();
      console.log('Detected city:', city);
  
      const services = await fetchAllServices(city);
  
      if (!services || services.length === 0) {
        return `⚠️ عذراً، لم يتم العثور على أي بيانات${city ? ` في ${city}` : ''}.`;
      }
  
      let reply = `🔍 *نتائج البحث عن الخدمات${city ? ` في ${city}` : ''}*\n`;
      reply += `📊 العدد الإجمالي: ${services.length} خدمة\n\n`;
      
      services.slice(0, 20).forEach((service, index) => {
        reply += `━━━━━━━━━━━━━━━━━━\n`;
        reply += `🔹 *${index + 1}. ${service.title || service.name || 'خدمة بدون عنوان'}*\n\n`;
        
        // الموقع والمدينة
        if (service.governorate || service.address) {
          reply += `📍 *الموقع:*\n`;
          if (service.governorate) reply += `   🏙️ ${service.governorate}\n`;
          if (service.address) reply += `   🏠 ${service.address}\n`;
          reply += '\n';
        }
        
        // الوصف
        if (service.description) {
          reply += `📝 *الوصف:*\n${service.description}\n\n`;
        }
        
        // معلومات الاتصال والسعر
        reply += `📌 *معلومات إضافية:*\n`;
        if (service.phone) reply += `   ☎️ ${service.phone}\n`;
        if (service.price) reply += `   💰 *السعر:* ${service.price}\n`;
        if (service.working_hours) reply += `   ⏰ *ساعات العمل:* ${service.working_hours}\n`;
        if (service.website) reply += `   🌐 ${service.website}\n`;
        
        reply += '\n';
      });
  
      if (services.length > 20) {
        reply += `🔹 *و ${services.length - 20} خدمة إضافية...*`;
      }
  
      return reply;
  
    } catch (error) {
      console.error('Unexpected error in handleAllServicesQuestion:', error);
      return '❌ حدث خطأ أثناء محاولة جلب البيانات. يرجى المحاولة مرة أخرى لاحقاً.';
    }
  }
  
  // دالة للتحقق من وجود كلمة مدينة أو خدمة عامة
  function isAllServicesQuestion(text) {
    if (!text || typeof text !== 'string') return false;
    return PALESTINIAN_GOVERNORATES.some(city => text.includes(city));
  }
  
  // Check if the message is a service question
  function isServiceQuestion(text) {
    // Check for service-related keywords in Arabic
    const serviceKeywords = ['خدمة', 'خدمات', 'طلب خدمة', 'اريد خدمة', 'عاوز خدمة', 'خدمات'];
    return serviceKeywords.some(keyword => text.includes(keyword));
  }

  // Handle service questions
  async function handleServiceQuestion(text) {
    try {
      // Extract city name from the text
      const city = detectCity(text);
      
      if (!city) {
        // If no city is mentioned, ask the user to specify a city
        return 'من فضلك، حدد المدينة التي تريد معرفة خدماتها. مثال: "خدمات نابلس" أو "عاوز خدمات الخليل"';
      }
      
      // Get services for the specified city
      return await handleAllServicesQuestion(`خدمات ${city}`);
    } catch (error) {
      console.error('Error handling service question:', error);
      return 'عذراً، حدث خطأ أثناء معالجة طلب الخدمة. يرجى المحاولة مرة أخرى لاحقاً.';
    }
  }

  // Export all the necessary functions
  export {
    handleAllServicesQuestion,
    isAllServicesQuestion,
    isServiceQuestion,
    handleServiceQuestion
  };
  