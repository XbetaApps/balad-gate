"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth/AuthProvider";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";
import {
  FaStore,
  FaHome,
  FaMapMarkedAlt,
  FaCar,
  FaUtensils,
  FaBriefcase,
  FaGraduationCap,
  FaHospital,
  FaClinicMedical,
  FaTheaterMasks,
  FaHotel,
  FaPills,
  FaGasPump,
  FaShoppingBag,
  FaGlassCheers,
  FaTruck,
  FaRing,
  FaTshirt,
  FaBook,
  FaDumbbell,
  FaCut,
  FaChevronUp,
  FaPlus,
  FaFilter,
  FaBoxes,
  FaTimes,
  FaThList,
  FaGift,
} from "react-icons/fa";

// ------------------------
// ثابت المحافظات الفلسطينية
// ------------------------
const PALESTINIAN_GOVS = [
  "القدس",
  "رام الله والبيرة",
  "الخليل",
  "نابلس",
  "جنين",
  "أريحا والأغوار",
  "طوباس",
  "طولكرم",
  "قلقيلية",
  "سلفيت",
  "بيت لحم",
  "غزة",
  "شمال غزة",
  "دير البلح",
  "خان يونس",
  "رفح",
];

// ------------------------
// بيانات الخدمات والفئات
// ------------------------
const SERVICE_CATEGORIES = [
  {
    id: "commercial",
    title: "خدمات تجارية",
    icon: <FaStore className="text-xl" />,
    services: [
      { id: "stores", title: "متاجر", icon: <FaStore className="text-2xl" />, color: "bg-blue-500" },
      { id: "malls", title: "مراكز تجارية", icon: <FaShoppingBag className="text-2xl" />, color: "bg-purple-600" },
      { id: "restaurants", title: "مطاعم", icon: <FaUtensils className="text-2xl" />, color: "bg-purple-500" },
      { id: "pharmacies", title: "صيدليات", icon: <FaPills className="text-2xl" />, color: "bg-red-600" },
      { id: "jewelry", title: "مجوهرات", icon: <FaRing className="text-2xl" />, color: "bg-yellow-500" },
      { id: "fashion", title: "أزياء", icon: <FaTshirt className="text-2xl" />, color: "bg-indigo-600" },
    ],
  },
  {
    id: "real-estate&lands",
    title: "عقارات وأراضي",
    icon: <FaHome className="text-xl" />,
    services: [
      { id: "real-estate", title: "عقارات", icon: <FaHome className="text-2xl" />, color: "bg-green-500" },
      { id: "lands", title: "أراضي", icon: <FaMapMarkedAlt className="text-2xl" />, color: "bg-amber-500" },
      { id: "hotels", title: "فنادق", icon: <FaHotel className="text-2xl" />, color: "bg-amber-600" },
      { id: "wedding-halls", title: "صالات أفراح", icon: <FaGlassCheers className="text-2xl" />, color: "bg-pink-600" },
    ],
  },
  {
    id: "vehicles",
    title: "مركبات ومواصلات",
    icon: <FaCar className="text-xl" />,
    services: [
      { id: "cars", title: "سيارات", icon: <FaCar className="text-2xl" />, color: "bg-red-500" },
      { id: "gas-stations", title: "محطات وقود", icon: <FaGasPump className="text-2xl" />, color: "bg-blue-600" },
      { id: "delivery", title: "توصيل", icon: <FaTruck className="text-2xl" />, color: "bg-green-600" },
    ],
  },
  {
    id: "health",
    title: "صحة ولياقة",
    icon: <FaClinicMedical className="text-xl" />,
    services: [
      { id: "hospitals", title: "مستشفيات", icon: <FaHospital className="text-2xl" />, color: "bg-rose-500" },
      { id: "clinics", title: "عيادات", icon: <FaClinicMedical className="text-2xl" />, color: "bg-emerald-500" },
      { id: "gyms", title: "نوادي رياضية", icon: <FaDumbbell className="text-2xl" />, color: "bg-red-700" },
      { id: "beauty-centers", title: "مراكز تجميل", icon: <FaCut className="text-2xl" />, color: "bg-pink-400" },
    ],
  },
  {
    id: "education",
    title: "تعليم وتطوير",
    icon: <FaGraduationCap className="text-xl" />,
    services: [
      { id: "courses", title: "دورات", icon: <FaGraduationCap className="text-2xl" />, color: "bg-pink-500" },
      { id: "libraries", title: "مكتبات", icon: <FaBook className="text-2xl" />, color: "bg-amber-700" },
    ],
  },
  {
    id: "other",
    title: "خدمات أخرى",
    icon: <FaBoxes className="text-xl" />,
    services: [
      { id: "jobs", title: "وظائف", icon: <FaBriefcase className="text-2xl" />, color: "bg-indigo-500" },
      { id: "entertainment", title: "ترفيه", icon: <FaTheaterMasks className="text-2xl" />, color: "bg-cyan-500" },
      { id: "gifts", title: "هدايا", icon: <FaGift className="text-2xl" />, color: "bg-rose-400" },
    ],
  },
];

