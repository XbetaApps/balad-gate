'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  FaStore, FaHome, FaMapMarkedAlt, FaCar, FaUtensils,
  FaBriefcase, FaGraduationCap, FaHospital, FaClinicMedical,
  FaTheaterMasks, FaHotel, FaPills, FaGasPump, FaShoppingBag,
  FaGlassCheers, FaTruck, FaRing, FaTshirt, FaTools, FaBook,
  FaDumbbell, FaCut, FaChevronUp, FaGift, FaPlus
} from 'react-icons/fa';

const services = [
  {
    id: 'stores',
    title: 'متاجر',
    icon: <FaStore className="text-4xl" />,
    description: 'اكتشف أفضل المتاجر المحلية والعالمية في منطقتك',
    color: 'from-blue-500 to-blue-400'
  },
  {
    id: 'real-estate',
    title: 'عقارات',
    icon: <FaHome className="text-4xl" />,
    description: 'عروض مميزة للشقق والفلل والمباني السكنية والتجارية',
    color: 'from-green-400 to-green-400'
  },
  {
    id: 'lands',
    title: 'أراضي',
    icon: <FaMapMarkedAlt className="text-4xl" />,
    description: 'أراضي سكنية وتجارية بمساحات وأسعار مناسبة',
    color: 'from-yellow-400 to-yellow-400'
  },
  {
    id: 'cars',
    title: 'سيارات',
    icon: <FaCar className="text-4xl" />,
    description: 'سيارات جديدة ومستعملة بجميع الموديلات والماركات',
    color: 'from-red-400 to-red-400'
  },
  {
    id: 'restaurants',
    title: 'مطاعم',
    icon: <FaUtensils className="text-4xl" />,
    description: 'أشهى المأكولات من مختلف المطاعم والمطابخ العالمية',
    color: 'from-purple-400 to-purple-400'
  },
  {
    id: 'jobs',
    title: 'فرص عمل',
    icon: <FaBriefcase className="text-4xl" />,
    description: 'وظائف شاغرة في مختلف المجالات والتخصصات',
    color: 'from-indigo-400 to-indigo-400'
  },
  {
    id: 'courses',
    title: 'دورات دراسية',
    icon: <FaGraduationCap className="text-4xl" />,
    description: 'دورات تدريبية وبرامج تعليمية في مختلف المجالات',
    color: 'from-pink-400 to-pink-400'
  },
  {
    id: 'hospitals',
    title: 'مستشفيات',
    icon: <FaHospital className="text-4xl" />,
    description: 'أفضل المستشفيات والمراكز الطبية المتخصصة',
    color: 'from-red-400 to-red-400'
  },
  {
    id: 'clinics',
    title: 'عيادات طبية',
    icon: <FaClinicMedical className="text-4xl" />,
    description: 'عيادات متخصصة في مختلف التخصصات الطبية',
    color: 'from-teal-400 to-teal-400'
  },
  {
    id: 'entertainment',
    title: 'أماكن ترفيهية',
    icon: <FaTheaterMasks className="text-4xl" />,
    description: 'أماكن ترفيهية ومنتجعات للاستجمام والترفيه',
    color: 'from-amber-400 to-amber-400'
  },
  {
    id: 'hotels',
    title: 'فنادق وشقق فندقية',
    icon: <FaHotel className="text-4xl" />,
    description: 'أفضل الفنادق والشقق الفندقية بأسعار مناسبة',
    color: 'from-rose-400 to-rose-400'
  },
  {
    id: 'pharmacies',
    title: 'صيدليات',
    icon: <FaPills className="text-4xl" />,
    description: 'صيدليات تعمل على مدار الساعة لخدمتكم',
    color: 'from-emerald-400 to-emerald-400'
  },  
  {
    id: 'gas-stations',
    title: 'محطات وقود',
    icon: <FaGasPump className="text-4xl" />,
    description: 'أقرب محطات الوقود وخدمات السيارات',
    color: 'from-orange-400 to-orange-400'
  },
  {
    id: 'malls',
    title: 'مراكز تجارية',
    icon: <FaShoppingBag className="text-4xl" />,
    description: 'أكبر المراكز التجارية والمولات',
    color: 'from-sky-400 to-sky-400'
  },
  {
    id: 'wedding-halls',
    title: 'صالات أفراح',
    icon: <FaGlassCheers className="text-4xl" />,
    description: 'أجمل صالات الأفراح والقاعات الفاخرة',
    color: 'from-fuchsia-400 to-fuchsia-400'
  },
  {
    id: 'delivery',
    title: 'خدمات التوصيل',
    icon: <FaTruck className="text-4xl" />,
    description: 'خدمات توصيل سريعة وموثوقة',
    color: 'from-amber-400 to-amber-400'
  },
  {
    id: 'jewelry',
    title: 'مجوهرات وذهب',
    icon: <FaRing className="text-4xl" />,
    description: 'أجود أنواع الذهب والمجوهرات',
    color: 'from-yellow-400 to-yellow-400'
  },
  {
    id: 'home-appliances',
    title: 'أجهزة منزلية',
    icon: <FaHome className="text-4xl" />,
    description: 'أحدث الأجهزة المنزلية بأسعار تنافسية',
    color: 'from-blue-400 to-blue-400'
  },
  {
    id: 'fashion',
    title: 'ملابس وأزياء',
    icon: <FaTshirt className="text-4xl" />,
    description: 'أحدث صيحات الموضة والأزياء',
    color: 'from-pink-400 to-pink-400'
  },
  {
    id: 'car-maintenance',
    title: 'صيانة سيارات',
    icon: <FaTools className="text-4xl" />,
    description: 'مراكز صيانة سيارات معتمدة',
    color: 'from-gray-400 to-gray-400'
  },
  {
    id: 'gifts',
    title: 'هدايا وتحف',
    icon: <FaGift className="text-4xl" />,
    description: 'أجمل الهدايا والتحف الفنية',
    color: 'from-pink-400 to-pink-400'
  },
  {
    id: 'beauty-centers',
    title: 'مراكز تجميل',
    icon: <FaCut className="text-4xl" />,
    description: 'أفضل مراكز التجميل والعناية بالبشرة',
    color: 'from-purple-400 to-purple-400'
  },
  {
    id: 'gyms',
    title: 'صالات رياضية',
    icon: <FaDumbbell className="text-4xl" />,
    description: 'أحدث الصالات الرياضية ومراكز اللياقة البدنية',
    color: 'from-red-400 to-red-400'
  },  
  {
    id: 'libraries',
    title: 'مكتبات وكتب',
    icon: <FaBook className="text-4xl" />,
    description: 'أشهر المكتبات وأحدث الإصدارات',
    color: 'from-amber-400 to-amber-400'
  }
];

