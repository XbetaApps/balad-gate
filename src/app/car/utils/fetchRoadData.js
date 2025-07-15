export async function fetchRoadData(city = null) {
  try {
    console.log('Starting to fetch road data from API...');
    const url = city ? `/api/roads?city=${encodeURIComponent(city)}` : '/api/roads';
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data);
    
    if (!data || !Array.isArray(data.roads)) {
      throw new Error('Invalid data format from API');
    }

    // Add city to each road if not present
    const processedRoads = data.roads.map(road => ({
      ...road,
      city: road.city || 'غير محدد'
    }));

    return {
      ...data,
      roads: processedRoads,
      cities: Array.isArray(data.cities) ? data.cities : []
    };
  } catch (error) {
    console.error('Error in fetchRoadData:', error);
    
    // Return default data in case of error
    const defaultRoads = [
      {
        name: 'معبر بيت حانون',
        status: 'مغلق',
        details: 'مغلق أمام حركة المواطنين',
        city: 'غزة',
        lastUpdate: new Date().toLocaleTimeString('ar-PS')
      },
      {
        name: 'معبر رفح',
        status: 'مفتوح',
        details: 'مفتوح أمام حركة المسافرين',
        city: 'رفح',
        lastUpdate: new Date().toLocaleTimeString('ar-PS')
      },
      {
        name: 'حاجز قلنديا',
        status: 'مزدحم',
        details: 'حركة مرور كثيفة',
        city: 'القدس',
        lastUpdate: new Date().toLocaleTimeString('ar-PS')
      }
    ];

    // Filter by city if specified
    const filteredRoads = city 
      ? defaultRoads.filter(road => road.city === city)
      : defaultRoads;

    return {
      roads: filteredRoads,
      cities: ['القدس', 'غزة', 'رفح'],
      lastUpdate: new Date().toLocaleTimeString('ar-PS')
    };
  }
}
