// ai/serviceHandler.js

// قائمة المدن الفلسطينية المدعومة
const PALESTINIAN_GOVERNORATES = [
    'نابلس', 'رام الله', 'الخليل', 'بيت لحم', 'أريحا',
    'طولكرم', 'قلقيلية', 'سلفيت', 'طوباس', 'جنين',
    'القدس', 'غزة', 'خان يونس', 'رفح', 'دير البلح',
    'بيت حانون', 'بيت لاهيا', 'جباليا', 'المغازي', 'خانيونس'
  ];
  
  // أنواع الخدمات المتاحة
  const SERVICE_TYPES = {
    // متاجر
    STORE: ['متجر', 'متاجر', 'محل', 'محلات', 'سوبرماركت', 'سوبر ماركت', 'بقالة', 'بقالات', 'متجر', 'مركز تسوق'],
  
    // عقارات
    REAL_ESTATE: ['عقار', 'عقارات', 'شقة', 'شقق', 'فيلا', 'منزل', 'بيت', 'بيوت', 'إيجار', 'تمليك', 'عمارة', 'شقة للايجار', 'شقة للبيع'],
  
    // أراضي
    LAND: ['أرض', 'أراضي', 'قطعة أرض', 'أرض للبيع', 'أرض زراعية', 'أرض سكنية', 'أرض تجارية'],
  
    // سيارات
    CAR: ['سيارة', 'سيارات', 'مركبة', 'مركبات', 'تأجير سيارات', 'بيع سيارات', 'معرض سيارات', 'سيارة مستعملة'],
  
    // مطاعم
    RESTAURANT: ['مطعم', 'مطاعم', 'مأكولات', 'وجبة', 'مشويات', 'وجبات', 'كافيه', 'مشروبات', 'مطعم شعبي', 'مطعم فاخر'],
  
    // فرص عمل
    JOB: ['وظيفة', 'وظائف', 'فرصة عمل', 'فرص عمل', 'توظيف', 'مطلوب موظفين', 'شواغر', 'وظيفة شاغرة'],
  
    // دورات دراسية
    COURSES: ['دورة', 'دورات', 'كورس', 'كورسات', 'تدريب', 'تدريبية', 'تعليمية', 'دورة تدريبية', 'دورات تعليمية'],
  
    // مستشفيات
    HOSPITAL: ['مستشفى', 'مستشفيات', 'مستشفى خاص', 'مستشفى حكومي', 'مستوصف', 'مركز طبي', 'عيادة'],
  
    // عيادات طبية
    CLINIC: ['عيادة', 'عيادات', 'طبيب', 'دكتور', 'عيادة طبية', 'عيادة أسنان', 'عيادة جلدية', 'عيادة عيون'],
  
    // أماكن ترفيهية
    ENTERTAINMENT: ['ترفيه', 'أماكن ترفيهية', 'منتزه', 'منتزهات', 'ملاهي', 'مدينة ألعاب', 'سنيما', 'سينما', 'مسرح'],
  
    // فنادق
    HOTEL: ['فندق', 'فنادق', 'منتجع', 'منتجعات', 'سكن', 'غرفة فندقية', 'حجز فندق'],
  
    // صيدليات
    PHARMACY: ['صيدلية', 'صيدليات', 'صيدلانية', 'أدوية', 'دواء', 'صيدلية مفتوحة', 'صيدلية طوارئ', 'صيدلية ليلية'],
  
    // محطات وقود
    GAS_STATION: ['محطة وقود', 'بنزين', 'بنزينة', 'محطة بنزين', 'تعبئة وقود', 'غاز', 'محطة غاز'],
  
    // مراكز تجارية
    MALL: ['مول', 'مركز تجاري', 'سوق', 'أسواق', 'مجمع تجاري', 'مراكز تسوق', 'مركز تسوق'],
  
    // صالات أفراح
    WEDDING_HALL: ['صالة أفراح', 'صالات أفراح', 'قاعة أفراح', 'قاعات أفراح', 'حفلة زفاف', 'زفاف', 'عقد قران'],
  
    // خدمات توصيل
    DELIVERY: ['توصيل', 'خدمة توصيل', 'دليفري', 'توصيل طلبات', 'توصيل طعام', 'توصيل مشتريات'],
  
    // مجوهرات وذهب
    JEWELRY: ['ذهب', 'مجوهرات', 'مشغولات ذهبية', 'ساعات', 'خواتم', 'أساور', 'قلائد', 'حلي', 'مصوغات'],
  
    // ملابس وأزياء
    FASHION: ['ملابس', 'أزياء', 'موضة', 'ملابس نسائية', 'ملابس رجالية', 'ملابس أطفال', 'فساتين', 'بدل', 'جينز'],
  
    // هدايا وتحف
    GIFTS: ['هدية', 'هدايا', 'تحفة', 'تحف', 'هدايا تذكارية', 'تحف فنية', 'هدايا فاخرة'],
  
    // مراكز تجميل
    BEAUTY: ['تجميل', 'مركز تجميل', 'صالون تجميل', 'عناية بالبشرة', 'عناية بالشعر', 'مكياج', 'مانيكير', 'باديكير'],
  
    // صالات رياضية
    GYM: ['جيم', 'صالة رياضية', 'نادي رياضي', 'لياقة بدنية', 'كمال أجسام', 'تمارين', 'تدريب رياضي'],
  
    // مكتبات وكتب
    BOOKSTORE: ['مكتبة', 'مكتبات', 'كتاب', 'كتب', 'مكتبة لبيع الكتب', 'مكتبة عامة', 'كتب مستعملة', 'روايات'],
  
    // عام
    GENERAL: ['خدمات', 'خدمة', 'بحث عن خدمات', 'أريد خدمة', 'عاوز خدمة', 'مطلوب', 'أبحث عن', 'أين أجد']
  };
  
  // ربط الأنواع بمعرفات API
  const SERVICE_TO_API_TYPE = {
    // الصيغة: 'نوع الخدمة': { type: 'نوع_الخدمة', category: 'التصنيف' }
    STORE: { type: 'commercial', category: 'stores' },
    RESTAURANT: { type: 'food', category: 'restaurants' },
    REAL_ESTATE: { type: 'real-estate', category: 'real-estate' },
    LAND: { type: 'real-estate', category: 'lands' },
    CAR: { type: 'vehicles', category: 'cars' },
    RESTAURANT: { type: 'commercial', category: 'restaurants' },
    JOB: { type: 'other', category: 'jobs' },
    COURSES: { type: 'education', category: 'courses' },
    HOSPITAL: { type: 'health', category: 'hospitals' },
    CLINIC: { type: 'health', category: 'clinics' },
    ENTERTAINMENT: { type: 'other', category: 'entertainment' },
    HOTEL: { type: 'real-estate', category: 'hotels' },
    PHARMACY: { type: 'commercial', category: 'pharmacies' },
    GAS_STATION: { type: 'vehicles', category: 'gas-stations' },
    MALL: { type: 'commercial', category: 'malls' },
    WEDDING_HALL: { type: 'real-estate', category: 'wedding-halls' },
    DELIVERY: { type: 'vehicles', category: 'delivery' },
    JEWELRY: { type: 'commercial', category: 'jewelry' },
    FASHION: { type: 'commercial', category: 'fashion' },
    GIFTS: { type: 'other', category: 'gifts' },
    BEAUTY: { type: 'health', category: 'beauty-centers' },
    GYM: { type: 'health', category: 'gyms' },
    BOOKSTORE: { type: 'education', category: 'libraries' },
    GENERAL: {}
  };
  
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
  
  // تحديد نوع الخدمة من النص
  function detectServiceType(text) {
    if (!text) return null;
    
    // تنظيف النص من التشكيل والرموز
    const cleanText = removeTashkeel(text);
    
    // البحث عن نوع الخدمة المناسب
    for (const [type, keywords] of Object.entries(SERVICE_TYPES)) {
      const hasKeyword = keywords.some(keyword => 
        cleanText.includes(removeTashkeel(keyword)) || 
        text.includes(keyword) ||
        cleanText.includes(keyword)
      );
      
      if (hasKeyword) {
        // معالجة خاصة للعقارات والأراضي
        if (type === 'LAND' && (cleanText.includes('عقار') || cleanText.includes('شقة') || cleanText.includes('منزل'))) {
          continue; // نتخطى إذا كان السؤال عن عقار وليس أرض
        }
        return type;
      }
    }
    
    // إذا لم يتم العثور على نوع خدمة محدد، نتحقق من الكلمات العامة
    const generalKeywords = ['متجر', 'محل', 'سوق', 'بقالة', 'سوبرماركت'];
    if (generalKeywords.some(keyword => cleanText.includes(keyword) || text.includes(keyword))) {
      return 'STORE';
    }
    
    return null;
  }
  
  // جلب الخدمات من API
  async function fetchServices(city, serviceType) {
    try {
      let url = `/api/posts`;
      const params = new URLSearchParams();
    
      // إضافة المحافظة إذا كانت متوفرة
      if (city) {
        // تحويل اسم المدينة إلى التنسيق المتوقع في قاعدة البيانات
        const governorateMap = {
          'رام الله': 'رام الله والبيرة',
          'رام الله والبيرة': 'رام الله والبيرة',
          'القدس': 'القدس',
          'نابلس': 'نابلس',
          'الخليل': 'الخليل',
          'حبرون': 'الخليل',
          'الخليل - حبرون': 'الخليل',
          'بيت لحم': 'بيت لحم',
          'أريحا': 'أريحا',
          'طولكرم': 'طولكرم',
          'طول كرم': 'طولكرم',
          'قلقيلية': 'قلقيلية',
          'قلقيليه': 'قلقيلية',
          'سلفيت': 'سلفيت',
          'طوباس': 'طوباس',
          'جنين': 'جنين',
          'غزة': 'غزة',
          'غزة المدينة': 'غزة',
          'خان يونس': 'خان يونس',
          'خان يونس': 'خان يونس',
          'رفح': 'رفح',
          'رفح - رفح': 'رفح',
          'دير البلح': 'دير البلح',
          'دير البلح - دير البلح': 'دير البلح'
        };
        
        const normalizedCity = city.trim();
        const governorate = governorateMap[normalizedCity] || normalizedCity;
        params.append('governorate', governorate);
      }
    
      // الحصول على معلومات نوع الخدمة
      const apiConfig = SERVICE_TO_API_TYPE[serviceType] || {};
      console.log('Service Type:', serviceType, 'API Config:', apiConfig);
      
      // إضافة معلمات نوع الخدمة إذا كانت متوفرة
      if (apiConfig.type) {
        params.append('type', apiConfig.type);
        
        // إضافة التصنيف إذا كان متوفراً
        if (apiConfig.category) {
          params.append('category', apiConfig.category);
        }
        
        // إضافة النوع الفرعي إذا كان متوفراً
        if (apiConfig.subType) {
          params.append('subType', apiConfig.subType);
        }
      }
    
      // إضافة طابع زمني لمنع التخزين المؤقت
      params.append('_t', Date.now());
      
      // بناء رابط الطلب النهائي
      const fullUrl = `${url}?${params.toString()}`;
      console.log('Fetching services from:', fullUrl);
      
      // إرسال الطلب إلى الخادم
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
      
      console.log('Response status:', res.status);
      
      // التحقق من نجاح الطلب
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error(`فشل في جلب البيانات: ${res.status} ${res.statusText}`);
      }
      
      // تحليل الاستجابة
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('خطأ في معالجة استجابة الخادم');
      }
      
      console.log('API Response:', data);
      
      // التأكد من أننا نرجع مصفوفة
      if (!data) {
        console.warn('No data returned from API');
        return [];
      }
      
      // إذا كانت البيانات كائن وليست مصفوفة، نحولها إلى مصفوفة
      const resultArray = Array.isArray(data) ? data : [data];
      
      // تصفية النتائج الفارغة
      return resultArray.filter(item => item && (item.title || item.name));
      
    } catch (error) {
      console.error('Error in fetchServices:', error);
      throw error;
    }
  }
  
  // المعالج الرئيسي للأسئلة المتعلقة بالخدمات
  async function handleServiceQuestion(text) {
    try {
      console.log('Processing service question:', text);
      
      const city = detectCity(text)?.trim();
      const serviceType = detectServiceType(text);
      
      console.log('Detected city:', city, 'service type:', serviceType);
      
      if (!serviceType) {
        return 'عذراً، لم أفهم نوع الخدمة التي تبحث عنها. يمكنك تجربة: "أريد صيدلية في رام الله" أو "عندك محلات إلكترونيات؟"';
      }
      
      // إظهار رسالة أن البحث جارٍ
      const serviceName = SERVICE_TYPES[serviceType]?.[0] || 'خدمات';
      let loadingMessage = `🔍 أبحث عن ${serviceName}`;
      if (city) loadingMessage += ` في ${city}`;
      loadingMessage += '...';
      
      console.log('Loading message:', loadingMessage);
      
      try {
        // جلب البيانات من الخادم
        const services = await fetchServices(city, serviceType);
        console.log('Fetched services:', services);
        
        // التحقق من وجود نتائج
        if (!services || services.length === 0) {
          let noResults = `⚠️ عذراً، لم أتمكن من العثور على ${serviceName}`;
          if (city) noResults += ` في ${city}`;
          noResults += '\n\n';
          noResults += 'يمكنك تجربة:';
          noResults += '\n- التأكد من صحة اسم المدينة';
          noResults += '\n- تجربة كلمات بحث أخرى';
          noResults += '\n- البحث في مدينة أخرى';
          return noResults;
        }
        
        // بناء الرد
        const citySuffix = city ? ` في ${city}` : '';
        let reply = `✅ وجدت ${services.length} ${serviceName}${services.length > 1 ? 'ات' : 'ة'}${citySuffix}:\n\n`;
        
        // إضافة كل خدمة مع تفاصيلها
        services.slice(0, 10).forEach((service, index) => {
          reply += `📍 ${index + 1}. ${service.title || 'خدمة بدون عنوان'}`;
          if (service.city && !city) reply += ` - ${service.city}`;
          if (service.address) reply += `\n   ${service.address}`;
          if (service.phone) reply += `\n   ☎️ ${service.phone}`;
          if (service.working_hours) reply += `\n   ⏰ ${service.working_hours}`;
          reply += '\n\n';
        });
        
        // إضافة ملاحظة إذا كان هناك المزيد من النتائج
        if (services.length > 10) {
          reply += `و ${services.length - 10} نتيجة أخرى...\n\n`;
        }
        
        // إضافة نصائح للمستخدم
        reply += '💡 يمكنك:';
        reply += '\n- طلب المزيد من التفاصيل عن أي خدمة بكتابة رقمها';
        if (city) {
          reply += `\n- البحث في مدن أخرى بكتابة "${serviceName} في [اسم المدينة]"`;
        }
        reply += '\n- طلب المساعدة بكتابة "مساعدة"';
        
        return reply;
        
      } catch (error) {
        console.error('API Error in handleServiceQuestion:', error);
        
        let errorMessage = '❌ عذراً، حدث خطأ أثناء محاولة جلب البيانات.';
        errorMessage += '\n\nالرجاء المحاولة مرة أخرى بعد قليل.';
        
        // إضافة معلومات إضافية للمساعدة في تشخيص المشكلة
        if (error.message.includes('فشل في جلب البيانات')) {
          errorMessage += '\n\nقد يكون هناك مشكلة في الاتصال بالخادم.';
        }
        
        return errorMessage;
      }
      
    } catch (error) {
      console.error('Unexpected error in handleServiceQuestion:', error);
      return '❌ عذراً، حدث خطأ غير متوقع. يرجى إبلاغ الدعم الفني بالمشكلة.';
    }
  }
  
  // دالة للتحقق مما إذا كان السؤال عن الخدمات
  function isServiceQuestion(text) {
    if (!text || typeof text !== 'string') return false;
    
    // تنظيف النص من التشكيل والرموز
    const cleanText = removeTashkeel(text);
    
    // الكلمات المفتاحية العامة للخدمات
    const generalServiceKeywords = ['اريد', 'عايز', 'بدي', 'عندك', 'عندكم', 'بسألك عن', 'عن', 'في'];
    
    // جميع كلمات الخدمات
    const allServiceKeywords = Object.values(SERVICE_TYPES).flat();
    
    // التحقق من وجود كلمات خدمية في النص
    const hasServiceKeyword = allServiceKeywords.some(keyword => 
      cleanText.includes(keyword) || text.includes(keyword)
    );
    
    // التحقق من وجود كلمات عامة للخدمات
    const hasGeneralServiceWord = generalServiceKeywords.some(keyword =>
      cleanText.includes(keyword) || text.includes(keyword)
    );
    
    // التحقق من وجود مدينة في النص (اختياري)
    const hasCity = PALESTINIAN_GOVERNORATES.some(city => 
      cleanText.includes(city) || text.includes(city) ||
      cleanText.includes(removeTashkeel(city))
    );
    
    // إذا كان النص يحتوي على كلمة خدمة ومدينة، أو كلمة خدمة وكلمة عامة
    return hasServiceKeyword || (hasServiceKeyword && hasCity) || 
           (hasServiceKeyword && hasGeneralServiceWord);
  }

  export {
    handleServiceQuestion,
    isServiceQuestion
  };
  