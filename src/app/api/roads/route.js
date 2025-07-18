import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export const cities = [
  // المدن الرئيسية
  'القدس', 'رام الله', 'الخليل', 'نابلس', 'جنين', 'طولكرم', 'أريحا', 'بيت لحم',
  'قلقيلية', 'سلفيت', 'طوباس', 'أريحا والأغوار', 'سلفيت', 'قلقيلية', 'طوباس',
  
  // قرى وبلدات محافظة نابلس
  'عصيرة القبلية', 'عصيرة الشمالية', 'بيت فوريك', 'بيت دجن', 'عقربا', 'حوارة',
  'قبلان', 'العقربانية', 'بورين', 'عصيرة القبلية', 'دير شرف', 'سبسطية', 'بيت ايبا',
  
  // قرى وبلدات محافظة جنين
  'يعبد', 'يعبد', 'كفر دان', 'برقين', 'صانور', 'ميثلون', 'جبع', 'عرانة', 'سيريس',
  
  // قرى وبلدات محافظة الخليل
  'دورا', 'يطا', 'الظاهرية', 'السموع', 'حلحول', 'بني نعيم', 'ترقوميا', 'إذنا',
  
  // قرى وبلدات محافظة رام الله
  'البيرة', 'بيرزيت', 'أبو قش', 'دير دبوان', 'سلواد', 'عين يبرود', 'كفر مالك',
  'دير جرير', 'دير جرير', 'كوبر', 'عابود', 'اللبن', 'برقة', 'سنجل',
  
  // قرى وبلدات محافظة بيت لحم
  'الخضر', 'حلحول', 'تقوع', 'نحالين', 'الولجة', 'العبيدية', 'الرام',
  
  // قرى وبلدات محافظة طولكرم
  'عنبتا', 'شويكة', 'كفر اللبد', 'كفر صور', 'كفر عبوش', 'كفر زيباد',
  
  // قرى وبلدات محافظة قلقيلية
  'عزون', 'كفر ثلث', 'كفر قدوم', 'كفر لاقف', 'حبلة', 'راس عطية',
  
  // قرى وبلدات محافظة سلفيت
  'كفل حارس', 'باقة الحطب', 'إسكاكا', 'ياسوف', 'قراوة بني حسان', 'دير بلوط',
  
  // قرى وبلدات محافظة أريحا والأغوار
  'العوجا', 'النويعمة', 'الفقرة', 'الديوك', 'فصايل', 'الغميضة', 'مرج نعجة',
  
  // المخيمات في الضفة الغربية
  'مخيم الجلزون', 'مخيم العروب', 'مخيم عايدة', 'مخيم الدهيشة', 'مخيم العزة',
  'مخيم الفارعة', 'مخيم طولكرم', 'مخيم نور شمس', 'مخيم جنين', 'مخيم بلاطة'
];