// دالة للحصول على نص زر الإضافة المناسب لكل قسم
const getAddButtonText = (serviceId) => {
  const buttonTexts = {
    'stores': 'إضافة متجر',
    'real-estate': 'إضافة عقار',
    'lands': 'إضافة أرض',
    'cars': 'إضافة سيارة',
    'restaurants': 'إضافة مطعم',
    'jobs': 'إضافة وظيفة',
    'courses': 'إضافة دورة',
    'hospitals': 'إضافة مستشفى',
    'clinics': 'إضافة عيادة',
    'entertainment': 'إضافة مكان ترفيهي',
    'hotels': 'إضافة فندق',
    'pharmacies': 'إضافة صيدلية',
    'gas-stations': 'إضافة محطة وقود',
    'malls': 'إضافة مركز تجاري',
    'wedding-halls': 'إضافة صالة أفراح',
    'delivery': 'إضافة خدمة توصيل',
    'jewelry': 'إضافة معرض مجوهرات',
    'home-appliances': 'إضافة معرض أجهزة',
    'fashion': 'إضافة متجر أزياء',
    'car-maintenance': 'إضافة ورشة صيانة',
    'gifts': 'إضافة متجر هدايا',
    'beauty-centers': 'إضافة مركز تجميل',
    'gyms': 'إضافة نادٍ رياضي',
    'libraries': 'إضافة مكتبة'
  };
  return buttonTexts[serviceId] || 'إضافة';
};

