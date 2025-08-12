// @/mockData.js
export const mockData = {
  'stores': Array(15).fill().map((_, i) => ({
    id: i + 1,
    title: `متجر ${i + 1}`,
    image: `https://via.placeholder.com/300x200?text=متجر+${i + 1}`,
    price: ['توصيل مجاني', 'خصم 20%', 'عرض خاص'][i % 3],
    location: ['غزة - الرمال', 'غزة - النصر', 'خانيونس', 'رفح'][i % 4]
  })),
  
  'real-estate': Array(6).fill().map((_, i) => ({
    id: i + 1,
    title: `عقار ${i + 1}`,
    image: `https://via.placeholder.com/300x200?text=عقار+${i + 1}`,
    price: `${(i + 1) * 50000}$`,
    location: ['غزة - الرمال', 'غزة - النصر', 'خانيونس', 'رفح'][i % 4]
  })),
  
  'cars': Array(6).fill().map((_, i) => ({
    id: i + 1,
    title: `سيارة ${i + 1}`,
    image: `https://via.placeholder.com/300x200?text=سيارة+${i + 1}`,
    price: `${(i + 5) * 2000}$`,
    location: ['غزة - الرمال', 'غزة - النصر', 'خانيونس', 'رفح'][i % 4],
    year: 2020 + i
  })),
  
  'restaurants': Array(6).fill().map((_, i) => ({
    id: i + 1,
    title: `مطعم ${i + 1}`,
    image: `https://via.placeholder.com/300x200?text=مطعم+${i + 1}`,
    price: ['$$', '$$$', '$$$$', '$$$'][i % 4],
    location: ['غزة - الرمال', 'غزة - النصر', 'خانيونس', 'رفح'][i % 4],
    cuisine: ['مأكولات بحرية', 'مشاوي', 'وجبات سريعة', 'حلويات'][i % 4]
  }))
};

export const getMockData = (category) => {
  return mockData[category] || [
    {
      id: 1,
      title: 'عنوان تجريبي',
      image: 'https://via.placeholder.com/300x200?text=صورة+تجريبية',
      price: 'السعر',
      location: 'الموقع'
    },
    // ... 3 عناصر إضافية بنفس الشكل
  ];
};