// تجميع جميع الخدمات في مصفوفة مسطحة
const ALL_SERVICES = SERVICE_CATEGORIES.flatMap((cat) =>
  cat.services.map((s) => ({
    ...s,
    id: s.id,
    originalId: s.id,
    categoryId: cat.id,
    categoryTitle: cat.title,
  }))
);

// خريطة الخدمة → اسم التصنيف الفرعي (كما حفظناه بجدول categories)
const SERVICE_TO_CATEGORY_NAME = {
  stores: "متاجر",
  malls: "مراكز تجارية",
  restaurants: "مطاعم",
  pharmacies: "صيدليات",
  jewelry: "مجوهرات",
  fashion: "أزياء",

  "real-estate": "عقارات",
  lands: "أراضي",
  hotels: "فنادق",
  "wedding-halls": "صالات أفراح",

  cars: "سيارات",
  "gas-stations": "محطات وقود",
  delivery: "توصيل",

  hospitals: "مستشفيات",
  clinics: "عيادات",
  gyms: "نوادي رياضية",
  "beauty-centers": "مراكز تجميل",

  courses: "دورات",
  libraries: "مكتبات",

  jobs: "وظائف",
  entertainment: "ترفيه",
  gifts: "هدايا",
};

// ------------------------
// أدوات مساعدة
// ------------------------
const getAddBtnText = (serviceId) => {
  const translations = {
    stores: "إضافة متجر",
    "real-estate": "إضافة عقار",
    lands: "إضافة أرض",
    cars: "إضافة سيارة",
    restaurants: "إضافة مطعم",
    jobs: "إضافة وظيفة",
    courses: "إضافة دورة",
    hospitals: "إضافة مستشفى",
    clinics: "إضافة عيادة",
    entertainment: "إضافة مكان ترفيهي",
    hotels: "إضافة فندق",
    pharmacies: "إضافة صيدلية",
    "gas-stations": "إضافة محطة وقود",
    malls: "إضافة مركز تجاري",
    "wedding-halls": "إضافة صالة أفراح",
    delivery: "إضافة خدمة توصيل",
    jewelry: "إضافة معرض مجوهرات",
    fashion: "إضافة متجر أزياء",
    gifts: "إضافة متجر هدايا",
    "beauty-centers": "إضافة مركز تجميل",
    gyms: "إضافة نادٍ رياضي",
    libraries: "إضافة مكتبة",
  };
  return translations[serviceId] || "إضافة";
};

// Quick-Add services (تظهر في FAB)
const QUICK_ADD = [
  { id: "stores", title: "متجر", icon: <FaStore /> },
  { id: "real-estate", title: "عقار", icon: <FaHome /> },
  { id: "cars", title: "سيارة", icon: <FaCar /> },
  { id: "jobs", title: "وظيفة", icon: <FaBriefcase /> },
];

