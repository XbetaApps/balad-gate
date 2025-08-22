// ai/serviceHandler.js

// قائمة المدن الفلسطينية المدعومة
const PALESTINIAN_GOVERNORATES = [
    'نابلس', 'رام الله', 'الخليل', 'بيت لحم', 'أريحا',
    'طولكرم', 'قلقيلية', 'سلفيت', 'طوباس', 'جنين',
    'القدس', 'غزة', 'خان يونس', 'رفح', 'دير البلح',
    'بيت حانون', 'بيت لاهيا', 'جباليا', 'المغازي', 'خانيونس'
  ];
  
  // كلمات مفتاحية للتصنيفات -> slug في API
  const CATEGORY_KEYWORDS = {
    // متاجر ومحلات
    'متجر': 'commercial-stores',
    'متاجر': 'commercial-stores',
    'محل': 'commercial-stores',
    'محلات': 'commercial-stores',
    // صيدليات
    'صيدلية': 'pharmacies',
    'صيدليات': 'pharmacies',
    // مطاعم
    'مطعم': 'restaurants',
    'مطاعم': 'restaurants',
    // فنادق
    'فندق': 'hotels',
    'فنادق': 'hotels',
    // سيارات
    'سيارة': 'cars',
    'سيارات': 'cars',
    // عقارات
    'عقار': 'real-estate',
    'عقارات': 'real-estate',
    // أراضي
    'ارض': 'lands',
    'أرض': 'lands',
    'اراضي': 'lands',
    'أراضي': 'lands',
    // وظائف
    'وظيفة': 'jobs',                //
    'وظائف': 'jobs',
    'عمل': 'jobs',
    // ذهب ومجوهرات
    'ذهب': 'jewelry',               ///
    'مجوهرات': 'jewelry',
    // مراكز تجارية
    'مول': 'malls',
    'مولات': 'malls',
    'مركز تجاري': 'malls',
    'مراكز تجارية': 'malls',
    // مستشفيات وعيادات وصحة
    'مستشفى': 'hospitals',
    'مستشفيات': 'hospitals',
    'عيادة': 'clinics',
    'عيادات': 'clinics',
    'صحة': 'health',
    // صالونات تجميل
    'تجميل': 'beauty',
    'صالون': 'beauty',
    'صالونات': 'beauty',
    // وقود
    'محطة وقود': 'fuel',
    'محطات وقود': 'fuel',
    'بنزين': 'fuel',
    // توصيل
    'توصيل': 'transport',                   //
    'خدمات توصيل': 'transport',
    // رياضة
    'نادي رياضي': 'sports',                //
    'صالات رياضية': 'sports',
    'نوادي رياضية': 'sports',
    'جيم': 'sports',
    'رياضة': 'sports',
    // كتب
    'مكتبة': 'books',                       //
    'مكتبات': 'books',
    'كتب': 'books',
    // هدايا
    'هدية': 'gifts',                        //
    'هدايا': 'gifts',
    // ترفيه
    'ترفيه': 'entertainment',               //
    // صالات أفراح
    'صالة أفراح': 'wedding-halls',
    'صالات أفراح': 'wedding-halls'
  };

  // عكس الخريطة لعرض اسم التصنيف من الslug
  const SLUG_TO_NAME = {
    'commercial-stores': 'متاجر',
    'pharmacies': 'صيدليات',
    'jewelry': 'مجوهرات وذهب',
    'malls': 'مراكز تجارية',
    'restaurants': 'مطاعم',
    'hotels': 'فنادق',
    'cars': 'سيارات',
    'real-estate': 'عقارات',
    'lands': 'أراضي',
    'jobs': 'فرص عمل',
    'clothing': 'ملابس وأزياء',
    'education': 'دورات دراسية',
    'hospitals': 'مستشفيات',
    'clinics': 'عيادات طبية',
    'entertainment': 'أماكن ترفيهية',
    'wedding-halls': 'صالات افراح',
    'transport': 'خدمات توصيل',
    'fuel': 'محطات وقود',
    'sports': 'صالات رياضية',
    'books': 'مكتبات وكتب',
    'gifts': 'هدايا وتحف',
    'beauty': 'مراكز تجميل',
    'health': 'صحة'
  };

  // إزالة التشكيل من النص
  function removeTashkeel(str) {
    return str.replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/g, '');
  }

  // مطابقة كلمات/عبارات كاملة وليس أجزاء من كلمات (يدعم العربية)
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function containsKeyword(text, keyword) {
    if (!text || !keyword) return false;
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(keyword)}(?=($|[^\\p{L}\\p{N}]))`, 'u');
    return pattern.test(text);
  }

  // كلمات مفتاحية لأسئلة العملات كي لا تُعامل كخدمات
  const CURRENCY_KEYWORDS = [
    'عملة', 'عملات', 'سعر الصرف', 'اسعار الصرف', 'صرف', 'تحويل',
    'دولار', 'شيكل', 'دينار', 'يورو', 'جنيه', 'ريال',
    'اسعار العملات', 'سعر الدولار', 'exchange', 'currency', 'usd', 'ils', 'eur'
  ].map(removeTashkeel);
  
  // تحديد المدينة من النص
  function detectCity(text) {
    return PALESTINIAN_GOVERNORATES.find(city =>
      text.includes(city) || text.includes(removeTashkeel(city))
    ) || '';
  }
  
  // تحديد التصنيف من النص (يعيد slug)
  function detectCategory(text) {
    if (!text) return '';
    const normalized = removeTashkeel(text);
    // ابحث عن أطول كلمة مفتاحية تطابقاً لتفادي الالتباس
    const entries = Object.entries(CATEGORY_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
    for (const [keyword, slug] of entries) {
      if (containsKeyword(normalized, keyword) && !CURRENCY_KEYWORDS.includes(keyword)) return slug;
    }
    return '';
  }

  // جلب البيانات من API مع إمكانية تحديد التصنيف والمدينة
  async function fetchServices({ city, category }) {
    try {
      let url = `/api/posts`;
      const params = new URLSearchParams();
  
      if (city) {
        // خريطة المدينة -> مرادفات المحافظة المحتملة في قاعدة البيانات
        const governorateMap = {
          'رام الله': ['رام الله', 'رام الله والبيرة'],
          'رام الله والبيرة': ['رام الله', 'رام الله والبيرة'],
          'القدس': ['القدس'],
          'نابلس': ['نابلس'],
          'الخليل': ['الخليل'],
          'بيت لحم': ['بيت لحم'],
          'أريحا': ['أريحا'],
          'طولكرم': ['طولكرم'],
          'قلقيلية': ['قلقيلية'],
          'سلفيت': ['سلفيت'],
          'طوباس': ['طوباس'],
          'جنين': ['جنين'],
          'غزة': ['غزة', 'مدينة غزة'],
          'خان يونس': ['خان يونس', 'خانيونس'],
          'رفح': ['رفح'],
          // في بعض قواعد البيانات تُسجل دير البلح ضمن الوسطى
          'دير البلح': ['دير البلح', 'الوسطى', 'المنطقة الوسطى']
        };
        const normalizedCity = city.trim();
        const candidates = governorateMap[normalizedCity] || [normalizedCity];
        // Send all candidates as repeated params so the backend uses ANY()
        for (const g of candidates) params.append('governorate', g);
      }

      if (category) {
        params.append('category', category);
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
      console.error('Error in fetchServices:', error);
      throw error;
    }
  }
  
  // المعالج الرئيسي لعرض كل شيء موجود
  async function handleAllServicesQuestion(text) {
    try {
      console.log('Processing question:', text);
      const city = detectCity(text)?.trim();
      const category = detectCategory(text)?.trim();
      console.log('Detected city:', city);
      console.log('Detected category:', category);
  
      const services = await fetchServices({ city, category });
  
      if (!services || services.length === 0) {
        return `⚠️ عذراً، لم يتم العثور على أي بيانات${category ? ` ضمن ${SLUG_TO_NAME[category] || 'التصنيف المطلوب'}` : ''}${city ? ` في ${city}` : ''}.`;
      }
  
      let reply = `🔍 *نتائج البحث${category ? ` عن ${SLUG_TO_NAME[category] || 'الخدمات'}` : ' عن الخدمات'}${city ? ` في ${city}` : ''}*\n`;
      reply += `📊 العدد الإجمالي: ${services.length} عنصر\n\n`;
      
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
    const normalized = removeTashkeel(text);
    // لا تعتبر أسئلة العملات كخدمات حتى لو ذُكرت مدينة
    if (CURRENCY_KEYWORDS.some((kw) => containsKeyword(normalized, kw))) return false;
    return PALESTINIAN_GOVERNORATES.some(city => text.includes(city));
  }
  
  // Check if the message is a service question
  function isServiceQuestion(text) {
    const normalized = removeTashkeel(text || '');

    // استثناء أسئلة العملات حتى لا تُعامل كخدمات
    if (CURRENCY_KEYWORDS.some((kw) => containsKeyword(normalized, kw))) return false;

    // كلمات عامة للخدمات
    const serviceKeywords = ['خدمة', 'خدمات', 'طلب خدمة', 'اريد خدمة', 'عاوز خدمة'];
    if (serviceKeywords.some((kw) => containsKeyword(text, kw) || containsKeyword(normalized, kw))) return true;

    // أي كلمة تصنيف معروفة تعتبر سؤال خدمة
    return Object.keys(CATEGORY_KEYWORDS).some((kw) =>
      containsKeyword(normalized, kw) || containsKeyword(text, kw)
    );
  }

  // Handle service questions
  async function handleServiceQuestion(text) {
    try {
      // Extract city name from the text
      const city = detectCity(text);
      const category = detectCategory(text);
      
      if (!city) {
        // If no city is mentioned, ask the user to specify a city
        return 'من فضلك، حدد المدينة التي تريد البحث فيها. مثال: "متاجر نابلس" أو "صيدليات طولكرم" أو "خدمات الخليل"';
      }
      
      // Get services for the specified city (مع تصنيف إن وجد)
      const queryText = `${category ? (SLUG_TO_NAME[category] || 'خدمات') : 'خدمات'} ${city}`;
      return await handleAllServicesQuestion(queryText);
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
  