'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../nav/theme/ThemeProvider';

const FaSpinner = dynamic(() => import('react-icons/fa').then(mod => mod.FaSpinner), { ssr: false });
const FaSearch = dynamic(() => import('react-icons/fa').then(mod => mod.FaSearch), { ssr: false });

const rssFeeds = {
  all: [
    // --- مصادر عامة (عربية ودولية) ---
    'https://www.aljazeera.net/xml/rss/all.xml', // الجزيرة - كل الأخبار
    'https://www.bbc.com/arabic/index.xml', // BBC عربي - رئيسية
    'https://www.skynewsarabia.com/rss', // سكاي نيوز عربية - رئيسية
    'https://arabic.rt.com/rss/', // RT عربي - رئيسية
    'https://www.alarabiya.net/feed', // العربية - رئيسية
    'https://www.albawaba.com/ar/feed', // البوابة نيوز
    'https://www.alquds.co.uk/feed/', // القدس العربي
    'https://www.almasryalyoum.com/rss/rssfeeder', // المصري اليوم
    'https://www.youm7.com/rss/SectionRss', // اليوم السابع
    'https://www.annahar.com/ar/rss.php', // النهار العربي
    'https://www.alaraby.co.uk/rss.xml', // العربي الجديد
    'https://www.alhurra.com/ar/api/RSS', // الحرة عربي
    'https://rss.dw.com/rdf/rss-ar-all', // DW عربية
    'https://www.shorouknews.com/rss.aspx', // الشروق المصرية
    'https://www.akhbarak.net/rss', // أخبارك
  ],

  palestine: [
    // --- فلسطين ---
    'https://www.aljazeera.net/xml/rss/palestine.xml', // الجزيرة - فلسطين
    'https://www.alquds.co.uk/feed/', // القدس العربي
    'https://www.wafa.ps/feed.aspx?lang=ar', // وكالة وفا الرسمية
    'https://www.shehabnews.com/feed', // شهاب نيوز
    'https://www.maannews.net/rss', // معا نيوز
    'https://www.raya.ps/feed/', // ريا نيوز
    'https://www.qudsnet.com/feed', // قدس نت
    'https://www.palinfo.com/rss', // وكالة فلسطين الآن
  ],

  sports: [

    'https://shooot.com/shoootrss/main/',
    'https://shooot.com/shoootrss/saudi-football/',
    'https://shooot.com/shoootrss/saudi-league/',
    'https://shooot.com/shoootrss/king-cup/',
    'https://shooot.com/shoootrss/qatar-stars-league/',
    'https://shooot.com/shoootrss/egyptian-league/',
    'https://shooot.com/shoootrss/egypt-super-cup/',
    'https://shooot.com/shoootrss/egypt-league-cup/',
    'https://shooot.com/shoootrss/moroccan-league/',
    'https://shooot.com/shoootrss/algerian-league/',
    'https://shooot.com/shoootrss/tunisian-league/',
    'https://shooot.com/shoootrss/caf-champions-league/',
    'https://shooot.com/shoootrss/world-football/',
    'https://shooot.com/shoootrss/european-football/',
    'https://shooot.com/shoootrss/premier-league/',
    'https://shooot.com/shoootrss/la-liga/',
    'https://shooot.com/shoootrss/serie-a/',
    'https://shooot.com/shoootrss/bundesliga/',
    'https://shooot.com/shoootrss/ligue-1/',
    'https://shooot.com/shoootrss/champions-league/',
    'https://shooot.com/shoootrss/europa-league/',
    'https://shooot.com/shoootrss/nations-league/',
    'https://shooot.com/shoootrss/transfers/',
    'https://shooot.com/shoootrss/friendly-matches/',
    'https://shooot.com/shoootrss/other-sports/',

    'https://www.aljazeera.net/xml/rss/sports', // الجزيرة الرياضية
    'https://www.kooora.com/rss.aspx', // كووورة - رئيسية
    'https://www.filgoal.com/home/rss', // في الجول
    'https://www.yallakora.com/rss', // يلاكورة
    'https://www.alarabiya.net/ar/sport/rss', // العربية الرياضية
    'https://www.kooora.com/?rss=1&team=real-madrid', // أخبار ريال مدريد - كووورة
    'https://www.kooora.com/?rss=1&team=barcelona', // أخبار برشلونة - كووورة
    'https://www.filgoal.com/rss/real-madrid', // ريال مدريد - في الجول
    'https://www.filgoal.com/rss/barcelona', // برشلونة - في الجول
    'https://www.yallakora.com/rss/spanish', // الدوري الإسباني - يلاكورة
    'https://www.kooora.com/?rss=1&team=al-ahly', // الأهلي المصري
    'https://www.kooora.com/?rss=1&team=al-hilal', // الهلال السعودي
    'https://www.filgoal.com/rss/egyptian', // الدوري المصري - في الجول
    'https://www.yallakora.com/rss/saudi', // الدوري السعودي - يلاكورة
    'https://www.youtube.com/feeds/videos.xml?channel_id=UC5m6-7b0VH6PpZw4QoJYb5A', // كووورة
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCvJqCW8Z3lX0KpKIk7Q5h5A', // يلاكورة
    'https://www.youtube.com/feeds/videos.xml?channel_id=UC5m6-7b0VH6PpZw4QoJYb5A', // FilGoal
    'https://www.aljazeera.net/xml/rss/sports', // الجزيرة سبورت
    'https://www.alarabiya.net/ar/sport/rss', // العربية رياضة
    'https://www.skynewsarabia.com/rss/section/رياضة', // سكاي نيوز عربية
    'https://www.albayan.ae/sports/rss.xml', // البيان الرياضي
    'https://www.kooora.com/?rss=1&cat=europe', // أخبار أوروبا - كووورة
    'https://www.yallakora.com/rss/european', // البطولات الأوروبية - يلاكورة
    'https://www.alarabiya.net/ar/sport/champions-league/rss', // دوري الأبطال - العربية
    'https://www.goal.com/ar/feed', // جول (أخبار كرة قدم عالمية)
    'https://www.espn.com/arabic/rss/news', // إي إس بي إن عربي
    'https://www.skysports.com/rss/12040', // سكاي سبورتس (أخبار بالعربية)
    'https://www.fifa.com/ar/rss', // فيفا الرسمي (عربي)
    'https://www.uefa.com/rssfeed/newsrss=ar.xml', // يويفا (أخبار دوري أبطال أوروبا)
    'https://www.kooora.com/?rss=1', // كووورة (أخبار عربية وعالمية)
    'https://www.aljazeera.net/xml/rss/sports.xml', // الجزيرة رياضة


    'https://www.fcbarcelona.com/en/rss', // الموقع الرسمي (إنجليزي)
    'https://www.sport-english.com/en/feeds/rss/football/barcelona/', // صحيفة سبورت
    'https://www.mundodeportivo.com/feed/rss/futbol/fc-barcelona', // Mundo Deportivo
    'https://www.kooora.com/?rss=1&team=barcelona', // كووورة (عربي)
    'https://www.filgoal.com/rss/barcelona' ,

    'https://www.realmadrid.com/en/rss/rss_en.xml', // الموقع الرسمي (إنجليزي)
    'https://www.marca.com/en/football/real-madrid/rss.xml', // ماركا
    'https://as.com/rss/tags/real_madrid.xml', // AS
    'https://www.kooora.com/?rss=1&team=real-madrid', // كووورة (عربي)
    'https://www.filgoal.com/rss/real-madrid' // في الجول (عربي)
    

  ],

  health: [


  
      // مصادر حكومية فلسطينية
        'https://www.moh.gov.ps/feed/', // وزارة الصحة الفلسطينية (رسمي)
        'https://www.wafa.ps/Feed.aspx?catid=7&lang=ar', // وكالة وفا - قسم الصحة
        'https://www.palestinehosp.org/ar/rss', // اتحاد المستشفيات الفلسطينية
     
    
      // مستشفيات ومراكز طبية رئيسية
    
        'https://www.alkhalil-hospital.ps/ar/rss', // مستشفى الخليل الحكومي
        'https://www.shifa.ps/ar/rss', // مستشفى الشفاء (غزة)
        'https://www.augusta-hospital.com/ar/rss' ,// مستشفى أوغستا (القدس)
    
    
      // منظمات صحية دولية تعمل في فلسطين
     
        'https://www.unrwa.org/ar/rss/health', // الأونروا - خدمات الصحة
        'https://www.who.int/ar/countries/pse/rss.xml', // منظمة الصحة العالمية - فلسطين
        'https://www.msf.org/ar/rss/palestine' ,// أطباء بلا حدود
     
    
      // مواقع طبية فلسطينية متخصصة
   
        'https://www.palmed.ps/ar/rss', // شبكة الطب الفلسطيني
        'https://www.doctors.ps/ar/rss', // اتحاد الأطباء الفلسطينيين
        'https://www.pharmacy.ps/ar/rss', // نقابة الصيادلة الفلسطينيين
      
      // أخبار صحية من مصادر إخبارية فلسطينية
     
        'https://www.maannews.net/rss/health', // معا نيوز - صحة
        'https://www.samanews.ps/feed/?cat=health', // سما نيوز - صحة
        'https://www.raya.ps/feed/?cat=health' ,// ريا نيوز - صحة
    
      // صحة نفسية ودعم نفسي
   
        'https://www.gcmhp.net/ar/rss', // برنامج غزة للصحة النفسية
        'https://www.trauma.ps/ar/rss', // المركز الفلسطيني للإرشاد
 

    // --- صحة ---
    'https://www.aljazeera.net/xml/rss/health.xml', // الجزيرة - صحة
    'https://www.altibbi.com/rss/news', // الطبي
    'https://www.webteb.com/rss', // ويب طب
    'https://www.arabmedicine.com/rss', // طب عربي
    'https://www.dailymedicalinfo.com/rss', // ديلي ميديكال
    
    'https://www.who.int/ar/news-room/feeds/rss', // WHO - أخبار رسمية
    'https://www.bbc.com/arabic/science/rss.xml', // BBC علوم وصحة
    'https://www.webmd.com/rss/default.aspx', // WebMD
    'https://www.mayoclinic.org/ar/rss', // mayo clinic
    'https://www.nih.gov/news-events/news-releases/rss', // NIH
    'https://www.mayoclinic.org/ar/rss', // Mayo Clinic
    'https://www.clevelandclinic.org/ar/rss', // Cleveland Clinic
    'https://www.hopkinsmedicine.org/ar/rss', // Johns Hopkins Medicine
    'https://www.aljazeera.net/xml/rss/health', // الجزيرة - صحة
    'https://www.altibbi.com/rss/news', // الطبي
    'https://www.webteb.com/rss', // ويب طب
    'https://www.dailymedicalinfo.com/rss', // ديلي ميديكال

    'https://www.nimh.nih.gov/news/rss.shtml', // الصحة العقلية
    'https://www.psychiatry.org/newsroom/rss' ,

     'https://www.womenshealth.gov/feed', // صحة المرأة
    'https://www.healthychildren.org/English/rss/Pages/default.aspx',

    'https://www.eatright.org/rss', // أكاديمية التغذية
    'https://www.nutrition.gov/rss', // التغذية الحكومية
    'https://www.bodybuilding.com/fun/rss.xml',

    'https://www.webmd.com/rss/default.aspx', // WebMD
    'https://www.medicalnewstoday.com/rss', // Medical News Today
    'https://www.healthline.com/rss',


    'https://www.nejm.org/rss', // مجلة نيو إنجلاند الطبية
    'https://www.thelancet.com/rssfeed/lancet.xml', // ذا لانسيت
    'https://jamanetwork.com/rss/site_1.xml', // JAMA
    'https://www.nature.com/ar.rss', //

    'https://www.who.int/ar/news-room/feeds/rss', // منظمة الصحة العالمية
    'https://www.cdc.gov/arabic/rss.xml', // مراكز مكافحة الأمراض
    'https://www.nih.gov/news-events/news-releases/rss', // المعاهد الصحية الأمريكية
    'https://www.bbc.com/arabic/science/rss.xml', // BBC علوم وصحة

  ],

  technology: [

    'https://arabic.cnet.com/rss/',
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCiIhoHKPMHm0tpga58IBQNQ', // MKBHD (مراجعات)
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ', // Marques Brownlee
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCVYamHliCI9rw1tHR1xbkfw', // Mrwhosetheboss
    'https://arabic.cnet.com/rss/', // سي نت عربي
    'https://www.tech-wd.com/wd/feed/', // تك إند جيك
    'https://aitnews.com/feed/', // آي تي نيوز
    'https://www.albayan.ae/technology/rss.xml', // البيان - تكنولوجيا
    'https://www.gsmarena.com/rss-news-reviews.php3', // GSMArena (أشهر موقع للأجهزة)
    'https://www.theverge.com/rss/phones/index.xml', // The Verge - هواتف
    'https://www.xda-developers.com/feed/', // XDA Developers (تطبيقات وهاكات)
    'https://www.androidpolice.com/feed/', // Android Police (أخبار أندرويد)
    'https://www.pocket-lint.com/phones/rss', // Pocket-lint
  
    'https://news.samsung.com/global/feed', // الموقع الرسمي لسامسونج
    'https://www.sammobile.com/feed/', // SamMobile (مصدر موثوق)
    'https://www.androidcentral.com/feed', // Android Central (يشمل سامسونج)
    'https://www.phonearena.com/feed', // PhoneArena (مقارنات وأخبار)
   
  
    'https://www.apple.com/newsroom/rss-feed.rss', // الموقع الرسمي لآبل
    'https://developer.apple.com/news/rss/news.rss', // تحديثات المطورين
    'https://www.macrumors.com/rss', // MacRumors (أشهر موقع متخصص بآبل)
    'https://9to5mac.com/feed/', // 9to5Mac (تسريبات وأخبار)
    'https://appleinsider.com/rss/news', // AppleInsider
    'https://arabic.cnet.com/rss/', // سي نت عربي (أحدث التقنيات)
    'https://www.tech-wd.com/wd/feed/', // تك إند جيك (شامل)
    'https://aitnews.com/feed/', // آي تي نيوز (أخبار تقنية)
    'https://www.albayan.ae/technology/rss.xml', // البيان - تكنولوجيا
    'https://www.theverge.com/ai/rss/index.xml', // ذا فيرج (أخبار AI بالعربية)
    'https://openai.com/blog/rss/', // مدونة OpenAI الرسمية
    'https://www.technologyreview.com/ar/feed/', // MIT Tech Review عربي (تقارير AI)
    'https://www.aitimejournal.com/ar/rss', // AI Time Journal (تحليلات متخصصة)
    'https://www.gsmarena.com/ar/rss-news-reviews.php3', // GSMArena عربي (أخبار الجوالات)
    'https://www.xda-developers.com/feed/', // XDA Developers (تطبيقات وهاكات تقنية)
    'https://www.theverge.com/ar/tech/rss/index.xml', // ذا فيرج عربي (ابتكارات)
    'https://coinatory.com/ar/feed/', // كويناتوري (عملات رقمية)
    'https://www.vrscoop.com/ar/rss.xml', // VR Scoop (واقع افتراضي)
    'https://www.thenextweb.com/ar/feed/', // TNW (تقنيات ناشئة)
    'https://www.hackread.com/feed/', // هاك ريد (أخبار أمنية)
    'https://www.darkreading.com/rss.xml', // دارك ريدنج (أمن سيبراني)
    'https://www.ign.com/ar/feed.xml', // إنجادجيت عربي
    'https://arstechnica.com/ar/feed/', // آرس تكنيكا عربي
    'https://www.engadget.com/ar/rss.xml', 
    'https://www.ign.com/ar/feed.xml',
    'https://www.engadget.com/ar/rss.xml',
    'https://dev.to/feed'
  ]

 

};

