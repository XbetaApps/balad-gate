'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useTheme } from './nav/theme/ThemeProvider';
import { getEnabledSections } from '@/config/sections';

// تحميل المكونات الديناميكية
const DynamicSection = dynamic(
  () => import('@/components/DynamicSection'),
  { ssr: false }
);
import { 
  FaNewspaper, FaCloudSun, FaRoad, FaDollarSign, FaStore, FaHome,
  FaCar, FaUtensils, FaBriefcase, FaGraduationCap, FaHospital,
  FaClinicMedical, FaTheaterMasks, FaGlassCheers, FaWrench, FaHotel,
  FaPills, FaGasPump, FaShoppingBag, FaTruck, FaRing, FaTools, FaGift,
  FaCut, FaDumbbell, FaFutbol, FaBook, FaUtensilSpoon, FaMobile, FaPlane,
  FaTshirt, FaLaptop, FaBicycle, FaBuilding, FaCamera, FaCoffee,
  FaGamepad, FaHeadphones, FaHeart, FaInfoCircle, FaMusic, FaPaw, FaPlaneDeparture,
  FaShoppingCart, FaSignInAlt, FaUmbrellaBeach, FaWineGlassAlt,
  FaChevronLeft, FaChevronRight, FaChevronLeft as FaLeft, FaChevronRight as FaRight 
} from 'react-icons/fa';

// Dynamically import WeatherWidget with no SSR
const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">جاري تحميل حالة الطقس...</div>
});

// Dynamically import components with SSR disabled to avoid hydration issues
const LatestNews = dynamic(
  () => import('../components/LatestNews'),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center">جاري التحميل...</div> }
);

const CurrencyRates = dynamic(
  () => import('../components/CurrencyRates'),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center">جاري تحميل أسعار العملات...</div> }
);

