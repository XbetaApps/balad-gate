import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    feed: ['image'],
    item: [
      ['media:content', 'media:content', { includeSnippet: true }],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator']
    ]
  },
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/rss+xml, application/xml, text/xml',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
  },
  timeout: 10000
});

const memoryCache = new Map();

function getCached(key) {
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 5) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  memoryCache.set(key, {
    timestamp: Date.now(),
    data
  });
}

function extractFirstImage(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}

function getDefaultImage() {
  return '/images/default-news.jpg';
}

async function fetchFeed(url) {
  try {
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, text/html, application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Referer': 'https://www.google.com/'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`HTTP ${response.status} for ${url}`);
      return null;
    }

    const xml = await response.text();
    if (!xml || xml.trim() === '') {
      console.warn(`Empty response from ${url}`);
      return null;
    }

    const feed = await parser.parseString(xml);
    return feed;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`Timeout while fetching feed: ${url}`);
    } else {
      console.warn(`Error fetching feed ${url}:`, error.message);
    }
    return null;
  }
}

export async function GET() {
  const cacheKey = 'latest-news';
  const cached = getCached(cacheKey);
  
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // List of RSS feeds with fallbacks
    const rssFeeds = [
      // Reliable news sources
      'https://www.bbc.com/arabic/index.xml',  // BBC Arabic
      'https://www.aljazeera.net/rss',  // Al Jazeera Arabic (updated URL)
      'https://www.alquds.co.uk/feed/',  // Al Quds Al Arabi
      'https://www.alaraby.co.uk/rss.xml',  // Al Araby Al Jadeed
      'https://arabic.rt.com/rss/',  // RT Arabic
      // Fallback news sources
      'https://www.almasryalyoum.com/rss/rssfeeder',  // Al Masry Al Youm
      'https://www.youm7.com/rss/SectionRss'  // Youm7
    ];

    // Fetch all feeds in parallel
    const feeds = await Promise.all(
      rssFeeds.map(url => fetchFeed(url))
    );

    // Process all items from all feeds
    let allItems = [];
    feeds.forEach((feed, index) => {
      if (!feed || !feed.items) return;
      
      const items = feed.items.map(item => {
        const content = item.content || item.contentEncoded || item.contentSnippet || '';
        const image = item.enclosure?.url || 
                     item['media:content']?.$?.url || 
                     item['media:thumbnail']?.$?.url || 
                     extractFirstImage(content);
        
        const cleanContent = content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
        
        return {
          title: item.title || 'بدون عنوان',
          link: item.link || '#',
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          contentSnippet: cleanContent.substring(0, 180),
          image: image || getDefaultImage(),
          source: feed.title || `مصدر ${index + 1}`,
          guid: item.guid || `${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      });
      
      allItems = [...allItems, ...items];
    });

    // Filter out any invalid items and ensure we have required fields
    const validItems = allItems.filter(item => 
      item && 
      item.title && 
      item.link && 
      item.pubDate
    );

    // Sort by date (newest first)
    validItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Take only the latest 15 items
    const latestItems = validItems.slice(0, 15);

    const result = {
      items: latestItems,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in fetch-news API:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأخبار', details: error.message },
      { status: 500 }
    );
  }
}