const categories = [
  { id: 'all', name: 'الرئيسية' },
  { id: 'palestine', name: 'فلسطين' },
  { id: 'sports', name: 'رياضة' },
  { id: 'health', name: 'صحة' },
  { id: 'technology', name: 'تكنولوجيا  ' },
];
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return 'تاريخ غير معروف';
  }
};

const extractImage = (content) => {
  if (!content) return null;
  const imgMatch = content.match(/<img[^>]+src=["']([^"'>]+)["']/);
  return imgMatch ? imgMatch[1] : null;
};

export default function NewsPage() {
  const { darkMode } = useTheme();
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('جارٍ تحميل الأخبار...');

    const fetchRSS = async () => {
      try {
        const feeds = rssFeeds[category] || [];
        const responses = await Promise.allSettled(
          feeds.map(feedUrl =>
            fetch(`/news/api/fetch-rss?url=${encodeURIComponent(feedUrl)}`)
              .then(res => res.json())
              .catch(() => null)
          )
        );

        const fetchedArticles = responses.flatMap(res => {
          if (res.status !== 'fulfilled' || !res.value?.items) return [];
          const data = res.value;
          return data.items.map(item => {
            const image = item.image || extractImage(item.content) || '/placeholder-news.jpg';
            return {
              title: item.title || 'عنوان غير معروف',
              description: item.contentSnippet?.slice(0, 200) || '',
              link: item.link || '#',
              pubDate: item.pubDate || '',
              source: data.title || new URL(data.feedUrl || feeds[0]).hostname,
              image,
              content: item.content || '',
            };
          });
        });

        // ✅ ترتيب: الأخبار العربية + التي تحتوي على صور أولاً
        const sortedArticles = fetchedArticles.sort((a, b) => {
          const isArabic = str => /[\u0600-\u06FF]/.test(str);
          const hasImage = img => img && !img.includes('placeholder');

          const score = (item) =>
            (isArabic(item.title) ? 2 : 0) +
            (hasImage(item.image) ? 1 : 0);

          return score(b) - score(a);
        });

        if (isMounted) {
          setArticles(sortedArticles);
          setError(sortedArticles.length ? '' : 'لا توجد أخبار متاحة حالياً');
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError('حدث خطأ أثناء تحميل الأخبار.');
          setLoading(false);
        }
      }
    };

    fetchRSS();
    return () => {
      isMounted = false;
    };
  }, [category]);

  // تحسين فلترة الأخبار مع useMemo لتقليل إعادة الحساب
  const filteredArticles = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return articles;
    return articles.filter(article =>
      article.title.toLowerCase().includes(s) ||
      article.description.toLowerCase().includes(s)
    );
  }, [search, articles]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>آخر الأخبار</h1>

        <div className="flex justify-center gap-2 flex-wrap mb-6">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300
                ${category === cat.id 
                  ? 'bg-yellow-500 text-black' 
                  : darkMode 
                    ? 'bg-gray-800 text-white hover:bg-yellow-400 hover:text-black' 
                    : 'bg-gray-200 text-gray-800 hover:bg-yellow-400'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="mb-6 max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن الأخبار..."
              className={`w-full py-2 px-4 pr-10 rounded-full border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-yellow-400`}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <FaSpinner className="animate-spin text-3xl text-yellow-600" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border-2
                  ${darkMode 
                    ? 'bg-gray-900 border-gray-500 hover:border-yellow-500 hover:shadow-yellow-500/20' 
                    : 'bg-white border-yellow-500 hover:border-yellow-600 hover:shadow-yellow-200'}`}
              >
                <div className="overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    onError={e => (e.currentTarget.src = 'images.png')}
                    className="w-full h-48 object-cover transform transition-transform duration-500 group-hover:scale-105"
                  />
                </div>  
                <div className="p-4 transition-all duration-300 group-hover:bg-opacity-95">
                  <h2 className={`text-lg font-bold mb-2 line-clamp-2 transition-colors duration-300 ${darkMode ? 'text-white group-hover:text-yellow-400' : 'text-black group-hover:text-yellow-600'}`}>{article.title}</h2>
                  <p className={`text-sm mb-2 line-clamp-3 transition-colors duration-300 ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>{article.description}</p>
                  <div className={`flex justify-between items-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{article.source}</span>
                    <span>{formatDate(article.pubDate)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
