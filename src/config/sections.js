// @/config/sections.js
export const sections = {
    // المتاجر
    stores: {
      id: 'commercial-stores',
      title: 'المتاجر',
      icon: 'FaStore',
      apiEndpoint: '/api/posts?category=commercial-stores',
      viewAllLink: '/commercial/stores',
      enabled: true,
      order: 1
    },

    malls: {
      id: 'commercial-malls',
      title: 'مراكز تجارية',
      icon: 'FaShoppingBag',
      apiEndpoint: '/api/posts?category=commercial-malls',
      viewAllLink: '/commercial/malls',
      enabled: true,
      order: 3
    },
    pharmacies: {
      id: 'commercial-pharmacies',
      title: 'صيدليات',
      icon: 'FaPills',
      apiEndpoint: '/api/posts?category=commercial-pharmacies',
      viewAllLink: '/commercial/pharmacies',
      enabled: true,
      order: 2
    },
    
    jewelry: {
      id: 'commercial-jewelry',
      title: 'مجوهرات وذهب',
      icon: 'FaRing',
      apiEndpoint: '/api/posts?category=commercial-jewelry',
      viewAllLink: '/commercial/jewelry',
      enabled: true,
      order: 4
    },
    fashion: {
      id: 'commercial-fashion',
      title: 'ملابس وأزياء',
      icon: 'FaTshirt',
      apiEndpoint: '/api/posts?category=commercial-fashion',
      viewAllLink: '/commercial/fashion',
      enabled: true,
      order: 5
    },
    restaurants: {
      id: 'commercial-restaurants',
      title: 'مطاعم',
      icon: 'FaUtensils',
      apiEndpoint: '/api/posts?category=commercial-restaurants',
      viewAllLink: '/commercial/restaurants',
      enabled: true,
      order: 6
    },

    // العقارات
    realEstate: {
      id: 'real-estate&lands-real-estate',
      title: 'عقارات',
      icon: 'FaHome',
      apiEndpoint: '/api/posts?category=real-estate&lands-real-estate',
      viewAllLink: '/real-estate',
      enabled: true,
      order: 7
    },
    lands: {
      id: 'real-estate&lands-lands',
      title: 'أراضي',
      icon: 'FaMapMarkedAlt',
      apiEndpoint: '/api/posts?category=real-estate&lands-lands',
      viewAllLink: '/lands',
      enabled: true,
      order: 8
    },
    hotels: {
      id: 'real-estate&lands-hotels',
      title: 'فنادق',
      icon: 'FaHotel',
      apiEndpoint: '/api/posts?category=real-estate&lands-hotels',
      viewAllLink: '/hotels',
      enabled: true,
      order: 9
    },
    weddingHalls: {
      id: 'real-estate&lands-wedding-halls',
      title: 'صالات أفراح',
      icon: 'FaGlassCheers',
      apiEndpoint: '/api/posts?category=real-estate&lands-wedding-halls',
      viewAllLink: '/wedding-halls',
      enabled: true,
      order: 10
    },

    // المركبات
    cars: {
      id: 'vehicles-cars',
      title: 'سيارات',
      icon: 'FaCar',
      apiEndpoint: '/api/posts?category=vehicles-cars',
      viewAllLink: '/vehicles/cars',
      enabled: true,
      order: 11
    },
    gasStations: {
      id: 'vehicles-gas-stations',
      title: 'محطات وقود',
      icon: 'FaGasPump',
      apiEndpoint: '/api/posts?category=vehicles-gas-stations',
      viewAllLink: '/vehicles/gas-stations',
      enabled: true,
      order: 12
    },
    delivery: {
      id: 'vehicles-delivery',
      title: 'خدمات توصيل',
      icon: 'FaTruck',
      apiEndpoint: '/api/posts?category=vehicles-delivery',
      viewAllLink: '/vehicles/delivery',
      enabled: true,
      order: 13
    },

    // الصحة
    hospitals: {
      id: 'health-hospitals',
      title: 'مستشفيات',
      icon: 'FaHospital',
      apiEndpoint: '/api/posts?category=health-hospitals',
      viewAllLink: '/health/hospitals',
      enabled: true,
      order: 14
    },
    clinics: {
      id: 'health-clinics',
      title: 'عيادات طبية',
      icon: 'FaClinicMedical',
      apiEndpoint: '/api/posts?category=health-clinics',
      viewAllLink: '/health/clinics',
      enabled: true,
      order: 15
    },
    beautyCenters: {
      id: 'health-beauty-centers',
      title: 'مراكز تجميل',
      icon: 'FaCut',
      apiEndpoint: '/api/posts?category=health-beauty-centers',
      viewAllLink: '/health/beauty-centers',
      enabled: true,
      order: 16
    },
    gyms: {
      id: 'health-gyms',
      title: 'صالات رياضية',
      icon: 'FaDumbbell',
      apiEndpoint: '/api/posts?category=health-gyms',
      viewAllLink: '/health/gyms',
      enabled: true,
      order: 17
    },

    // التعليم
    courses: {
      id: 'education-courses',
      title: 'دورات دراسية',
      icon: 'FaGraduationCap',
      apiEndpoint: '/api/posts?category=education-courses',
      viewAllLink: '/education/courses',
      enabled: true,
      order: 18
    },
    libraries: {
      id: 'education-libraries',
      title: 'مكتبات وكتب',
      icon: 'FaBook',
      apiEndpoint: '/api/posts?category=education-libraries',
      viewAllLink: '/education/libraries',
      enabled: true,
      order: 19
    },

    // أخرى
    jobs: {
      id: 'other-jobs',
      title: 'فرص عمل',
      icon: 'FaBriefcase',
      apiEndpoint: '/api/posts?category=other-jobs',
      viewAllLink: '/jobs',
      enabled: true,
      order: 20
    },
    entertainment: {
      id: 'other-entertainment',
      title: 'أماكن ترفيهية',
      icon: 'FaTheaterMasks',
      apiEndpoint: '/api/posts?category=other-entertainment',
      viewAllLink: '/entertainment',
      enabled: true,
      order: 21
    },
    gifts: {
      id: 'other-gifts',
      title: 'هدايا وتحف',
      icon: 'FaGift',
      apiEndpoint: '/api/posts?category=other-gifts',
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