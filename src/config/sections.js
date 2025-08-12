// @/config/sections.js
export const sections = {
  stores: {
    id: 'stores',
    title: 'المتاجر',
    icon: 'FaStore',
    apiEndpoint: '/api/posts?category=stores',
    viewAllLink: '/stores',
    enabled: true,
    order: 1
  },
  realEstate: {
    id: 'realEstate',
    title: 'العقارات',
    icon: 'FaHome',
    apiEndpoint: '/api/posts?category=real-estate',
    viewAllLink: '/real-estate',
    enabled: true,
    order: 2
  },
  cars: {
    id: 'cars',
    title: 'السيارات',
    icon: 'FaCar',
    apiEndpoint: '/api/posts?category=cars',
    viewAllLink: '/cars',
    enabled: true,
    order: 3
  },
  restaurants: {
    id: 'restaurants',
    title: 'المطاعم',
    icon: 'FaUtensils',
    apiEndpoint: '/api/posts?category=restaurants',
    viewAllLink: '/restaurants',
    enabled: true,
    order: 4
  },
  jobs: {
    id: 'jobs',
    title: 'الوظائف',
    icon: 'FaBriefcase',
    apiEndpoint: '/api/posts?category=jobs',
    viewAllLink: '/jobs',
    enabled: true,
    order: 5
  },
  // يمكنك إضافة المزيد من الأقسام هنا
};

// دالة للحصول على الأقسام المفعلة مرتبة
// يمكنك استيرادها واستخدامها في الصفحة الرئيسية
export const getEnabledSections = () => {
  return Object.values(sections)
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order);
};