export default function HomePage() {
  const { darkMode } = useTheme();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef(null);
  const featuredNewsRef = useRef(null);
  
  // Save scroll position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Restore scroll position after component mounts
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
      sessionStorage.removeItem('scrollPosition');
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Featured news state
  const [featuredNews, setFeaturedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Handle image loading errors
  const handleImageError = (e, itemId) => {
    console.warn(`Failed to load image for news item ${itemId}, using fallback`);
    e.target.src = '/images.png';
    
    // Also update the state to prevent the error from happening again
    setFeaturedNews(prevNews => 
      prevNews.map(item => 
        item.id === itemId 
          ? { ...item, image: '/images.png' } 
          : item
      )
    );
  };






  // Fetch featured news from API
  const fetchFeaturedNews = useCallback(async (force = false) => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const response = await fetch(`/api/fetch-news?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      
      // Comprehensive list of Palestine-related keywords in Arabic and English
      const palestineKeywords = [
        // General Palestine terms
        'فلسطين', 'فلسطيني', 'فلسطينية', 'فلسطينيين', 'فلسطينيات', 'Palestine', 'Palestinian', 'Palestinians',
        
        // Cities and regions
        'القدس', 'القدس المحتلة', 'القدس الشرقية', 'القدس الغربية', 'القدس العربية', 'Jerusalem', 'Al-Quds', 'East Jerusalem',
        'غزة', 'قطاع غزة', 'غزة المحاصرة', 'أهل غزة', 'Gaza', 'Gaza Strip',
        'الضفة', 'الضفة الغربية', 'الضفة المحتلة', 'الضفة الفلسطينية', 'West Bank', 'الضفة',
        'الخليل', 'Hebron', 'Al-Khalil',
        'نابلس', 'Nablus',
        'رام الله', 'Ramallah',
        'بيت لحم', 'Bethlehem', 'Beit Lahm',
        'أريحا', 'Jericho', 'Ariha',
        'جنين', 'Jenin',
        'طولكرم', 'Tulkarm',
        'قلقيلية', 'Qalqilya',
        'سلفيت', 'Salfit',
        'طوباس', 'Tubas',
        'طولكرم', 'Tulkarem',
        'الخليل', 'Hebron',
        'الخضيرة', 'Al-Khudayriyya',
        'يافا', 'Yafa', 'Jaffa',
        'عكا', 'Akka', 'Acre',
        'الناصرة', 'Nazareth', 'An-Nasira',
        
        // Political and military terms
        'المقاومة الفلسطينية', 'Palestinian resistance',
        'فتح', 'Fatah',
        'حماس', 'Hamas',
        'الجهاد الإسلامي', 'Islamic Jihad',
        'القسام', 'Al-Qassam',
        'سرايا القدس', 'Al-Quds Brigades',
        'الجبهة الشعبية', 'Popular Front',
        'الجبهة الديمقراطية', 'Democratic Front',
        
        // Occupation and settlements
        'الاحتلال', 'الإحتلال', 'الاحتلال الإسرائيلي', 'Israeli occupation', 'occupation',
        'الاستيطان', 'المستوطنات', 'المستوطنين', 'Settlements', 'Settlers', 'Settlement',
        'هدم المنازل', 'House demolitions',
        'الاعتقالات', 'الأسرى', 'Prisoners', 'Detainees', 'Arrests',
        'الأسرى الفلسطينيين', 'Palestinian prisoners',
        'سجون الاحتلال', 'سجن عوفر', 'سجن النقب', 'Ofer prison', 'Negev prison', 'Israeli jails',
        
        // Resistance and uprisings
        'الانتفاضة', 'انتفاضة', 'Intifada', 'Uprising',
        'هبّة', 'Uprising', 'Protest',
        'مسيرات العودة', 'Great March of Return',
        'كسر الحصار', 'Breaking the siege',
        
        // Refugees and UNRWA
        'الأونروا', 'UNRWA',
        'اللاجئين الفلسطينيين', 'Palestinian refugees',
        'مخيمات اللجوء', 'Refugee camps',
        'حق العودة', 'Right of return',
        
        // Political issues
        'القدس عاصمة فلسطين', 'Jerusalem capital of Palestine',
        'صفقة القرن', 'Deal of the Century',
        'التطبيع', 'Normalization',
        'السلام', 'Peace process',
        'مفاوضات السلام', 'Peace negotiations',
        'الشرق الأوسط', 'Middle East',
        'الصراع العربي الإسرائيلي', 'Arab-Israeli conflict',
        'القضية الفلسطينية', 'Palestinian cause',
        'الدولة الفلسطينية', 'Palestinian state',
        'السلطة الفلسطينية', 'Palestinian Authority',
        'منظمة التحرير', 'PLO',
        'المجلس الوطني', 'Palestinian National Council',
        
        // Religious sites
        'المسجد الأقصى', 'Al-Aqsa Mosque',
        'قبة الصخرة', 'Dome of the Rock',
        'حائط البراق', 'Western Wall', 'Wailing Wall',
        'الحرم القدسي', 'Al-Haram al-Sharif',
        'كنيسة القيامة', 'Church of the Holy Sepulchre',
        'كنيسة المهد', 'Church of the Nativity'
      ];
      
      // Filter for news related to Palestine - more strict filtering
      const filteredNews = data.items.filter(item => {
        if (!item.title) return false;
        
        const title = item.title.toLowerCase();
        const content = (item.contentSnippet || '').toLowerCase();
        
        // Check if any of the keywords exist in title or content
        return palestineKeywords.some(keyword => 
          title.includes(keyword.toLowerCase()) || 
          content.includes(keyword.toLowerCase())
        );
      });
      
      // Sort by date, newest first
      filteredNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      
      // Take the first 3 most recent news items
      const newsItems = filteredNews.slice(0, 3);

      // Format the news items for the slider
      const formattedNews = newsItems.map((item, index) => {
        // Clean up the image URL
        let imageUrl = item.image || '';
        
        // If the image URL is from a known domain but starts with //, add https:
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
        
        // If the image URL is from a known domain but uses http, change to https
        imageUrl = imageUrl.replace('http://', 'https://');
        
        // Check if the image URL is from a trusted domain
        const isTrustedDomain = [
          'bbc.com',
          'aljazeera.net',
          'alquds.co.uk',
          'alaraby.co.uk',
          'rt.com',
          'almasryalyoum.com',
          'youm7.com',
          'ytimg.com',
          'cnn.com',
          'euronews.com',
          'reuters.com',
          'middleeasteye.net',
          'alarabiya.net',
          'wafa.ps',
          'maannews.net',
          'qudsnet.com',
          'palinfo.com',
          'safa.ps',
          'paltoday.ps',
          'alwatanvoice.com',
          'alquds.com',
          'felesteen.ps',
          'raya.ps',
          'amad.ps',
          'alhadath.ps',
          'alayyam.ps',
          'alresalah.ps',
          'samanews.ps',
          'shihab.ps',
          'wattan.tv',
          'alwatanvoice.com',
          'alquds.co.uk',
          'qudsn.co',
          'qudsnews.net',
          'qudspress.com',
          'qudsnet.com',
          'paldf.net',
          'palestinetoday.net',
          'palestinetoday.tv',
          'paltimes.net',
          'paltoday.ps',
          'paltoday.tv',
          'pnn.ps',
          'ppl.ps',
          'samanews.ps',
          'shihab.ps',
          'wafa.ps',
          'wattan.tv'
        ].some(domain => imageUrl.includes(domain));
        
        // If the image URL is not from a trusted domain, use the default image
        const finalImage = isTrustedDomain ? imageUrl : '/images.png';
        
        return {
          id: `${Date.now()}-${index}`, // Unique ID for each news item
          title: item.title,
          excerpt: item.contentSnippet || 'اضغط لقراءة المزيد...',
          image: finalImage,
          category: item.source || 'أخبار فلسطين',
          date: new Date(item.pubDate).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          link: item.link,
          timestamp: Date.now()
        };
      });

      // Only update if we have new news or we're forcing an update
      setFeaturedNews(prevNews => {
        // If forcing or news is different, update
        if (force || JSON.stringify(prevNews) !== JSON.stringify(formattedNews)) {
          return formattedNews;
        }
        return prevNews;
      });
    } catch (error) {
      console.error('Error fetching featured news:', error);
      // Fallback to default news if API fails
      setFeaturedNews(prevNews => {
        // Only update if we don't have any news yet
        if (prevNews.length === 0) {
          return [
            {
              id: 'fallback-1',
              title: 'تطورات الأوضاع في فلسطين',
              excerpt: 'تابع آخر المستجدات والتطورات في الأراضي الفلسطينية المحتلة',
              image: '/images/palestine-news1.jpg',
              category: 'أخبار فلسطين',
              date: new Date().toLocaleDateString('ar-EG'),
              link: '/news/palestine-updates',
              timestamp: Date.now()
            },
            {
              id: 'fallback-2',
              title: 'قضية فلسطين في الأمم المتحدة',
              excerpt: 'جلسات طارئة في الأمم المتحدة لبحث التصعيد في الأراضي الفلسطينية',
              image: '/images/palestine-news2.jpg',
              category: 'أخبار فلسطين',
              date: new Date().toLocaleDateString('ar-EG'),
              link: '/news/un-palestine',
              timestamp: Date.now()
            },
            {
              id: 'fallback-3',
              title: 'القدس عاصمة فلسطين',
              excerpt: 'تظاهرات تضامنية مع القدس في مختلف العواصم العربية',
              image: '/images/palestine-news3.jpg',
              category: 'أخبار فلسطين',
              date: new Date().toLocaleDateString('ar-EG'),
              link: '/news/jerusalem-updates',
              timestamp: Date.now()
            }
          ];
        }
        return prevNews;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and set up auto-refresh
  useEffect(() => {
    // Initial fetch
    fetchFeaturedNews(true); // Force initial fetch
    
    // Set up auto-refresh every minute
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing news...');
      fetchFeaturedNews(true);
    }, 60000); // 60 seconds
    
    // Clean up interval on component unmount
    return () => {
      console.log('Cleaning up news refresh interval');
      clearInterval(intervalId);
    };
  }, [fetchFeaturedNews]);
  
  // Auto-rotate featured news
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredNews.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredNews.length]);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredNews.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredNews.length) % featuredNews.length);
  };
  
  // Removed auto-scroll to featured news section
  
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const allCards = [
    { title: 'المتاجر', icon: FaStore, path: '/services#commercial-stores' },
    { title: 'عقارات', icon: FaHome, path: '/services#real-estate&lands-real-estate' },
    { title: 'أراضي', icon: FaBuilding, path: '/services#real-estate&lands-lands' },
    { title: 'سيارات', icon: FaCar, path: '/services#vehicles-cars' },
    { title: 'مطاعم', icon: FaUtensils, path: '/services#commercial-restaurants' },
    { title: 'فرص عمل', icon: FaBriefcase, path: '/services#other-jobs' },
    { title: 'دورات دراسية', icon: FaGraduationCap, path: '/services#education-courses' },
    { title: 'مستشفيات', icon: FaHospital, path: '/services#health-hospitals' },
    { title: 'عيادات طبية', icon: FaClinicMedical, path: '/services#health-clinics' },
    { title: 'أماكن ترفيهية', icon: FaTheaterMasks, path: '/services#other-entertainment' },
    { title: 'فنادق', icon: FaHotel, path: '/services#real-estate&lands-hotels' },
    { title: 'صيدليات', icon: FaPills, path: '/services#commercial-pharmacies' },
    { title: 'محطات وقود', icon: FaGasPump, path: '/services#vehicles-gas-stations' },
    { title: 'مراكز تجارية', icon: FaShoppingBag, path: '/services#commercial-malls' },
    { title: 'صالات أفراح', icon: FaGlassCheers, path: '/services#real-estate&lands-wedding-halls' },
    { title: 'خدمات توصيل', icon: FaTruck, path: '/services#vehicles-delivery' },
    { title: 'مجوهرات وذهب', icon: FaRing, path: '/services#commercial-jewelry' },
    { title: 'ملابس وأزياء', icon: FaTshirt, path: '/services#commercial-fashion' },
    { title: 'هدايا وتحف', icon: FaGift, path: '/services#other-gifts' },
    { title: 'مراكز تجميل', icon: FaCut, path: '/services#health-beauty-centers' },
    { title: 'صالات رياضية', icon: FaDumbbell, path: '/services#health-gyms' },
    { title: 'مكتبات وكتب', icon: FaBook, path: '/services#education-libraries' },
  ];

  return (
    <div    className="   min-h-[calc(100vh-4rem)] p-4 from-amber-50 to-white dark:from-[#000f1f] dark:gray-900">
      <div className="w-full max-w-6xl mx-auto">
        {/* Search and Services Section */}
        <div className="w-full max-w-6xl mx-auto py-8">
          {/* 🔍 Search Bar */}
          <div className="mb-12 px-4">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  dir="rtl"
                  placeholder="ابحث عن الخدمات..."
                  className={`
                    w-full p-4 pr-14 rounded-full border-2 outline-none transition-all duration-300 text-lg
                    shadow-sm
                    ${darkMode 
                      ? 'bg-gray-900 text-white border-gray-700 hover:border-amber-500 focus:border-amber-500' 
                      : 'bg-white text-gray-800 border-amber-100 hover:border-amber-300 focus:border-amber-400'}
                  `}
                />
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>





                  {/* 🧩 Cards */}
                    <div className="relative">
                      
                     <button 
              onClick={scrollLeft}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${
                darkMode ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-white text-amber-600 hover:bg-gray-100'
              } shadow-lg transition-all`}
              aria-label="Scroll left"
            >
              <FaChevronRight className="text-xl" />
            </button>
            
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide space-x-4 px-8 py-4"
              style={{ scrollbarWidth: 55,msOverflowStyle: 'none' }}
            >
              {allCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <Link
                    href={card.path || '#'}
                    key={index}
                    className="group flex-shrink-0 w-24 flex flex-col items-center"
                  >
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center
                      transition-all duration-300 mb-2
                      ${darkMode 
                        ? 'bg-gray-800 text-amber-400 group-hover:bg-amber-500/10' 
                        : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'}
                    `}>
                      <IconComponent className="text-2xl transition-transform group-hover:scale-110" />
                    </div>
                    <span className={`
                      text-xs font-medium text-center font-sans whitespace-nowrap
                      transition-colors duration-300
                      ${darkMode 
                        ? 'text-gray-200 group-hover:text-amber-300' 
                        : 'text-gray-700 group-hover:text-amber-600'}
                    `}>
                      {card.title}
                    </span>
                  </Link>
                );
              })}
            </div>
            
            <button 
              onClick={scrollRight}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${
                darkMode ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-white text-amber-600 hover:bg-gray-100'
              } shadow-lg transition-all`}
              aria-label="Scroll right"
            >
              <FaChevronLeft className="text-xl" />
            </button>
          </div>
        </div>









        {/* Featured News Section */}
        <div id="news" className="my-8 px-4">
          <div className="relative rounded-xl overflow-hidden shadow-2xl" ref={featuredNewsRef}>
            <div className="relative h-[500px] w-full">
              {featuredNews.map((news, index) => (
                <div 
                  key={news.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover"
                      priority
                      onError={(e) => handleImageError(e, news.id)}
                      unoptimized={!news.image.startsWith('/')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
                      <span className="inline-block bg-amber-500 text-white text-sm font-medium px-3 py-1 rounded-full mb-2">
                        {news.category}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">{news.title}</h2>
                      <p className="text-gray-200 mb-4">{news.excerpt}</p>
                      <a 
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-amber-300 hover:text-amber-200 font-medium transition-colors"
                      >
                        اقرأ المزيد
                        <FaLeft className="mr-2" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
                aria-label="Previous slide"
              >
                <FaRight />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
                aria-label="Next slide"
              >
                <FaLeft />
              </button>
              
              {/* Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {featuredNews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-amber-500 w-6' : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Secondary News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {featuredNews.slice(0, 2).map((news, index) => (
              <a 
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                key={`secondary-${news.id}`}
                className="group relative h-64 rounded-xl overflow-hidden shadow-md"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => handleImageError(e, news.id)}
                    unoptimized={!news.image.startsWith('/')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 p-4 text-white">
                    <span className="text-sm text-amber-300">{news.category}</span>
                    <h3 className="text-xl font-bold mt-1 group-hover:text-amber-300 transition-colors">
                      {news.title}
                    </h3>
                    <p className="text-sm text-gray-200 mt-1">{news.date}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      
        {/* 📰 Latest News Section */}
        <div className="px-4">
          <LatestNews />
        </div>

        {/* Weather Section */}
        <section id="weather-section" className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <WeatherWidget darkMode={darkMode} />

          </div>
        </section>


        {/* Currency Rates Section */}
        <div className="mb-8">
          <CurrencyRates />
        </div>

        {/* Dynamic Sections */}
        <div className="w-full pr-2">
          <div className="max-w-7xl mx-auto">
            {getEnabledSections().map((section) => (
              <DynamicSection 
                key={section.id}
                section={section}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
