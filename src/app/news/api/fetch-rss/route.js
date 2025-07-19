// /news/api/fetch-rss.js
import Parser from 'rss-parser';
import fetch from 'node-fetch';

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

function getCached(url) {
  const cached = memoryCache.get(url);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 1) {
    return cached.data;
  }
  return null;
}

function setCache(url, data) {
  memoryCache.set(url, {
    timestamp: Date.now(),
    data
  });
}

export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8'
  };

  const { searchParams } = new URL(request.url);
  let url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing RSS URL', items: [] }), { status: 400, headers });
  }

  url = url.trim();
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  const cached = getCached(url);
  if (cached) {
    return new Response(JSON.stringify(cached), { headers });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    const items = (feed.items || []).slice(0, 20).map((item, index) => {
      const content = item.content || item.contentEncoded || item.contentSnippet || '';
      const image = item.enclosure?.url || item['media:content']?.$?.url || item['media:thumbnail']?.$?.url || extractFirstImage(content);
      const clean = content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

      return {
        title: item.title || 'بدون عنوان',
        link: item.link || '#',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        contentSnippet: clean.substring(0, 180),
        image: image || getDefaultImage(),
        source: feed.title || 'مصدر غير معروف',
        guid: item.guid || `item-${index}`
      };
    });

    const result = {
      title: feed.title || 'أخبار',
      link: feed.link || '#',
      items,
      totalItems: feed.items?.length || 0,
      loadedItems: items.length
    };

    setCache(url, result);

    return new Response(JSON.stringify(result), { headers });

  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message,
      items: [],
      title: 'أخبار',
      loadedItems: 0
    }), { headers });
  }
}

function extractFirstImage(html) {
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  return match ? match[1] : null;
}

function getDefaultImage() {
  return '/news/icon/images.png';
}
