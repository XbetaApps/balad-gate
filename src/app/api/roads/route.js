// src/app/api/roads/route.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const apiUrl = 'https://www.aweenrayeh.com/api/checkpoints';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': 'https://www.aweenrayeh.com',
        'Referer': 'https://www.aweenrayeh.com/',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept-Language': 'ar,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`فشل في جلب البيانات من الخادم (${response.status})`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data format:', data);
      throw new Error('تنسيق البيانات غير متوقع');
    }

    return new Response(JSON.stringify({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error) {
    console.error('Error in API route:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'حدث خطأ غير متوقع',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}