// ------------------------
// الكومبوننت الرئيسي
// ------------------------
export default function ServicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const isAuthenticated = !!user;

  // returnUrl الصحيح
  const returnUrl = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  // دالة للتحقق من تسجيل الدخول مع اختبار الجلسة
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // تأثير للتحقق من حالة المصادقة عند التحميل
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // التحقق من صلاحية التوكن
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const isTokenExpired = tokenPayload.exp * 1000 < Date.now();
            
            if (isTokenExpired) {
              console.log('انتهت صلاحية الجلسة');
              localStorage.removeItem('token');
              setShowLoginPrompt(true);
            } else if (!user) {
              console.log('جلسة صالحة، جاري تحميل بيانات المستخدم...');
              await refreshUser(); // تحديث بيانات المستخدم
            }
          } catch (e) {
            console.error('خطأ في فحص التوكن:', e);
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
      } finally {
        setIsCheckingAuth(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [user, refreshUser]);

  const requireAuth = useCallback(
    async (action) => {
      try {
        // إذا كان جاري فحص المصادقة، ننتظر حتى ينتهي
        if (authLoading) {
          console.log('جاري التحميل...');
          return false;
        }

        // إذا كان المستخدم مسجل الدخول
        if (user) {
          console.log('المستخدم مسجل الدخول');
          if (typeof action === 'function') {
            await action();
          }
          return true;
        }

        // إذا كان هناك توكن، نحاول تحديث بيانات المستخدم
        const token = localStorage.getItem('token');
        if (token) {
          try {
            console.log('جاري تحديث بيانات المستخدم...');
            await refreshUser();
            if (user && typeof action === 'function') {
              await action();
              return true;
            }
          } catch (error) {
            console.error('فشل في تحديث بيانات المستخدم:', error);
          }
        }

        // إذا وصلنا إلى هنا، يجب تسجيل الدخول
        console.log('يجب تسجيل الدخول للمتابعة');
        setAuthError('يجب تسجيل الدخول للمتابعة');
        setShowLoginPrompt(true);
        return false;
      } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        setAuthError('حدث خطأ في التحقق من الجلسة');
        setShowLoginPrompt(true);
        return false;
      }
    },
    [authLoading, user, refreshUser]
  );

  // حالة التفعيل/الهايليت
  const [activeSection, setActiveSection] = useState(null);
  const sidebarRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showGovFilter, setShowGovFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGov, setSelectedGov] = useState("");

  // نموذج الإضافة
  const [showForm, setShowForm] = useState(false);
  const [currentService, setCurrentService] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    governorate: "",
    price: "",
  });

  // التاغات
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // ------------------------
  // handle scroll لإظهار زر للأعلى
  // ------------------------
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // البحث عن التاغات (debounce)
  useEffect(() => {
    const q = tagQuery.trim();
    if (!q) {
      setTagResults([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json(); // [{id,name}]
          setTagResults(data);
        }
      } catch {}
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [tagQuery]);

  const addTag = (name) => {
    const n = (name || "").trim();
    if (!n) return;
    if (!selectedTags.includes(n)) setSelectedTags((p) => [...p, n]);
    setTagQuery("");
    setTagResults([]);
  };
  const removeTag = (name) =>
    setSelectedTags((p) => p.filter((t) => t !== name));

  // ------------------------
  // البحث والفلاتر (useMemo)
  // ------------------------
  const filteredCategories = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    return SERVICE_CATEGORIES.map((cat) => {
      const services = cat.services.filter((s) =>
        s.title.toLowerCase().includes(lower)
      );
      return { ...cat, services };
    }).filter((cat) => cat.services.length > 0);
  }, [searchQuery]);

  // ------------------------
  // دوال مساعدة
  // ------------------------
  const scrollTo = useCallback((id) => {
    setActiveSection(id);
    let element = document.getElementById(id);
    if (!element) {
      const serviceSections = document.querySelectorAll("[data-service-section]");
      for (const section of serviceSections) {
        if (section.id.endsWith(`-${id}`)) {
          element = section;
          break;
        }
      }
      if (!element) {
        const categorySections = document.querySelectorAll(".service-category");
        for (const section of categorySections) {
          if (section.id === id) {
            element = section;
            break;
          }
        }
      }
    }
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  }, []);

  const handleQuickAdd = (serviceId) => {
    requireAuth(() => {
      setCurrentService(serviceId);
      setShowForm(true);
      setShowFabMenu(false);
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      title: "",
      description: "",
      governorate: "",
      price: "",
    });
    setSelectedTags([]);
    setTagQuery("");
    setTagResults([]);
  };

  // دالة مساعدة للحصول على المستخدم من الطلب مع تسجيل تفصيلي
  const getCurrentUser = async () => {
    try {
      console.log('=== بدء عملية التحقق من المصادقة ===');
      
      // 1. التحقق من localStorage أولاً
      const localStorageToken = localStorage.getItem('token');
      console.log('التحقق من localStorage:', localStorageToken ? 'تم العثور على توكن' : 'لا يوجد توكن');
      
      if (localStorageToken) {
        console.log('تم العثور على التوكن في localStorage');
        return { token: localStorageToken };
      }
      
      // 2. إذا لم يتم العثور على التوكن في localStorage، نتحقق من الكعكات
      console.log('جاري فحص ملفات تعريف الارتباط (cookies)...');
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      console.log('جميع ملفات تعريف الارتباط:', cookies);
      
      const cookieToken = cookies.token || cookies['token'];
      if (cookieToken) {
        console.log('تم العثور على التوكن في ملفات تعريف الارتباط');
        // تخزين التوكن في localStorage للاستخدام المستقبلي
        localStorage.setItem('token', cookieToken);
        return { token: cookieToken };
      }
      
      // 3. إذا لم يتم العثور على التوكن في أي مكان
      console.log('لم يتم العثور على توكن مصادقة في أي مكان');
      return null;
      
    } catch (error) {
      console.error('حدث خطأ أثناء محاولة الحصول على بيانات المستخدم:', error);
      return null;
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    console.log('=== بدء عملية إرسال النموذج ===');

    // 1. الحصول على بيانات المستخدم الحالي مع تسجيل تفصيلي
    console.log('جاري التحقق من حالة تسجيل الدخول...');
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !currentUser.token) {
      console.error('فشل التحقق من المصادقة: لم يتم العثور على توكن');
      console.log('تفاصيل المستخدم الحالي:', currentUser);
      
      // التحقق من وجود عناصر واجهة المستخدم المطلوبة
      console.log('عنصر نموذج تسجيل الدخول:', document.getElementById('login-form') ? 'موجود' : 'غير موجود');
      
      setAuthError('يجب تسجيل الدخول أولاً');
      setShowLoginPrompt(true);
      return;
    }
    
    const token = currentUser.token;
    console.log('تم التحقق من المصادقة بنجاح');
    console.log('طول التوكن:', token ? token.length : 'غير محدد');
    console.log('بداية التوكن:', token ? token.substring(0, 10) + '...' : 'غير محدد');

    console.log('الخدمة المحددة:', currentService);
    const categoryName = SERVICE_TO_CATEGORY_NAME[currentService];
    console.log('اسم التصنيف:', categoryName);
    
    if (!categoryName) {
      const errorMsg = "تعذر تحديد التصنيف لهذه الخدمة.";
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      governorate: formData.governorate || "",
      price:
        formData.price !== "" && formData.price !== null
          ? Number(formData.price)
          : null,
      categoryName,
      tags: selectedTags,
    };
    
    console.log('بيانات الإرسال (Payload):', JSON.stringify(payload, null, 2));

    try {
      console.log('جاري إرسال الطلب إلى /api/posts...');
      
      // إعداد الهيدرز مع التوكن
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // إرسال الطلب مع الهيدرز
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });
      
      console.log('حالة الاستجابة:', res.status, res.statusText);
      
      if (res.status === 401) {
        console.log('تم رفض الطلب بسبب عدم المصادقة (401)');
        // إذا كان الخطأ 401، نقوم بتحديث التوكن وجعله يحاول مرة أخرى
        try {
          // محاولة تحديث بيانات المستخدم
          await refreshUser();
          
          // الحصول على بيانات المستخدم الحالي بعد التحديث
          const currentUser = await getCurrentUser();
          
          if (currentUser && currentUser.token) {
            console.log('إعادة المحاولة مع التوكن الجديد...');
            
            const retryRes = await fetch("/api/posts", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
              },
              body: JSON.stringify(payload),
            });
            
            const retryData = await retryRes.json();
            if (!retryRes.ok) {
              throw new Error(retryData.message || 'فشل في إضافة المنشور بعد تحديث الجلسة');
            }
            
            resetForm();
            alert("تم إرسال منشورك للمراجعة. بانتظار موافقة الإدارة.");
            return;
          }
        } catch (retryError) {
          console.error('فشل إعادة المحاولة بعد تحديث الجلسة:', retryError);
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
      }
      
      const data = await res.json().catch(e => {
        console.error('فشل في تحليل استجابة JSON:', e);
        return { message: 'استجابة غير صالحة من الخادم' };
      });
      
      console.log('استجابة الخادم:', data);
      
      if (!res.ok) {
        const errorMsg = data?.message || `حدث خطأ (${res.status})`;
        console.error('خطأ من الخادم:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('تمت إضافة المنشور بنجاح');
      resetForm();
      alert("تم إرسال منشورك للمراجعة. بانتظار موافقة الإدارة.");
      
    } catch (err) {
      console.error('خطأ في إضافة المنشور:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      if (err.message === 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى' || 
          err.message.includes('401')) {
        setAuthError('انتهت جلستك. يرجى تسجيل الدخول مرة أخرى');
        setShowLoginPrompt(true);
      } else {
        const errorMessage = err.message || "حدث خطأ أثناء محاولة إضافة المنشور. يرجى المحاولة مرة أخرى.";
        console.error('عرض رسالة الخطأ للمستخدم:', errorMessage);
        alert(errorMessage);
      }
    }
  };

  // ------------------------
  // Mobile bottom navigation
  // ------------------------
  const mobileNavRef = useRef(null);
  const subNavRef = useRef(null);
  const [mobileActiveTab, setMobileActiveTab] = useState("all");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showSubNav, setShowSubNav] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(null);

  useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      lastScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = lastScrollY + 150;
          const sections = document.querySelectorAll(
            ".service-category, [data-service-section]"
          );
          let currentSection = null;

          sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (
              scrollPosition >= sectionTop &&
              scrollPosition < sectionTop + sectionHeight - 100
            ) {
              currentSection = section.id;
            }
          });

          if (currentSection) {
            setActiveSection((prev) =>
              prev !== currentSection ? currentSection : prev
            );
          } else if (window.scrollY < 100) {
            setActiveSection((prev) => (prev !== "services" ? "services" : prev));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!activeSection || !sidebarRef.current) return;
    const activeElement = sidebarRef.current.querySelector(
      `[aria-current="true"], [href="#${activeSection}"]`
    );
    if (activeElement) {
      if (window.scrollTimeout) cancelAnimationFrame(window.scrollTimeout);
      const sidebar = sidebarRef.current;
      const startTime = performance.now();
      const duration = 600;
      const startScrollTop = sidebar.scrollTop;
      const elementRect = activeElement.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const elementTop = elementRect.top - sidebarRect.top + sidebar.scrollTop;
      const targetScroll =
        elementTop - sidebarRect.height / 2 + elementRect.height / 2;

      const smoothScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const eased = easeOutCubic(progress);
        sidebar.scrollTop =
          startScrollTop + (targetScroll - startScrollTop) * eased;
        if (progress < 1) window.scrollTimeout = requestAnimationFrame(smoothScroll);
      };
      window.scrollTimeout = requestAnimationFrame(smoothScroll);
    }
    return () => {
      if (window.scrollTimeout) cancelAnimationFrame(window.scrollTimeout);
    };
  }, [activeSection]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) return;
      const scrollPosition = window.scrollY + 100;

      const categorySections = Array.from(
        document.querySelectorAll(".service-category")
      );
      const serviceSections = Array.from(
        document.querySelectorAll("[data-service-section]")
      );
      let currentSection = "all";
      let currentSubSection = null;

      for (const section of serviceSections) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        if (
          scrollPosition >= sectionTop - 100 &&
          scrollPosition < sectionTop + sectionHeight - 100
        ) {
          const sectionId = section.id;
          currentSubSection = sectionId;
          const categoryId = sectionId.split("-").slice(0, -1).join("-");
          currentSection = categoryId;
          break;
        }
      }

      if (!currentSubSection) {
        for (const section of categorySections) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          if (
            scrollPosition >= sectionTop - 100 &&
            scrollPosition < sectionTop + sectionHeight - 100
          ) {
            currentSection = section.id;
            break;
          }
        }
      }

      setMobileActiveTab(currentSection);
      if (currentSubSection) {
        setActiveSubTab(currentSubSection);
        setShowSubNav(true);
        setExpandedCategory(currentSection);
      }

      const activeTab = document.querySelector(
        `[data-tab="${currentSection}"]`
      );
      if (activeTab && mobileNavRef.current) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId, isSubTab = false) => {
    if (sectionId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMobileActiveTab("all");
      setShowSubNav(false);
      setExpandedCategory(null);
    } else if (isSubTab) {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 120;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        setActiveSubTab(sectionId);
      }
    } else {
      const category = SERVICE_CATEGORIES.find((cat) => cat.id === sectionId);
      if (category) {
        setExpandedCategory(expandedCategory === sectionId ? null : sectionId);
        setShowSubNav(true);
        setMobileActiveTab(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }
    }
  };

  // JSX
  // ------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
      {/* --- Sidebar (Desktop) --- */}
      <aside
        ref={sidebarRef}
        className="sidebar-container hidden md:block w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto h-screen sticky top-0"
      >
        <div className="p-4 space-y-1">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            الأقسام
          </h2>
          {/* زر الكل */}
          <a
            href="#"
            aria-current={!activeSection || activeSection === "services"}
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                !activeSection || activeSection === "services"
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
            `}
          >
            <FaThList className="ml-2" />
            الكل
          </a>

          {/* الفئات + خدماتها */}
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <a
                href={`#${cat.id}`}
                aria-current={activeSection === cat.id}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(cat.id);
                }}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${
                    activeSection === cat.id
                      ? "bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400 dark:ring-amber-500 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                {cat.icon}
                <span className="ml-2">{cat.title}</span>
              </a>
              {cat.services.map((s) => {
                const serviceUniqueId = `${cat.id}-${s.id}`;
                return (
                  <a
                    key={s.id}
                    href={`#${serviceUniqueId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(serviceUniqueId);
                    }}
                    className={`flex items-center px-4 py-2 pr-8 rounded-lg text-sm transition-colors
                      ${
                        activeSection === serviceUniqueId
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mr-2"></span>
                    {s.title}
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 py-4 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pb-20 md:pb-8">
        {/* أقسام الفئات */}
        {filteredCategories.map((cat) => (
          <section key={cat.id} id={cat.id} className="py-12 service-category">
            <header className="max-w-7xl mx-auto flex items-center mb-8 px-4 sm:px-0">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-4 text-amber-600 dark:text-amber-400">
                {cat.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {cat.title}
              </h2>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {cat.services.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-shadow overflow-hidden h-full flex flex-col"
                >
                  <div className="p-3 sm:p-4 text-center flex-1 flex flex-col">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg ${s.color} bg-opacity-10 flex items-center justify-center mb-2 sm:mb-3`}
                    >
                      {React.cloneElement(s.icon, { className: "text-lg sm:text-2xl" })}
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {s.title}
                    </h3>
                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => handleQuickAdd(s.id)}
                        className="w-full inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        <FaPlus className="ml-1" size={12} />
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* أقسام الخدمات الفردية */}
        {ALL_SERVICES.map((s) => {
          const uniqueId = `${s.categoryId}-${s.id}`;
          return (
            <section
              key={uniqueId}
              id={uniqueId}
              data-service-section
              className="py-16 border-t border-gray-200 dark:border-gray-700 px-4"
            >
              <div className="max-w-7xl mx-auto">
                <header className="flex items-center mb-8">
                  <div className={`w-12 h-12 rounded-lg ${s.color} bg-opacity-10 flex items-center justify-center mr-4`}>
                    {s.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {s.title}
                  </h2>
                  <button
                    onClick={() => handleQuickAdd(s.id)}
                    className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    <FaPlus className="ml-1" />
                    {getAddBtnText(s.id)}
                  </button>
                </header>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-600 dark:text-gray-300">
                  محتوى {s.title} سيظهر هنا
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* --- Floating Buttons --- */}
      <div className="fixed bottom-24 left-6 z-20 flex flex-col items-start space-y-3">
        {/* زر الفلاتر */}
        <button
          aria-label="فلتر المحافظات"
          onClick={() => setShowGovFilter((v) => !v)}
          className="w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          <FaFilter className="text-xl" />
        </button>

        {/* FAB */}
        <button
          aria-label={showFabMenu ? "إغلاق القائمة" : "إضافة جديد"}
          onClick={() => setShowFabMenu((v) => !v)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 transform ${
            showFabMenu ? "bg-red-500 hover:bg-red-600 rotate-45" : "bg-amber-500 hover:bg-amber-600"
          }`}
        >
          <FaPlus className="text-xl" />
        </button>
      </div>

      {/* قائمة الإضافة السريعة */}
      {showFabMenu && (
        <div className="fixed bottom-40 left-6 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-30">
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ADD.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuickAdd(q.id)}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-24"
              >
                <span className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
                  {q.icon}
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{q.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* زر للأعلى */}
      {showScrollTop && (
        <button
          aria-label="الانتقال إلى الأعلى"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-40"
        >
          <FaChevronUp className="text-xl" />
        </button>
      )}

      {/* فلتر المحافظات (عرض فقط) */}
      {showGovFilter && (
        <div className="fixed bottom-60 left-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-3 border border-gray-200 dark:border-gray-700 z-30 w-48">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">فلتر حسب المحافظة</h4>
          <select
            value={selectedGov}
            onChange={(e) => setSelectedGov(e.target.value)}
            className="w-full p-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="">جميع المحافظات</option>
            {PALESTINIAN_GOVS.map((gov) => (
              <option key={gov}>{gov}</option>
            ))}
          </select>
        </div>
      )}

      {/* مودال إضافة منشور */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 relative">
            <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                إضافة {ALL_SERVICES.find((s) => s.id === currentService)?.title}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </header>

            <form onSubmit={submitForm} className="p-4 space-y-3">
              {/* العنوان */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="title">
                  العنوان (مثال: أرض للبيع في نابلس)
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* السعر (اختياري) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="price">
                  السعر (اختياري)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="مثال: 12500"
                  value={formData.price}
                  onChange={handleFormChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="description">
                  الوصف
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              {/* المحافظة */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="governorate">
                  المحافظة
                </label>
                <select
                  id="governorate"
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                >
                  <option value="">اختر المحافظة</option>
                  {PALESTINIAN_GOVS.map((gov) => (
                    <option key={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              {/* التاغات */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  التاغات
                </label>

                <input
                  placeholder="ابحث عن تاغ ثم Enter للإضافة"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagQuery);
                    }
                  }}
                />

                {tagResults.length > 0 && (
                  <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 max-h-40 overflow-auto">
                    {tagResults.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => addTag(t.name)}
                        className="w-full text-right px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedTags.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-xs"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeTag(name)}
                        className="text-amber-700 dark:text-amber-300 hover:opacity-80"
                        aria-label={`حذف ${name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md shadow focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                حفظ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Sub Categories Navigation */}
        {showSubNav && expandedCategory && (
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-b border-gray-200/80 dark:border-gray-700/80 shadow-sm">
            <div
              ref={subNavRef}
              className="flex overflow-x-auto py-1.5 px-1.5 space-x-1.5 no-scrollbar scroll-smooth"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {SERVICE_CATEGORIES.find((cat) => cat.id === expandedCategory)?.services.map(
                (service) => {
                  const serviceId = `${expandedCategory}-${service.id}`;
                  return (
                    <div key={serviceId} className="flex-shrink-0">
                      <button
                        data-subtab={serviceId}
                        onClick={() => scrollToSection(serviceId, true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center h-9 ${
                          activeSubTab === serviceId
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                            : "text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <span className="ml-1.5">{service.icon}</span>
                        <span>{service.title}</span>
                      </button>
                    </div>
                  );
                }
              )}
              <button
                onClick={() => setShowSubNav(false)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center ه-9"
              >
                <FaTimes className="ml-1" />
                <span>إغلاق</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Categories Navigation */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200/80 dark:border-gray-700/80 shadow-lg">
          <div
            ref={mobileNavRef}
            className="flex overflow-x-auto py-2 px-1.5 space-x-1.5 no-scrollbar scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* All Tab */}
            <div className="flex-shrink-0">
              <button
                data-tab="all"
                onClick={() => scrollToSection("all")}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center min-w-[70px] h-11 ${
                  mobileActiveTab === "all"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                }`}
              >
                <FaThList className="ml-1.5 text-sm" />
                <span>الكل</span>
              </button>
            </div>

            {/* Category Tabs */}
            {SERVICE_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex-shrink-0">
                <button
                  data-tab={cat.id}
                  onClick={() => scrollToSection(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center min-w-[100px] h-11 ${
                    mobileActiveTab === cat.id
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <span className="ml-1.5">{cat.icon}</span>
                  <span>{cat.title}</span>
                  {mobileActiveTab === cat.id && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* padding for fixed bottom nav */}
      <div className={`pb-${showSubNav ? "36" : "24"} md:pb-0`}></div>

      {/* نافذة تنبيه تسجيل الدخول */}
      <Dialog
        open={!isAuthenticated && showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        dir="rtl"
      >
        <DialogTitle id="alert-dialog-title">
          تنبيه
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {authError || 'يجب تسجيل الدخول للمتابعة'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoginPrompt(false)} color="primary">
            إلغاء
          </Button>
          <Button
            onClick={() => {
              setShowLoginPrompt(false);
              // نحفظ المسار الحالي للعودة بعد تسجيل الدخول
              const url = '/auth?returnUrl=' + encodeURIComponent(returnUrl || '/services');
              router.push(url);
            }}
            color="primary"
            autoFocus
          >
            تسجيل الدخول
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
          background: transparent;
        }
        .scroll-smooth {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}
