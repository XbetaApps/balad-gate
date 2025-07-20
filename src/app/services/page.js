'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  FaStore, FaHome, FaMapMarkedAlt, FaCar, FaUtensils,
  FaBriefcase, FaGraduationCap, FaHospital, FaClinicMedical,
  FaTheaterMasks, FaHotel, FaPills, FaGasPump, FaShoppingBag,
  FaGlassCheers, FaTruck, FaRing, FaTshirt, FaTools, FaBook,
  FaDumbbell, FaCut, FaChevronUp, FaGift, FaPlus, FaFilter, FaBoxes, FaTimes, FaImage, FaThList
} from 'react-icons/fa';


// Palestinian governorates list
const palestinianGovernorates = [
  'القدس',
  'رام الله والبيرة',
  'الخليل',
  'نابلس',
  'جنين',
  'أريحا والأغوار',
  'طوباس',
  'طولكرم',
  'قلقيلية',
  'سلفيت',
  'بيت لحم',
  'غزة',
  'شمال غزة',
  'دير البلح',
  'خان يونس',
  'رفح'
];

// Governorate filter component
const GovernorateFilter = ({ selectedGov, onSelectGov }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  


  // Close on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-right mr-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-black hover:bg-gray-900 transition-all duration-300 focus:outline-none shadow-lg hover:shadow-xl active:scale-95 transform hover:-translate-y-0.5 border-2 border-amber-400"
          title="تصفية حسب المحافظة"
          aria-label="تصفية حسب المحافظة"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="relative">
            <FaFilter className="text-white text-xl" />
            {selectedGov && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                ✓
              </span>
            )}
          </div>
        </button>
        {!isOpen && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border-2 border-amber-400 flex items-center justify-center">
            <FaChevronDown className="text-white text-xs" />
          </div>
        )}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed left-4 top-4 w-80 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            overflowY: 'auto',
            top: '1rem',
            bottom: '1rem',
            left: '1rem'
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-2">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
              اختر المحافظة
            </div>
            {palestinianGovernorates.map((gov) => (
              <button
                key={gov}
                onClick={() => {
                  onSelectGov(gov);
                  setIsOpen(false);
                }}
                className={`block w-full text-right px-4 py-3 text-sm transition-colors duration-150 ${
                  selectedGov === gov
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                role="menuitem"
              >
                {gov}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
              <button
                onClick={() => {
                  onSelectGov('');
                  setIsOpen(false);
                }}
                className="block w-full text-right px-4 py-3 text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 font-medium transition-colors duration-150"
                role="menuitem"
              >
                إزالة الفلتر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Services data
const services = [
  {
    id: 'stores',
    title: 'متاجر',
    icon: <FaStore className="text-4xl " />,
    description: 'اكتشف أفضل المتاجر المحلية والعالمية في منطقتك',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400' // <-- هذا هو البوردر الذهبي
  },
  
  {
    id: 'real-estate',
    title: 'عقارات',
    icon: <FaHome className="text-4xl " />,
    description: 'عروض مميزة للشقق والفلل والمباني السكنية والتجارية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'lands',
    title: 'أراضي',
    icon: <FaMapMarkedAlt className="text-4xl " />,
    description: 'أراضي سكنية وتجارية بمساحات وأسعار مناسبة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'cars',
    title: 'سيارات',
    icon: <FaCar className="text-4xl " />,
    description: 'أحدث السيارات الجديدة والمستعملة بأسعار تنافسية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'restaurants',
    title: 'مطاعم',
    icon: <FaUtensils className="text-4xl " />,
    description: 'أشهى المأكولات من أفضل المطاعم في مدينتك',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'jobs',
    title: 'فرص عمل',
    icon: <FaBriefcase className="text-4xl " />,
    description: 'فرص عمل شاغرة في مختلف التخصصات والمجالات',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'education',
    title: 'دورات دراسية',
    icon: <FaGraduationCap className="text-4xl " />,
    description: 'معاهد ومراكز تعليمية ودورات تدريبية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },


  {
    id: 'hospitals',
    title: 'مستشفيات',
    icon: <FaHospital className="text-4xl " />,
    description: 'أفضل المستشفيات والمراكز الطبية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },


  {
    id: 'clinics',
    title: 'عيادات طبية',
    icon: <FaClinicMedical className="text-4xl " />,
    description: 'عيادات متخصصة وأطباء في مختلف التخصصات',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'entertainment',
    title: ' اماكن ترفيهية ',
    icon: <FaTheaterMasks className="text-4xl " />,
    description: 'أماكن ترفيهية وأحداث ثقافية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'hotels',
    title: 'فنادق',
    icon: <FaHotel className="text-4xl " />,
    description: 'فنادق ومنتجعات وشقق فندقية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'pharmacies',
    title: 'صيدليات',
    icon: <FaPills className="text-4xl " />,
    description: 'صيدليات ومراكز بيع الأدوية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'gas-stations',
    title: 'محطات وقود',
    icon: <FaGasPump className="text-4xl" />,
    description: 'أقرب محطات الوقود ومراكز الخدمة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'shopping',
    title: 'مراكز تجارية',
    icon: <FaShoppingBag className="text-4xl" />,
    description: 'مراكز تجارية وأسواق شعبية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'wedding-halls',
    title: 'صالات أفراح',
    icon: <FaGlassCheers className="text-4xl" />,
    description: 'أجواء هادئة ومشروبات منعشة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'delivery',
    title: 'خدمات التوصيل',
    icon: <FaTruck className="text-4xl" />,
    description: 'خدمات النقل والشحن',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'jewelry',
    title: 'مجوهرات وذهب',
    icon: <FaRing className="text-4xl" />,
    description: 'مجوهرات ومصوغات ذهبية وفضية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'home-appliances',
    title: 'أجهزة منزلية',
    icon: <FaBoxes className="text-4xl" />,
    description: 'أحدث صيحات  الأجهزة المنزلية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'fashion',
    title: 'ملابس وأزياء',
    icon: <FaTshirt className="text-4xl" />,
    description: 'أحدث صيحات الموضة والأزياء',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'car-maintenance',
    title: 'صيانة سيارات',  
    icon: <FaTools className="text-4xl" />,
    description: 'خدمات الصيانة والإصلاح',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'gifts',
    title: 'هدايا وتحف',
    icon: <FaGift className="text-4xl" />,
    description: 'هدايا وتحف مميزة',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'beauty-centers',
    title: 'مراكز تجميل',
    icon: <FaCut className="text-4xl" />,
    description: 'مراكز تجميل وعناية شخصية',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'gyms',
    title: 'صالات رياضية',
    icon: <FaDumbbell className="text-4xl" />,
    description: 'النادي الرياضي',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  },
  {
    id: 'libraries',
    title: 'مكتبات',
    icon: <FaBook className="text-4xl" />,
    description: 'أشهر المكتبات وأحدث الإصدارات',
    color: 'from-orange-300 to-amber-300',
    bgColor: 'bg-orange-200',
    hover: 'hover:from-orange-100 hover:to-amber-100',
    border: 'border border-yellow-400'
  }
];

// Function to get appropriate button text for each service
const getAddButtonText = (serviceId) => {
  const buttonTexts = {
    stores: 'إضافة متجر',
    'real-estate': 'إضافة عقار',
    lands: 'إضافة أرض',
    cars: 'إضافة سيارة',
    restaurants: 'إضافة مطعم',
    jobs: 'إضافة وظيفة',
    courses: 'إضافة دورة',
    hospitals: 'إضافة مستشفى',
    clinics: 'إضافة عيادة',
    entertainment: 'إضافة مكان ترفيهي',
    hotels: 'إضافة فندق',
    pharmacies: 'إضافة صيدلية',
    'gas-stations': 'إضافة محطة وقود',
    malls: 'إضافة مركز تجاري',
    'wedding-halls': 'إضافة صالة أفراح',
    delivery: 'إضافة خدمة توصيل',
    jewelry: 'إضافة معرض مجوهرات',
    'home-appliances': 'إضافة معرض أجهزة',
    fashion: 'إضافة متجر أزياء',
    'car-maintenance': 'إضافة ورشة صيانة',
    gifts: 'إضافة متجر هدايا',
    'beauty-centers': 'إضافة مركز تجميل',
    gyms: 'إضافة نادٍ رياضي',
    libraries: 'إضافة مكتبة'
  };
  return buttonTexts[serviceId] || 'إضافة';
};



// Service categories with their respective services
const serviceCategories = [
  {
    id: 'commercial',
    title: 'خدمات تجارية',
    icon: <FaStore className="text-xl" />,
    services: [
      { id: 'stores', title: 'متاجر', icon: <FaStore className="text-2xl" />, color: 'bg-blue-500' },
      { id: 'malls', title: 'مراكز تجارية', icon: <FaShoppingBag className="text-2xl" />, color: 'bg-purple-600' },
      { id: 'restaurants', title: 'مطاعم', icon: <FaUtensils className="text-2xl" />, color: 'bg-purple-500' },
      { id: 'pharmacies', title: 'صيدليات', icon: <FaPills className="text-2xl" />, color: 'bg-red-600' },
      { id: 'jewelry', title: 'مجوهرات', icon: <FaRing className="text-2xl" />, color: 'bg-yellow-500' },
      { id: 'fashion', title: 'أزياء', icon: <FaTshirt className="text-2xl" />, color: 'bg-indigo-600' },
    ]
  },
  {
    id: 'real-estate',
    title: 'عقارات وأراضي',
    icon: <FaHome className="text-xl" />,
    services: [
      { id: 'real-estate', title: 'عقارات', icon: <FaHome className="text-2xl" />, color: 'bg-green-500' },
      { id: 'lands', title: 'أراضي', icon: <FaMapMarkedAlt className="text-2xl" />, color: 'bg-amber-500' },
      { id: 'hotels', title: 'فنادق', icon: <FaHotel className="text-2xl" />, color: 'bg-amber-600' },
      { id: 'wedding-halls', title: 'صالات أفراح', icon: <FaGlassCheers className="text-2xl" />, color: 'bg-pink-600' },
    ]
  },
  {
    id: 'vehicles',
    title: 'مركبات ومواصلات',
    icon: <FaCar className="text-xl" />,
    services: [
      { id: 'cars', title: 'سيارات', icon: <FaCar className="text-2xl" />, color: 'bg-red-500' },
      { id: 'gas-stations', title: 'محطات وقود', icon: <FaGasPump className="text-2xl" />, color: 'bg-blue-600' },
      { id: 'delivery', title: 'توصيل', icon: <FaTruck className="text-2xl" />, color: 'bg-green-600' },
    ]
  },
  {
    id: 'health',
    title: 'صحة ولياقة',
    icon: <FaClinicMedical className="text-xl" />,
    services: [
      { id: 'hospitals', title: 'مستشفيات', icon: <FaHospital className="text-2xl" />, color: 'bg-rose-500' },
      { id: 'clinics', title: 'عيادات', icon: <FaClinicMedical className="text-2xl" />, color: 'bg-emerald-500' },
      { id: 'gyms', title: 'نوادي رياضية', icon: <FaDumbbell className="text-2xl" />, color: 'bg-red-700' },
      { id: 'beauty-centers', title: 'مراكز تجميل', icon: <FaCut className="text-2xl" />, color: 'bg-pink-400' },
    ]
  },
  {
    id: 'education',
    title: 'تعليم وتطوير',
    icon: <FaGraduationCap className="text-xl" />,
    services: [
      { id: 'courses', title: 'دورات', icon: <FaGraduationCap className="text-2xl" />, color: 'bg-pink-500' },
      { id: 'libraries', title: 'مكتبات', icon: <FaBook className="text-2xl" />, color: 'bg-amber-700' },
    ]
  },
  {
    id: 'other',
    title: 'خدمات أخرى',
    icon: <FaBoxes className="text-xl" />,
    services: [
      { id: 'jobs', title: 'وظائف', icon: <FaBriefcase className="text-2xl" />, color: 'bg-indigo-500' },
      { id: 'entertainment', title: 'ترفيه', icon: <FaTheaterMasks className="text-2xl" />, color: 'bg-cyan-500' },
      { id: 'gifts', title: 'هدايا', icon: <FaGift className="text-2xl" />, color: 'bg-rose-400' },
    ]
  }
];

export default function ServicesPage() {
  const [activeSection, setActiveSection] = useState(null);
  const scrollContainerRef = useRef(null);

  // Scroll to active section when it changes
  useEffect(() => {
    if (activeSection && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = container.querySelector(`[href="#${activeSection}"]`);
      if (activeElement) {
        const containerWidth = container.offsetWidth;
        const elementLeft = activeElement.offsetLeft;
        const elementWidth = activeElement.offsetWidth;
        const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeSection]);
  const [showScroll, setShowScroll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentService, setCurrentService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    governorate: '',
    location: '',
    phone: '',
    image: null
  });
  const [selectedGov, setSelectedGov] = useState('');
  const sectionRefs = useRef({});
  const [expandedCategories, setExpandedCategories] = useState({
    commercial: true,
    'real-estate': true,
    vehicles: true,
    health: true,
    education: true,
    other: true
  });
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const fileInputRef = useRef(null);
  
  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Toggle floating menu
  const toggleFloatingMenu = () => {
    setShowFloatingMenu(!showFloatingMenu);
  };
  
  // Get service name by ID
  const getServiceName = (serviceId) => {
    const service = allServices.find(s => s.id === serviceId);
    return service ? service.title : 'الخدمة';
  };

  // Get add button text based on service type
  const getAddButtonText = (serviceId) => {
    return serviceId ? `إضافة ${getServiceName(serviceId)}` : 'إضافة خدمة';
  };

  // Get form title based on service type
  const getFormTitle = (serviceId) => {
    const titles = {
      'real-estate': 'إضافة عقار',
      lands: 'إضافة أرض',
      cars: 'إضافة سيارة',
      restaurants: 'إضافة مطعم',
      hospitals: 'إضافة مستشفى',
      clinics: 'إضافة عيادة',
      hotels: 'إضافة فندق',
      pharmacies: 'إضافة صيدلية',
      gyms: 'إضافة نادٍ رياضي',
      default: 'إضافة خدمة'
    };

    return titles[serviceId] || titles.default;
  };

  // Handle quick add
  const handleQuickAdd = (serviceId) => {
    setCurrentService(serviceId);
    setShowAddForm(true);
    setShowFloatingMenu(false);
  };

  // Function to get field labels based on service type
  const getFieldLabel = (fieldName) => {
    const labels = {
      name: {
        'real-estate': 'اسم العقار',
        lands: 'اسم الأرض',
        cars: 'اسم السيارة',
        restaurants: 'اسم المطعم',
        hospitals: 'اسم المستشفى',
        clinics: 'اسم العيادة',
        hotels: 'اسم الفندق',
        pharmacies: 'اسم الصيدلية',
        gyms: 'اسم النادي الرياضي',
        default: 'الاسم'
      },
      description: 'الوصف',
      location: 'العنوان التفصيلي',
      phone: 'رقم الهاتف',
      image: 'صورة',
      governorate: 'المحافظة'
    };

    if (fieldName === 'name' && currentService) {
      return labels.name[currentService] || labels.name.default;
    }
    return labels[fieldName] || fieldName;
  };

  // Handle filter change
  const handleFilterChange = (serviceId, gov) => {
    setFilters((prev) => ({
      ...prev,
      [serviceId]: gov
    }));
  };

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };

  // Handle closing the form
  const handleCloseForm = () => {
    setShowAddForm(false);
    setFormData({
      name: '',
      description: '',
      location: '',
      governorate: '',
      phone: '',
      image: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', {
      ...formData,
      serviceType: currentService,
      fullLocation: formData.governorate
        ? `${formData.location} - ${formData.governorate}`
        : formData.location
    });
    handleCloseForm();
  };

  // Handle scroll and active section detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      setShowScroll(scrollPosition > 300);

      // Get all service sections and category sections
      const serviceSections = Array.from(document.querySelectorAll('[data-service-section]'));
      const categorySections = Array.from(document.querySelectorAll('.service-category'));
      
      // Combine all sections with their offsets
      const allSections = [
        ...categorySections.map(el => ({
          id: el.id,
          offsetTop: el.offsetTop,
          offsetHeight: el.offsetHeight
        })),
        ...serviceSections.map(el => ({
          id: el.id,
          offsetTop: el.offsetTop,
          offsetHeight: el.offsetHeight
        }))
      ];
      
      // Sort sections by their position on the page
      allSections.sort((a, b) => a.offsetTop - b.offsetTop);
      
      // Get the first section position
      const firstSection = allSections[0];
      let foundActive = false;
      
      // Find the active section based on scroll position
      for (const section of allSections) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.id;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
          foundActive = true;
          if (window.location.hash !== `#${sectionId}`) {
            window.history.replaceState(null, null, `#${sectionId}`);
          }
          break;
        }
      }
      
      // If we're above the first section or no section is active, set activeSection to first category
      if ((firstSection && scrollPosition < firstSection.offsetTop) || !foundActive) {
        const firstCategory = categorySections[0];
        if (firstCategory) {
          setActiveSection(firstCategory.id);
        } else if (firstSection) {
          setActiveSection(firstSection.id);
        } else {
          setActiveSection(null);
        }
        if (window.location.hash !== '') {
          window.history.replaceState(null, null, ' ');
        }
      }
    };

    const handleHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(hash);
        }
      }
    };

    // Initial setup
    handleHash();
    
    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHash);
    
    // Initial scroll check
    const timer = setTimeout(handleScroll, 100);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHash);
      clearTimeout(timer);
    };
  }, []);





  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'auto';
    }
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };



  // Get all services for search functionality
  const allServices = serviceCategories.flatMap(category => category.services);
  
  // Filter services based on search query
  const filteredServices = allServices.filter(service => 
    service.title.includes(searchQuery) || 
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get filtered categories with their services
  const filteredCategories = serviceCategories.map(category => {
    const filteredCategoryServices = category.services.filter(service => 
      filteredServices.some(s => s.id === service.id)
    );
    
    return {
      ...category,
      services: filteredCategoryServices
    };
  }).filter(category => category.services.length > 0);

  // Quick add services (recently used or popular)
  const quickAddServices = [
    { id: 'stores', title: 'متجر', icon: <FaStore /> },
    { id: 'real-estate', title: 'عقار', icon: <FaHome /> },
    { id: 'cars', title: 'سيارة', icon: <FaCar /> },
    { id: 'jobs', title: 'وظيفة', icon: <FaBriefcase /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl mb-4">
            اكتشف خدماتنا المتنوعة
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            كل ما تحتاجه من خدمات في مكان واحد
          </p>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن خدمة..."
                className="w-full px-5 py-3 pr-12 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="services-container" className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-expanded={expandedCategories[category.id]}
              >
                <div className="flex items-center">
                  <span className="text-amber-500 mr-3">{category.icon}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{category.title}</h2>
                  <span className="mr-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {category.services.length}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    expandedCategories[category.id] ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedCategories[category.id] && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {category.services.map((service) => (
                      <div 
                        key={service.id}
                        className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5"
                      >
                        <div className="p-4">
                          <div className={`w-12 h-12 mx-auto rounded-lg ${service.color} bg-opacity-10 flex items-center justify-center mb-3 text-${service.color.split('-')[1]}-600 dark:text-${service.color.split('-')[1]}-400`}>
                            {service.icon}
                          </div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white text-center mb-1">
                            {service.title}
                          </h3>
                          <div className="flex justify-center space-x-2 mt-3">
                            <a
                              href={`#${service.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(service.id);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth' });
                                  window.history.pushState(null, null, `#${service.id}`);
                                }
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                              تصفح
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentService(service.id);
                                setShowAddForm(true);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                              <FaPlus className="ml-1" size={10} />
                              إضافة
                            </button>
                          </div>
                        </div>
                        
                        <a
                          href={`#${service.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const element = document.getElementById(service.id);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                              window.history.pushState(null, null, `#${service.id}`);
                            }
                          }}
                          className="absolute inset-0 z-10"
                          aria-label={`تصفح ${service.title}`}
                        ></a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Service Categories Sections */}
      <div className="py-8">
        {filteredCategories.map((category) => (
          <div key={category.id} id={category.id} className="py-12 service-category">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-4 text-amber-600 dark:text-amber-400">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {category.title}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {category.services.map((service) => (
                  <div 
                    key={service.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className={`w-12 h-12 mx-auto rounded-lg ${service.color} bg-opacity-10 flex items-center justify-center mb-3`}>
                        {service.icon}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                        {service.title}
                      </h3>
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => {
                            setCurrentService(service.id);
                            setShowAddForm(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                          <FaPlus className="ml-1" size={10} />
                          إضافة
                        </button>
                        <a
                          href={`#${service.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(service.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                          تصفح
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* Individual Service Sections */}
        {allServices.map((service) => (
          <div 
            key={`section-${service.id}`} 
            id={service.id} 
            data-service-section
            className="py-16 px-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center mb-8">
                <div className={`w-12 h-12 rounded-lg ${service.color} bg-opacity-10 flex items-center justify-center mr-4`}>
                  {service.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {service.title}
                </h2>
                <button
                  onClick={() => {
                    setCurrentService(service.id);
                    setShowAddForm(true);
                  }}
                  className="mr-auto ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <FaPlus className="ml-1" />
                  {getAddButtonText(service.id)}
                </button>
              </div>
              
              {/* Service content will go here */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                  محتوى {service.title} سيظهر هنا
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating Action Button - Left side */}
      <div className="fixed bottom-24 left-6 z-20 flex flex-col items-start space-y-3">
        {showFloatingMenu && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-3 mb-3 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {quickAddServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleQuickAdd(service.id)}
                  className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-24"
                >
                  <span className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
                    {service.icon}
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {service.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={toggleFloatingMenu}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 transform ${
            showFloatingMenu ? 'bg-red-500 hover:bg-red-600 rotate-45' : 'bg-amber-500 hover:bg-amber-600'
          }`}
          aria-label={showFloatingMenu ? 'إغلاق القائمة' : 'إضافة جديد'}
        >
          <FaPlus className="text-xl" />
        </button>
      </div>

          {/* Mobile Navigation - Horizontal Scrollable */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-10 md:hidden overflow-hidden">
        <div 
          className="flex overflow-x-auto py-2 px-1 scroll-smooth" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            scrollPadding: '0 16px',
            scrollBehavior: 'smooth'
          }}
          ref={scrollContainerRef}
        >
          {/* All Services Button */}
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setActiveSection('services');
            }}
            className={`flex flex-col items-center justify-center p-2 mx-1 rounded-lg min-w-[80px] flex-shrink-0 ${
              !activeSection || activeSection === 'services'
                ? 'bg-amber-500 text-white shadow-md scale-110'
                : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-all duration-300`}
            style={{
              flex: '0 0 auto',
              scrollSnapAlign: 'center'
            }}
          >
            <span className={`text-xl mb-1 ${!activeSection || activeSection === 'services' ? 'text-white' : 'text-amber-500'}`}>
              <FaThList />
            </span>
            <span className="text-xs font-medium text-center px-1 whitespace-nowrap">
              الكل
            </span>
          </a>
          
          {/* Divider */}
          <div className="h-10 w-px bg-gray-200 dark:bg-gray-600 my-2 mx-1"></div>
          
          {/* Main Categories with Subcategories */}
          {filteredCategories.map((category, index) => (
            <React.Fragment key={`cat-${category.id}`}>
              {/* Main Category */}
              <a
                href={`#${category.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(category.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveSection(category.id);
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 mx-1 rounded-lg min-w-[80px] flex-shrink-0 ${
                  activeSection === category.id
                    ? 'bg-amber-500 text-white shadow-md scale-110'
                    : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                } transition-all duration-300`}
                style={{
                  flex: '0 0 auto',
                  scrollSnapAlign: 'center',
                  borderRight: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <span className={`text-xl mb-1 ${activeSection === category.id ? 'text-white' : 'text-amber-500'}`}>
                  {category.icon}
                </span>
                <span className="text-xs font-medium text-center px-1 whitespace-nowrap">
                  {category.title}
                </span>
              </a>
              
              {/* Subcategories */}
              {category.services.map((service) => (
                <a
                  key={service.id}
                  href={`#${service.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(service.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setActiveSection(service.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-2 mx-1 rounded-lg min-w-[80px] flex-shrink-0 ${
                    activeSection === service.id
                      ? 'bg-amber-500 text-white shadow-md scale-110'
                      : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  } transition-all duration-300`}
                  style={{
                    flex: '0 0 auto',
                    scrollSnapAlign: 'center',
                    borderRight: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <span className={`text-xl mb-1 ${activeSection === service.id ? 'text-white' : service.color}`}>
                    {service.icon}
                  </span>
                  <span className="text-xs font-medium text-center px-1 whitespace-nowrap">
                    {service.title}
                  </span>
                </a>
              ))}
              
              {/* Divider between categories */}
              {index < filteredCategories.length - 1 && (
                <div className="h-10 w-px bg-gray-200 dark:bg-gray-600 my-2 mx-1"></div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Mobile Floating Menu - Higher than mobile nav but lower than FAB */}
        {showFloatingMenu && (
          <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg rounded-t-xl border-b border-gray-200 dark:border-gray-700 z-30">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">إضافة سريعة</h3>
            <div className="grid grid-cols-4 gap-3">
              {quickAddServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleQuickAdd(service.id)}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
                    {service.icon}
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-200">
                    {service.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Top Button - Right side */}
      {showScroll && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-40"
          aria-label="الانتقال إلى الأعلى"
        >
          <FaChevronUp className="text-xl" />
        </button>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 relative transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentService ? `اضافة ${getServiceName(currentService)}` : 'إضافة خدمة جديدة'}
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    اسم الخدمة
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                    placeholder="أدخل اسم الخدمة"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    الوصف
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                    placeholder="أدخل وصفًا للخدمة"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="governorate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      المحافظة
                    </label>
                    <select
                      id="governorate"
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      required
                      dir="rtl"
                    >
                      <option value="">اختر المحافظة</option>
                      {palestinianGovernorates.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      placeholder="رقم الهاتف"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    الموقع
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                    placeholder="أدخل الموقع"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    صورة الخدمة (اختياري)
                  </label>
                  <div className="flex items-center">
                    <span className="inline-block h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {formData.image ? (
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaImage className="h-full w-full text-gray-300 dark:text-gray-500 p-1.5" />
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mr-2 text-xs bg-white dark:bg-gray-700 py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      اختر صورة
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {currentService ? 'تحديث الخدمة' : 'إضافة الخدمة'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}