export default function ServicesPage() {
  const [activeSection, setActiveSection] = useState('');
  const [showScroll, setShowScroll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentService, setCurrentService] = useState('');
  // قائمة المحافظات الفلسطينية
  const palestinianGovernorates = [
    'القدس',
    'رام الله والبيرة',
    'الخليل',
    'بيت لحم',
    'أريحا والأغوار',
    'نابلس',
    'طولكرم',
    'قلقيلية',
    'سلفيت',
    'جنين',
    'طوباس',
    'غزة',
    'شمال غزة',
    'دير البلح',
    'خان يونس',
    'رفح'
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    image: null,
    governorate: ''
  });

  // الحصول على اسم الحقل المناسب حسب نوع الخدمة
  const getFieldLabel = (fieldName) => {
    const labels = {
      name: {
        'real-estate': 'اسم العقار',
        'lands': 'اسم الأرض',
        'cars': 'اسم السيارة',
        'restaurants': 'اسم المطعم',
        'hospitals': 'اسم المستشفى',
        'clinics': 'اسم العيادة',
        'hotels': 'اسم الفندق',
        'pharmacies': 'اسم الصيدلية',
        'gyms': 'اسم النادي الرياضي',
        'default': 'الاسم'
      },
      description: 'الوصف',
      location: 'العنوان التفصيلي',
      phone: 'رقم الهاتف',
      image: 'صورة',
      governorate: 'المحافظة'
    };

    if (fieldName === 'name' && currentService) {
      return labels.name[currentService] || labels.name['default'];
    }
    return labels[fieldName] || fieldName;
  };
  const sectionRefs = useRef({});
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };

  // Handle closing the form
  const handleCloseForm = () => {
    setShowAddForm(false);
    // Reset form data
    setFormData({
      name: '',
      description: '',
      location: '',
      governorate: '',
      phone: '',
      image: null
    });
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // هنا يمكنك إضافة منطق إرسال النموذج
    console.log('تم إرسال النموذج:', { 
      ...formData, 
      serviceType: currentService,
      fullLocation: formData.governorate ? 
        `${formData.location} - ${formData.governorate}` : 
        formData.location
    });
    
    // إغلاق النموذج وإعادة تعيين الحقول
    handleCloseForm();
  };

  // Handle scroll and update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // Show/hide scroll to top button
      setShowScroll(scrollPosition > 300);
      
      // Update active section
      for (const [id, ref] of Object.entries(sectionRefs.current)) {
        if (!ref) continue;
        
        const sectionTop = ref.offsetTop;
        const sectionHeight = ref.offsetHeight;
        
        if (scrollPosition >= sectionTop && 
            scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(id);
          break;
        }
      }
    };

    // Handle hash on initial load
    const handleHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.substring(1);
        if (hash) {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(hash);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', handleHash);
    
    // Initial check
    handleHash();
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className=" ">
      {/* Sidebar */}
      <div className="fixed right-0 top-17 h-[calc(100vh-5rem)] w-64 bg-white dark:bg-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-black/20 hidden md:block p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          الخدمات
        </h2>
        <nav>
          <ul className="space-y-2">
            {services.map((service) => (
              <li key={service.id}>
                <a
                  href={`#${service.id}`}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                    activeSection === service.id
                      ? 'bg-gradient-to-l from-amber-400 to-amber-500 text-white shadow-lg border-2 border-amber-300 transform -translate-x-1'
                      : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-2 hover:border-amber-400 hover:transform hover:-translate-x-1'
                  }`}
                >
                  <span className="ml-2">{service.icon}</span>
                  <span className="font-medium">{service.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-20 md:hidden">
        <div className="flex overflow-x-auto py-2 px-1">
          {services.slice(0, 4).map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              className={`flex flex-col items-center justify-center p-2 mx-1 rounded-lg min-w-[70px] ${
                activeSection === service.id
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-lg">{service.icon}</span>
              <span className="text-xs mt-1">{service.title}</span>
            </a>
          ))}
        </div>
      </div>



      {/* Main Content */}
      <div className="md:mr-72 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white text-center">
          خدماتنا
        </h1>

        {services.map((service) => (
          <section
            key={service.id}
            id={service.id}
            ref={(el) => (sectionRefs.current[service.id] = el)}
            className="mb-16 scroll-mt-20"
          >
            <div className={`p-6 rounded-xl bg-gradient-to-r ${service.color} text-white`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-full mr-4">
                    {service.icon}
                  </div>
                  <h2 className="text-2xl font-bold">{service.title}</h2>
                </div>
                <button 
                  onClick={() => {
                    setCurrentService(service.id);
                    setShowAddForm(true);
                  }}
                  className="bg-white hover:bg-amber-50 dark:bg-black dark:hover:bg-amber-900/20 text-black dark:text-white px-4 py-2 rounded-lg flex items-center transition-all duration-300 border-2 border-amber-700 dark:border-amber-600 text-sm font-medium shadow-sm hover:shadow-amber-200/40 dark:hover:shadow-amber-800/40 hover:border-amber-500 dark:hover:border-amber-400"
                >
                  <FaPlus className="ml-2" />
                  {getAddButtonText(service.id)}
                </button>
              </div>
              <p className="text-white/90">{service.description}</p>
            </div>

            <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                محتوى {service.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                  <div 
                    key={item} 
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow dark:border-gray-700"
                  >
                    <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <h4 className="font-medium text-gray-800 dark:text-white">عنصر {item}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">وصف قصير للعنصر</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Scroll to Top Button */}
      {showScroll && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 md:right-auto md:left-4 bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-10"
          aria-label="الانتقال إلى الأعلى"
        >
          <FaChevronUp className="text-xl" />
        </button>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            <button 
              onClick={handleCloseForm}
              type="button"
              className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
              {getAddButtonText(currentService)}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getFieldLabel('name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder={`أدخل ${getFieldLabel('name').toLowerCase()}`}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الوصف
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getFieldLabel('governorate')}
                  </label>
                  <select
                    name="governorate"
                    value={formData.governorate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getFieldLabel('location')}
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="الشارع والمنطقة"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getFieldLabel('image')} (اختياري)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/30 dark:file:text-amber-300 dark:hover:file:bg-amber-900/50"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    يمكنك رفع صورة أو تخطي هذه الخطوة
                  </p>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}