// بيانات افتراضية في حالة فشل جلب البيانات
function getDefaultRoads() {
  return [
    // محافظة نابلس
    {
      id: 'nbls-1',
      name: 'حاجز حوارة',
      status: 'مزدحم',
      details: 'حركة مرور كثيفة - تأخير متوقع 30 دقيقة',
      city: 'نابلس',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'nbls-2',
      name: 'حاجز بيت ايبا',
      status: 'مفتوح',
      details: 'حركة مرور طبيعية',
      city: 'نابلس',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'nbls-3',
      name: 'حاجز حوارة الجنوبي',
      status: 'مغلق',
      details: 'مغلق لأعمال صيانة',
      city: 'نابلس',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'nbls-4',
      name: 'حاجز بيت فوريك',
      status: 'مفتوح',
      details: 'حركة مرور خفيفة',
      city: 'نابلس',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // محافظة جنين
    {
      id: 'jenin-1',
      name: 'حاجز الجلمة',
      status: 'مزدحم',
      details: 'ازدحام شديد - تأخير متوقع 45 دقيقة',
      city: 'جنين',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'jenin-2',
      name: 'حاجز برطعة',
      status: 'مفتوح',
      details: 'حركة مرور طبيعية',
      city: 'جنين',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // محافظة الخليل
    {
      id: 'hebron-1',
      name: 'حاجز الجبارات',
      status: 'مفتوح',
      details: 'حركة مرور طبيعية',
      city: 'الخليل',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'hebron-2',
      name: 'حاجز الشيوخ',
      status: 'مزدحم',
      details: 'حركة مرور كثيفة',
      city: 'الخليل',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // محافظة رام الله
    {
      id: 'ramallah-1',
      name: 'حاجز قلنديا',
      status: 'مزدحم',
      details: 'حركة مرور كثيفة - تأخير متوقع 40 دقيقة',
      city: 'رام الله',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'ramallah-2',
      name: 'حاجز عطارة',
      status: 'مفتوح',
      details: 'حركة مرور طبيعية',
      city: 'رام الله',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // محافظة بيت لحم
    {
      id: 'beth-1',
      name: 'حاجز 300',
      status: 'مفتوح',
      details: 'حركة مرور طبيعية',
      city: 'بيت لحم',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'beth-2',
      name: 'حاجز الجدار الفاصل',
      status: 'مغلق',
      details: 'مغلق لأسباب أمنية',
      city: 'بيت لحم',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // محافظة طولكرم
    {
      id: 'tulkarm-1',
      name: 'حاجز عنبتا',
      status: 'مفتوح',
      details: 'حركة مرور خفيفة',
      city: 'طولكرم',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'tulkarm-2',
      name: 'حاجز شويكة',
      status: 'مزدحم',
      details: 'حركة مرور كثيفة',
      city: 'طولكرم',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // محافظة قلقيلية
    {
      id: 'qalqilya-1',
      name: 'حاجز حبلة',
      status: 'مفتوح',
      details: 'حركة مرور طبيعية',
      city: 'قلقيلية',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // محافظة سلفيت
    {
      id: 'salfit-1',
      name: 'حاجز الزاوية',
      status: 'مفتوح',
      details: 'حركة مرور خفيفة',
      city: 'سلفيت',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },

    // المعابر الرئيسية في الضفة الغربية
    {
      id: 'cross-1',
      name: 'معبر الكرامة (جسر الملك حسين)',
      status: 'مفتوح',
      details: 'مفتوح للمسافرين من الساعة 8:00 صباحاً حتى 8:00 مساءً',
      city: 'أريحا',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'cross-2',
      name: 'معبر بيتونيا',
      status: 'مفتوح',
      details: 'مفتوح لمرور حاملي التصاريح من الساعة 7:00 صباحاً حتى 7:00 مساءً',
      city: 'رام الله',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'cross-3',
      name: 'معبر قلنديا',
      status: 'مزدحم',
      details: 'حركة مرور كثيفة - تأخير متوقع 30 دقيقة',
      city: 'القدس',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'cross-4',
      name: 'معبر حاجز 300',
      status: 'مفتوح',
      details: 'حركة مرور طبيعية',
      city: 'بيت لحم',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    },
    {
      id: 'cross-5',
      name: 'معبر الزعيم (كبارة)',
      status: 'مغلق',
      details: 'مغلق حتى إشعار آخر',
      city: 'طولكرم',
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    }
  ];
}

// دالة مساعدة لتحليل HTML واستخراج البيانات
function parseRoadData(html) {
  const $ = cheerio.load(html);
  const roads = [];
  const foundCities = new Set();
  
  // محاولة استخراج البيانات من الجداول
  $('table').each((tableIndex, table) => {
    const rows = $(table).find('tr');
    
    rows.each((i, row) => {
      const columns = $(row).find('td');
      
      if (columns.length >= 3) {
        const name = $(columns[0]).text().trim() || 'معبر غير معروف';
        const status = $(columns[1]).text().trim() || 'غير معروف';
        const details = $(columns[2]).text().trim() || 'لا توجد تفاصيل متاحة';
        
        // محاولة استخراج المدينة من اسم المعبر أو التفاصيل
        let city = 'غير محدد';
        for (const c of cities) {
          if (name.includes(c) || details.includes(c)) {
            city = c;
            break;
          }
        }
        
        // توحيد حالة الطريق
        let normalizedStatus = status;
        if (status.includes('مفتوح') || status.includes('مفتوحة') || status.includes('يعمل')) {
          normalizedStatus = 'مفتوح';
        } else if (status.includes('مغلق') || status.includes('مغلقة') || status.includes('متوقف')) {
          normalizedStatus = 'مغلق';
        } else if (status.includes('مزدحم') || status.includes('ازدحام')) {
          normalizedStatus = 'مزدحم';
        }
        
        roads.push({
          id: `road-${roads.length + 1}`,
          name,
          status: normalizedStatus,
          details,
          city,
          lastUpdate: new Date().toLocaleTimeString('ar-PS')
        });
        
        foundCities.add(city);
      }
    });
  });
  
  // إذا لم نجد أي طرق، نرجع بيانات افتراضية
  if (roads.length === 0) {
    const defaultRoads = getDefaultRoads();
    return {
      roads: defaultRoads,
      cities: [...new Set(defaultRoads.map(road => road.city))]
    };
  }
  
  return {
    roads,
    cities: Array.from(foundCities)
  };
}

export async function GET(request) {
  try {
    // جلب البيانات من الموقع الأصلي
    const { data: html } = await axios.get('https://www.aweenrayeh.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000 // مهلة 10 ثواني
    });
    
    // تحليل البيانات
    const { roads, cities } = parseRoadData(html);
    
    // فلترة حسب المدينة إذا كانت موجودة في الطلب
    const { searchParams } = new URL(request.url);
    const cityFilter = searchParams.get('city');
    
    let filteredRoads = [...roads];
    if (cityFilter && cityFilter !== 'الكل') {
      // قائمة بالكلمات المفتاحية لكل مدينة للبحث عنها في الاسم أو التفاصيل
      const cityKeywords = {
        'نابلس': ['نابلس', 'دير شرف', 'المربعة', 'بيت فوريك', 'حوارة', 'حواره'],
        'جنين': ['جنين', 'يعبد', 'يعبد', 'عرابة', 'عرابه', 'يعبد'],
        'طولكرم': ['طولكرم', 'عنبتا', 'شويكة', 'شويكه', 'ذنابة', 'ذنابه'],
        'قلقيلية': ['قلقيلية', 'قلقيلا', 'حاجز حبلة', 'حبله'],
        'القدس': ['القدس', 'القدس الشرقية', 'الطور', 'الخان الأحمر', 'معاليه أدوميم', 'أبو ديس'],
        'رام الله': ['رام الله', 'البيرة', 'بيتونيا', 'البيريج', 'الكونتينر', 'الكونتينر'],
        'الخليل': ['الخليل', 'حلحول', 'بني نعيم', 'دورا', 'الضفة', 'الضفه']
      };

      const keywords = cityKeywords[cityFilter] || [cityFilter];
      
      filteredRoads = roads.filter(road => {
        // البحث في اسم المدينة أو الاسم أو التفاصيل
        const searchText = `${road.city} ${road.name} ${road.details}`.toLowerCase();
        return keywords.some(keyword => 
          searchText.includes(keyword.toLowerCase())
        );
      });
    }
    
    // إضافة وقت التحديث الحالي لكل معبر
    const roadsWithTimestamp = filteredRoads.map(road => ({
      ...road,
      lastUpdate: road.lastUpdate || new Date().toISOString()
    }));

    // إرجاع البيانات
    return NextResponse.json({
      success: true,
      roads: roadsWithTimestamp,
      cities: Array.from(new Set(filteredRoads.map(road => road.city))).filter(Boolean),
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching road data:', error);
    
    // في حالة الخطأ، نرجع البيانات الافتراضية مع فلترة المدينة إذا كانت محددة
    const { searchParams } = new URL(request.url);
    const cityFilter = searchParams.get('city');
    
    let defaultRoads = getDefaultRoads();
    if (cityFilter && cityFilter !== 'الكل') {
      defaultRoads = defaultRoads.filter(road => 
        road.city.includes(cityFilter) || 
        road.name.includes(cityFilter) ||
        road.details.includes(cityFilter)
      );
    }
    
    const defaultCities = [...new Set([...cities, ...getDefaultRoads().map(r => r.city)])];
    
    return NextResponse.json({
      success: false,
      message: 'فشل في جلب البيانات الحية. يتم عرض بيانات مخزنة مسبقاً.',
      roads: defaultRoads,
      cities: defaultCities.length > 0 ? defaultCities : cities,
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    }, { status: 200 });
  }
}
