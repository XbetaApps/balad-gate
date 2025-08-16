// @/config/sections.js
export const sections = {
  // المتاجر
  stores: {
    id: 'commercial-stores',
    title: 'المتاجر',
    icon: 'FaStore',
    // جلب بعدة مسميات محتملة لتوافق أسماء قاعدة البيانات
    apiEndpoint: '/api/posts?categoryName=المتاجر,متاجر,محلات',
    viewAllLink: '/commercial/stores',
    enabled: true,
    order: 1
  },

  malls: {
    id: 'commercial-malls',
    title: 'مراكز تجارية',
    icon: 'FaShoppingBag',
    // صيغ متعددة: مول/مولات/مجمعات
    apiEndpoint: '/api/posts?categoryName=مراكز تجارية,مجمعات تجارية,مولات,مول',
    viewAllLink: '/commercial/malls',
    enabled: true,
    order: 3
  },
  pharmacies: {
    id: 'commercial-pharmacies',
    title: 'صيدليات',
    icon: 'FaPills',
    apiEndpoint: '/api/posts?categoryName=صيدليات,صيدلية',
    viewAllLink: '/commercial/pharmacies',
    enabled: true,
    order: 2
  },
  
  jewelry: {
    id: 'commercial-jewelry',
    title: 'مجوهرات وذهب',
    icon: 'FaRing',
    apiEndpoint: '/api/posts?categoryName=مجوهرات وذهب,مجوهرات,ذهب',
    viewAllLink: '/commercial/jewelry',
    enabled: true,
    order: 4
  },
  fashion: {
    id: 'commercial-fashion',
    title: 'ملابس وأزياء',
    icon: 'FaTshirt',
    apiEndpoint: '/api/posts?categoryName=ملابس وأزياء,ملابس,أزياء',
    viewAllLink: '/commercial/fashion',
    enabled: true,
    order: 5
  },
  restaurants: {
    id: 'commercial-restaurants',
    title: 'مطاعم',
    icon: 'FaUtensils',
    apiEndpoint: '/api/posts?categoryName=مطاعم,مطعم',
    viewAllLink: '/commercial/restaurants',
    enabled: true,
    order: 6
  },

  // العقارات
  realEstate: {
    id: 'real-estate&lands-real-estate',
    title: 'عقارات',
    icon: 'FaHome',
    apiEndpoint: '/api/posts?categoryName=عقارات,عقار',
    viewAllLink: '/real-estate',
    enabled: true,
    order: 7
  },
  lands: {
    id: 'real-estate&lands-lands',
    title: 'أراضي',
    icon: 'FaMapMarkedAlt',
    apiEndpoint: '/api/posts?categoryName=أراضي,أرض',
    viewAllLink: '/lands',
    enabled: true,
    order: 8
  },
  hotels: {
    id: 'real-estate&lands-hotels',
    title: 'فنادق',
    icon: 'FaHotel',
    apiEndpoint: '/api/posts?categoryName=فنادق,فندق',
    viewAllLink: '/hotels',
    enabled: true,
    order: 9
  },
  weddingHalls: {
    id: 'real-estate&lands-wedding-halls',
    title: 'صالات أفراح',
    icon: 'FaGlassCheers',
    apiEndpoint: '/api/posts?categoryName=صالات أفراح,قاعة أفراح,قاعات أفراح',
    viewAllLink: '/wedding-halls',
    enabled: true,
    order: 10
  },

  // المركبات
  cars: {
    id: 'vehicles-cars',
    title: 'سيارات',
    icon: 'FaCar',
    apiEndpoint: '/api/posts?categoryName=سيارات,سيارة',
    viewAllLink: '/vehicles/cars',
    enabled: true,
    order: 11
  },
  gasStations: {
    id: 'vehicles-gas-stations',
    title: 'محطات وقود',
    icon: 'FaGasPump',
    apiEndpoint: '/api/posts?categoryName=محطات وقود,محطة وقود,بنزينات,محطات بنزين',
    viewAllLink: '/vehicles/gas-stations',
    enabled: true,
    order: 12
  },
  delivery: {
    id: 'vehicles-delivery',
    title: 'خدمات توصيل',
    icon: 'FaTruck',
    apiEndpoint: '/api/posts?categoryName=خدمات توصيل,توصيل',
    viewAllLink: '/vehicles/delivery',
    enabled: true,
    order: 13
  },

  // الصحة
  hospitals: {
    id: 'health-hospitals',
    title: 'مستشفيات',
    icon: 'FaHospital',
    apiEndpoint: '/api/posts?categoryName=مستشفيات,مستشفى',
    viewAllLink: '/health/hospitals',
    enabled: true,
    order: 14
  },
  clinics: {
    id: 'health-clinics',
    title: 'عيادات طبية',
    icon: 'FaClinicMedical',
    apiEndpoint: '/api/posts?categoryName=عيادات طبية,عيادات,عيادة',
    viewAllLink: '/health/clinics',
    enabled: true,
    order: 15
  },
  beautyCenters: {
    id: 'health-beauty-centers',
    title: 'مراكز تجميل',
    icon: 'FaCut',
    apiEndpoint: '/api/posts?categoryName=مراكز تجميل,صالونات تجميل,تجميل',
    viewAllLink: '/health/beauty-centers',
    enabled: true,
    order: 16
  },
  gyms: {
    id: 'health-gyms',
    title: 'صالات رياضية',
    icon: 'FaDumbbell',
    apiEndpoint: '/api/posts?categoryName=صالات رياضية,نوادي رياضية,نادي رياضي,جيم',
    viewAllLink: '/health/gyms',
    enabled: true,
    order: 17
  },

  // التعليم
  courses: {
    id: 'education-courses',
    title: 'دورات دراسية',
    icon: 'FaGraduationCap',
    apiEndpoint: '/api/posts?categoryName=دورات دراسية,دورات,كورس,كورسات',
    viewAllLink: '/education/courses',
    enabled: true,
    order: 18
  },
  libraries: {
    id: 'education-libraries',
    title: 'مكتبات وكتب',
    icon: 'FaBook',
    // تضمين صيغ متعددة: مكتبات، كتب، كتب ومكتبات
    apiEndpoint: '/api/posts?categoryName=مكتبات وكتب,مكتبات,كتب,الكتب,كتب ومكتبات',
    viewAllLink: '/education/libraries',
    enabled: true,
    order: 19
  },

  // أخرى
  jobs: {
    id: 'other-jobs',
    title: 'فرص عمل',
    icon: 'FaBriefcase',
    apiEndpoint: '/api/posts?categoryName=فرص عمل,وظائف,وظيفة,عمل',
    viewAllLink: '/jobs',
    enabled: true,
    order: 20
  },
  entertainment: {
    id: 'other-entertainment',
    title: 'أماكن ترفيهية',
    icon: 'FaTheaterMasks',
    apiEndpoint: '/api/posts?categoryName=أماكن ترفيهية,ترفيه,أماكن ترفيه',
    viewAllLink: '/entertainment',
    enabled: true,
    order: 21
  },
  gifts: {
    id: 'other-gifts',
    title: 'هدايا وتحف',
    icon: 'FaGift',
    // تضمين صيغ متعددة: هدايا فقط
    apiEndpoint: '/api/posts?categoryName=هدايا وتحف,هدايا',
    viewAllLink: '/gifts',
    enabled: true,
    order: 22
  }
};

// دالة للحصول على الأقسام المفعلة مرتبة
// يمكنك استيرادها واستخدامها في الصفحة الرئيسية
export const getEnabledSections = () => {
  return Object.values(sections)
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order);
};