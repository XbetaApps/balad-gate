'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../nav/theme/ThemeProvider';

const FaSpinner = dynamic(() => import('react-icons/fa').then(mod => mod.FaSpinner), { ssr: false });
const FaSearch = dynamic(() => import('react-icons/fa').then(mod => mod.FaSearch), { ssr: false });

const rssFeeds = {
  all: [
    'https://www.aljazeera.net/aljazeerarss/servicesservers',
    'https://www.bbc.com/arabic/index.xml',
    'https://www.skynewsarabia.com/rss',
    'https://www.alarabiya.net/feed',
    'https://www.albawaba.com/ar/feed',
    'https://arabic.rt.com/rss/',
    'https://www.alquds.co.uk/feed/',
    'https://www.almasryalyoum.com/rss/rssfeeder',
    'https://www.youm7.com/rss/SectionRss',
    'https://www.bbc.com/arabic/arab/index.xml',
    'https://www.bbc.com/arabic/middleeast/index.xml',
    'https://www.aljazeera.net/aljazeerarss/9a1b1b1b-1b1b-1b1b-1b1b1b1b1b1b'
  ],
  palestine: [
    'https://www.aljazeera.net/aljazeerarss/2a2e5a5b-4f6b-4e24-9f5e-1a1a1a1a1a1a',
    'https://www.alquds.co.uk/feed/',
    'https://www.maannews.net/rss',
    'https://www.qudsnet.com/feed',
    'https://www.samanews.ps/feed/',
    'https://www.wafa.ps/feed.aspx?lang=ar',
    'https://www.alwatanvoice.com/arabic/news/rss.html',
    'https://www.raya.ps/feed/',
    'https://www.palinfo.com/rss/palinfo_ar.rss',
    'https://www.palestinetoday.net/ar/rss/'
  ],
  sports: [
    'https://www.aljazeera.net/aljazeerarss/3f93e7aa-cf1c-41ef-9c40-0ca4b8a5c0b7',
    'https://www.skynewsarabia.com/rss/section/رياضة',
    'https://www.alarabiya.net/ar/sport/rss',
    'https://www.elbotola.com/rss/'

  ],
  technology: [
    'https://aitnews.com/feed/',
    'https://www.tech-wd.com/wd-rss.xml',
    'https://arabic.cnet.com/rss/'
  ],
  health: [
    'https://www.skynewsarabia.com/rss/section/صحة',
    'https://www.aljazeera.net/aljazeerarss/health',
    'https://www.alarabiya.net/ar/science/rss'
  ]
};

const categories = [
  { id: 'all', name: 'الرئيسية' },
  { id: 'palestine', name: 'فلسطين' },
  { id: 'sports', name: 'رياضة' },
  { id: 'technology', name: 'تكنولوجيا  ' },
  { id: 'health', name: 'صحة' }
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
          return data.items.map(item => ({
            title: item.title || 'عنوان غير معروف',
            description: item.contentSnippet?.slice(0, 200) || '',
            link: item.link || '#',
            pubDate: item.pubDate || '',
            source: data.title || new URL(data.feedUrl || feeds[0]).hostname,
            image: item.image || extractImage(item.content) || '/placeholder-news.jpg'
          }));
        });

        if (isMounted) {
          setArticles(fetchedArticles);
          setError(fetchedArticles.length ? '' : 'لا توجد أخبار متاحة حالياً');
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
