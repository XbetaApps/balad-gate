/**
 * بيانات وهمية للتطبيق
 * يمكن استبدالها بطلبات API فعلية لاحقاً
 */

// بيانات الفئات الرئيسية
const categories = [
  { id: 1, name: 'المنزل', icon: 'FaHome' },
  { id: 2, name: 'السيارات', icon: 'FaCar' },
  { id: 3, name: 'المطاعم', icon: 'FaUtensils' },
  { id: 4, name: 'الوظائف', icon: 'FaBriefcase' },
  { id: 5, name: 'الملابس', icon: 'FaShirt' },
  { id: 6, name: 'الجوالات', icon: 'FaMobileAlt' },
  { id: 7, name: 'أجهزة اللابتوب', icon: 'FaLaptop' },
  { id: 8, name: 'ألعاب الفيديو', icon: 'FaGamepad' },
];

// بيانات الإعلانات المميزة
const featuredItems = [
  {
    id: 1,
    title: 'شقة فاخرة للبيع',
    description: 'شقة 3 غرف نوم مع إطلالة رائعة',
    price: '1,200,000',
    currency: 'ر.س',
    image: '/images/featured/1.jpg',
    location: 'الرياض',
    date: 'منذ يومين',
    isFavorite: false,
  },
  // يمكن إضافة المزيد من الإعلانات المميزة
];

// الإعلانات الشائعة
const trendingItems = [
  {
    id: 1,
    title: 'سيارة تويوتا كامري 2022',
    description: 'موديل 2022، فل كامل، فتحة سقف',
    price: '120,000',
    currency: 'ر.س',
    image: '/images/trending/1.jpg',
    location: 'جدة',
    date: 'منذ 5 ساعات',
    isFavorite: true,
  },
  // يمكن إضافة المزيد من الإعلانات الشائعة
];

// أحدث الإعلانات
const recentItems = [
  {
    id: 1,
    title: 'آيفون 13 برو ماكس',
    description: 'جديد بالكرتونة، ضمان الوكالة',
    price: '5,200',
    currency: 'ر.س',
    image: '/images/recent/1.jpg',
    location: 'الدمام',
    date: 'منذ ساعة',
    isFavorite: false,
  },
  // يمكن إضافة المزيد من الإعلانات الحديثة
];

// الإعلانات الأكثر شعبية
const popularItems = [
  {
    id: 1,
    title: 'فيلا للايجار السنوي',
    description: 'فيلا فاخرة 5 غرف مع مسبح',
    price: '120,000',
    currency: 'ر.س/سنوياً',
    image: '/images/popular/1.jpg',
    location: 'الخبر',
    date: 'منذ 3 أيام',
    isFavorite: true,
  },
  // يمكن إضافة المزيد من الإعلانات الشعبية
];

// دالة للحصول على البيانات الوهمية حسب النوع
function getMockData(type) {
  switch (type) {
    case 'categories':
      return categories;
    case 'featured':
      return featuredItems;
    case 'trending':
      return trendingItems;
    case 'recent':
      return recentItems;
    case 'popular':
      return popularItems;
    default:
      return [];
  }
}

// تصدير الدالة والبيانات
module.exports = {
  getMockData,
  categories,
  featuredItems,
  trendingItems,
  recentItems,
  popularItems
};
