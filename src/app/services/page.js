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
import { useCategories } from "@/hooks/useCategories";
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
  FaUser,
  FaDumbbell,
  FaCut,
  FaChevronUp,
  FaPlus,
  FaFilter,
  FaBoxes,
  FaTimes,
  FaThList,
  FaTags,
  FaGift,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
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
// إعدادات الأيقونات والألوان للخدمات
// ------------------------
const SERVICE_ICONS = {
  // خدمات تجارية
  "متاجر": FaStore,
  "مراكز تجارية": FaShoppingBag,
  "مطاعم": FaUtensils,
  "صيدليات": FaPills,
  "مجوهرات": FaRing,
  "أزياء": FaTshirt,
  
  // عقارات وأراضي
  "عقارات": FaHome,
  "أراضي": FaMapMarkedAlt,
  "فنادق": FaHotel,
  "صالات أفراح": FaGlassCheers,
  
  // مركبات ومواصلات
  "سيارات": FaCar,
  "محطات وقود": FaGasPump,
  "توصيل": FaTruck,
  
  // صحة ولياقة
  "مستشفيات": FaHospital,
  "عيادات": FaClinicMedical,
  "نوادي رياضية": FaDumbbell,
  "مراكز تجميل": FaCut,
  
  // تعليم وتطوير
  "دورات": FaGraduationCap,
  "مكتبات": FaBook,
  
  // خدمات أخرى
  "وظائف": FaBriefcase,
  "ترفيه": FaTheaterMasks,
  "هدايا": FaGift,
};

const SERVICE_COLORS = {
  // خدمات تجارية
  "متاجر": "bg-blue-500",
  "مراكز تجارية": "bg-purple-600",
  "مطاعم": "bg-purple-500",
  "صيدليات": "bg-red-600",
  "مجوهرات": "bg-yellow-500",
  "أزياء": "bg-indigo-600",
  
  // عقارات وأراضي
  "عقارات": "bg-green-500",
  "أراضي": "bg-amber-500",
  "فنادق": "bg-amber-600",
  "صالات أفراح": "bg-pink-600",
  
  // مركبات ومواصلات
  "سيارات": "bg-red-500",
  "محطات وقود": "bg-blue-600",
  "توصيل": "bg-green-600",
  
  // صحة ولياقة
  "مستشفيات": "bg-rose-500",
  "عيادات": "bg-emerald-500",
  "نوادي رياضية": "bg-red-700",
  "مراكز تجميل": "bg-pink-400",
  
  // تعليم وتطوير
  "دورات": "bg-pink-500",
  "مكتبات": "bg-amber-700",
  
  // خدمات أخرى
  "وظائف": "bg-indigo-500",
  "ترفيه": "bg-cyan-500",
  "هدايا": "bg-rose-400",
};

// أيقونات الأقسام الرئيسية
const CATEGORY_ICONS = {
  "خدمات تجارية": FaStore,
  "عقارات وأراضي": FaHome,
  "مركبات ومواصلات": FaCar,
  "صحة ولياقة": FaClinicMedical,
  "تعليم وتطوير": FaGraduationCap,
  "خدمات أخرى": FaBoxes,
};

// ------------------------
// أدوات مساعدة
// ------------------------
const getAddBtnText = (categoryName) => {
  return `إضافة ${categoryName}`;
};

// Quick-Add services (تظهر في FAB) - سيتم تحديثها ديناميكياً
const DEFAULT_QUICK_ADD = [
  { id: "stores", title: "متجر", icon: <FaStore /> },
  { id: "real-estate", title: "عقار", icon: <FaHome /> },
  { id: "cars", title: "سيارة", icon: <FaCar /> },
  { id: "jobs", title: "وظيفة", icon: <FaBriefcase /> },
];

/* =========================
   إضافة عرض المنشورات فقط
   (لا تغييرات على التصميم)
========================= */
function PostCard({ post, isAuthenticated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const router = useRouter();
  
  const openModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };
  
  const startChat = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated || !post.user_id) return;
    
    setIsStartingChat(true);
    try {
      // Create or get conversation with the post author
      const response = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: post.user_id,
          message: `مرحباً، أنا مهتم بمنشورك: ${post.title}`,
          postId: post.id
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.conversationId) {
        // Redirect to the chat section with the conversation ID
        // Use window.location to force a full page reload to ensure chat state is properly initialized
        window.location.href = `/profile?section=chat&conversation=${data.conversationId}`;
      } else {
        throw new Error(data.error || 'فشل في بدء المحادثة');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert(error.message || 'حدث خطأ أثناء محاولة بدء المحادثة');
    } finally {
      setIsStartingChat(false);
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const price =
    post?.price != null && post?.price !== ""
      ? Number(post.price).toLocaleString("ar-EG")
      : null;
  const created = post?.created_at 
    ? new Date(post.created_at).toLocaleDateString("ar-EG", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "-";

  // Get service icon based on category name
  const getServiceIcon = (categoryName, iconClass = '') => {
    if (!categoryName) return <FaStore className={iconClass} />;
    
    const IconComponent = SERVICE_ICONS[categoryName] || FaStore;
    return <IconComponent className={iconClass} />;
  };

  // Get service name for display
  const getServiceName = (categoryName) => {
    return categoryName || 'خدمة';
  };

  // Get category color if available
  const getCategoryColor = (categoryName) => {
    return SERVICE_COLORS[categoryName] || 'bg-blue-500';
  };

  // Determine publisher name based on anonymous status
  const publisherName = post.is_anonymous 
    ? "مجهول" 
    : post.user_name || (post.user_id ? `مستخدم ${post.user_id.substring(0, 4)}` : "مستخدم");
    
  // Check if we should show contact button (not anonymous and user is logged in)
  const showContactButton = !post.is_anonymous && isAuthenticated;

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full transform hover:-translate-y-1">
      {/* Service Icon Section */}
      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-7xl text-amber-400 dark:text-amber-500 opacity-90">
          {getServiceIcon(post.category_name)}
        </div>
        
        {/* Category Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-medium text-white ${getCategoryColor(post.category_name)} shadow-md flex items-center gap-2`}>
          {getServiceIcon(post.category_name, 'text-sm')}
          <span className="text-xs">{getServiceName(post.category_name) || 'تصنيف'}</span>
        </div>
        
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          post.is_visible 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {post.is_visible ? '' : ''}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 min-h-[3rem]">
          {post.title || 'عنوان غير محدد'}
        </h3>
        
        {/* Basic Info - Always Visible */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FaUser className="text-blue-500 flex-shrink-0" />
              <span className="truncate">
                {publisherName}
              </span>
            </div>
            {showContactButton && (
              <button 
                onClick={startChat}
                disabled={isStartingChat}
                className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="تواصل مع الناشر"
              >
                {isStartingChat ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <FaEnvelope className="text-xs" />
                    <span>تواصل</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <FaMapMarkedAlt className="text-amber-500 flex-shrink-0" />
            <span>{post.governorate || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FaClock className="text-gray-400" />
            <span>أضيف {created}</span>
          </div>
        </div>
        
        
        {/* Action Button */}
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={openModal}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            عرض التفاصيل
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        
        {/* Modal for Full Details */}
        <Dialog
          open={isModalOpen}
          onClose={closeModal}
          maxWidth="md"
          fullWidth
          className="rtl"
          PaperProps={{
            className: 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700'
          }}
        >
          <DialogTitle className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                {getServiceIcon(post.category_name, 'w-6 h-6 text-white')}
              </div>
              <h2 className="text-xl font-bold">تفاصيل {post.title}</h2>
            </div>
            <button 
              onClick={closeModal}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="إغلاق"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </DialogTitle>
          
          <DialogContent className="p-0 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0 h-full">
              {/* Left Column - Image with Service Icon */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-800 dark:to-gray-900 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-300 dark:bg-amber-800 rounded-full filter blur-3xl opacity-50"></div>
                  <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-300 dark:bg-blue-900 rounded-full filter blur-3xl opacity-30"></div>
                </div>
                <div className="relative z-10 text-center">
                  <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform transition-transform duration-500 hover:scale-105">
                    {getServiceIcon(post.category_name, 'w-16 h-16 text-amber-500 dark:text-amber-400')}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {post.title || 'عنوان غير محدد'}
                  </h3>
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    {getServiceName(post.category_name) || 'خدمة'}
                  </p>
                  
                  {price && (
                    <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                      <div className="flex items-center justify-center gap-2">
                        <FaMoneyBillWave className="text-amber-500 text-xl" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {price} شيكل
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column - Details */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-6">
                  {/* Meta Info */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FaUser className="text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-500 dark:text-gray-400 text-xs">الناشر</p>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white">{publisherName}</p>
                            {showContactButton && (
                              <button 
                                onClick={startChat}
                                disabled={isStartingChat}
                                className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="تواصل مع الناشر"
                              >
                                {isStartingChat ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري التحميل...
                                  </>
                                ) : (
                                  <>
                                    <FaEnvelope className="text-xs" />
                                    <span>تواصل</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <FaCalendarAlt className="text-amber-500" />
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">تاريخ النشر</p>
                          <p className="font-medium text-gray-900 dark:text-white">{created}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FaInfoCircle className="text-blue-500" />
                      <span>الوصف</span>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {post.description || 'لا يوجد وصف متوفر'}
                    </p>
                  </div>
                  
                  {/* Location */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-green-500" />
                      <span>الموقع</span>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {[post.governorate, post.city, post.area].filter(Boolean).join('، ') || 'غير محدد'}
                    </p>
                  </div>
                  
                  {/* Contact Information */}
                  {(post.phone || post.email) && (
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">معلومات التواصل</h4>
                      <div className="space-y-3">
                        {post.phone && (
                          <a 
                            href={`tel:${post.phone}`}
                            className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                          >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                              <FaPhone className="text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500 dark:text-gray-400">اتصل الآن</p>
                              <p className="font-medium text-blue-600 dark:text-blue-400">{post.phone}</p>
                            </div>
                            <FaChevronUp className="text-blue-400 text-xs transform rotate-90" />
                          </a>
                        )}
                        
                        {post.email && (
                          <a 
                            href={`mailto:${post.email}`}
                            className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group"
                          >
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800/30 transition-colors">
                              <FaEnvelope className="text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
                              <p className="font-medium text-amber-600 dark:text-amber-400 truncate">{post.email}</p>
                            </div>
                            <FaChevronUp className="text-amber-400 text-xs transform rotate-90" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FaTags className="text-purple-500" />
                        <span>الوسوم</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.flatMap(t => 
                          t.split(',').map(tag => tag.trim()).filter(Boolean)
                        ).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 text-amber-800 dark:text-amber-200 text-xs font-medium hover:from-amber-200 hover:to-amber-100 dark:hover:from-amber-800/40 dark:hover:to-amber-800/20 transition-all duration-300 shadow-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
          
          <DialogActions className="bg-gray-50 dark:bg-gray-800/80 p-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={closeModal}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <FaTimes className="text-sm" />
              إغلاق النافذة
            </button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

function ServicePosts({ categoryName, governorate, search, isAuthenticated }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [error, setError] = useState(null);

  const limit = 8;
  const hasMore = items.length < total;

  const fetchPage = useCallback(async (nextPage) => {
    if (!categoryName) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("categoryName", categoryName);
      qs.set("page", String(nextPage));
      qs.set("limit", String(limit));
      qs.set("sortBy", "created_at");
      qs.set("order", "desc");
      if (governorate) qs.set("governorate", governorate);
      if (search) qs.set("q", search);

      const res = await fetch(`/api/services?${qs.toString()}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "تعذر جلب البيانات");

      const newItems = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setItems((prev) => (nextPage === 1 ? newItems : [...prev, ...newItems]));
      setTotal(Number(data?.total || newItems.length));
      setPage(nextPage);
      setFirstLoaded(true);
    } catch (e) {
      setError(e?.message || "تعذر جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [categoryName, governorate, search]);

  // أول تحميل ووقت تغيير الفلاتر
  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotal(0);
    setFirstLoaded(false);
    setError(null);
    fetchPage(1);
  }, [fetchPage]);

  return (
    <div className=" rounded-lg shadow p-6">
      {!firstLoaded && loading && (
        <div className="py-8 text-center text-gray-600 dark:text-gray-300">جارٍ التحميل...</div>
      )}

      {error && (
        <div className="py-8 text-center text-red-600 dark:text-red-400">{error}</div>
      )}

      {firstLoaded && items.length === 0 && !loading && !error && (
        <div className="py-8 text-center text-gray-600 dark:text-gray-300">
          لا توجد منشورات حالياً لهذا القسم.
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((post) => (
              <div key={post.id} className="h-full">
                <PostCard key={post.id} post={post} isAuthenticated={isAuthenticated} />
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            {hasMore ? (
              <button
                onClick={() => fetchPage(page + 1)}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium disabled:opacity-60 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جارٍ التحميل...
                  </>
                ) : (
                  <>
                    <span>تحميل المزيد</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">تم عرض جميع النتائج</span>
                <p className="text-gray-400 text-xs mt-1">لا توجد المزيد من النتائج للعرض</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------
// الكومبوننت الرئيسي
// ------------------------
export default function ServicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { categories, parentCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const isAuthenticated = !!user;

  // تحويل الأقسام من API إلى تنسيق العرض
  const serviceCategories = useMemo(() => {
    if (!parentCategories.length) return [];
    
    return parentCategories.map(parent => {
      const subCategories = categories.filter(cat => cat.parent_id === parent.id);
      
      return {
        id: parent.id,
        title: parent.name,
        icon: React.createElement(CATEGORY_ICONS[parent.name] || FaBoxes, { className: "text-xl" }),
        services: subCategories.map(sub => ({
          id: sub.id,
          title: sub.name,
          icon: React.createElement(SERVICE_ICONS[sub.name] || FaStore, { className: "text-2xl" }),
          color: SERVICE_COLORS[sub.name] || "bg-blue-500"
        }))
      };
    });
  }, [parentCategories, categories]);

  // تجميع جميع الخدمات في مصفوفة مسطحة
  const allServices = useMemo(() => {
    return serviceCategories.flatMap((cat) =>
      cat.services.map((s) => ({
        ...s,
        id: s.id,
        originalId: s.id,
        categoryId: cat.id,
        categoryTitle: cat.title,
      }))
    );
  }, [serviceCategories]);

  // Quick-Add services ديناميكي
  const quickAddServices = useMemo(() => {
    if (allServices.length === 0) return DEFAULT_QUICK_ADD;
    
    // أخذ أول 4 خدمات من الأقسام المختلفة
    const selectedServices = [];
    const usedCategories = new Set();
    
    for (const service of allServices) {
      if (selectedServices.length >= 4) break;
      if (!usedCategories.has(service.categoryId)) {
        selectedServices.push({
          id: service.id,
          title: service.title,
          icon: service.icon
        });
        usedCategories.add(service.categoryId);
      }
    }
    
    return selectedServices.length > 0 ? selectedServices : DEFAULT_QUICK_ADD;
  }, [allServices]);

  // returnUrl الصحيح
  const returnUrl = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  // دالة للتحقق من تسجيل الدخول مع اختبار الجلسة
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [authError, setAuthError] = useState('');
  
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
        if (authLoading) {
          console.log('جاري التحميل...');
          return false;
        }

        if (user) {
          console.log('المستخدم مسجل الدخول');
          if (typeof action === 'function') {
            await action();
          }
          return true;
        }

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
    isAnonymous: false
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
    return serviceCategories.map((cat) => {
      const services = cat.services.filter((s) =>
        s.title.toLowerCase().includes(lower)
      );
      return { ...cat, services };
    }).filter((cat) => cat.services.length > 0);
  }, [searchQuery, serviceCategories]);

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
      isAnonymous: false
    });
    setSelectedTags([]);
    setTagQuery("");
    setTagResults([]);
  };

  // دالة مساعدة للحصول على المستخدم من الطلب مع تسجيل تفصيلي
  const getCurrentUser = async () => {
    try {
      // 1) Check if we have a valid user from auth context first
      if (user && user.token) {
        return { token: user.token };
      }

      // 2) Try to get token from localStorage
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
      }
      
      // 3) If no token in localStorage, try to get from cookies
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token || cookies['token'] || '';
        
        // If found in cookies, save to localStorage for future use
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
      }

      // 4) If we have a token, verify it's valid
      if (token) {
        // Simple validation that it looks like a JWT
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          return { token };
        } else {
          // Invalid token format, clean up
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    console.log('Starting form submission...');

    // Check if user is authenticated using the auth context
    if (!isAuthenticated) {
      console.log('User not authenticated - showing login prompt');
      setAuthError('يجب تسجيل الدخول أولاً');
      setShowLoginPrompt(true);
      return;
    }
    
    // Get the token from the auth context
    const token = user?.token || localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setAuthError('لم يتم العثور على رمز المصادقة');
      setShowLoginPrompt(true);
      return;
    }

    // البحث عن اسم القسم من البيانات المحملة
    const service = allServices.find(s => s.id === currentService);
    const categoryName = service?.title;
    if (!categoryName) {
      console.error('Could not determine category for service:', currentService);
      alert("تعذر تحديد التصنيف لهذه الخدمة.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      governorate: formData.governorate || "",
      price: formData.price !== "" && formData.price !== null
        ? Number(formData.price)
        : null,
      categoryName,
      tags: selectedTags,
      isAnonymous: formData.isAnonymous || false
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);
      
      const responseData = await res.json().catch(() => ({}));
      console.log('Response data:', responseData);

      if (res.status === 401) {
        console.log('Authentication required, attempting to refresh token...');
        try {
          await refreshUser();
          const again = await getCurrentUser();
          if (again?.token) {
            console.log('Retrying with new token...');
            const retry = await fetch("/api/posts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${again.token}`,
              },
              body: JSON.stringify(payload),
            });
            
            const retryData = await retry.json().catch(() => ({}));
            console.log('Retry response:', { status: retry.status, data: retryData });
            
            if (!retry.ok) {
              throw new Error(retryData.message || `فشل في إضافة المنشور (${retry.status})`);
            }
            
            resetForm();
            alert("تم إرسال منشورك للمراجعة. بانتظار موافقة الإدارة.");
            return;
          }
          throw new Error("انتهت صلاحية الجلسة");
        } catch (err) {
          console.error('Token refresh failed:', err);
          setAuthError('انتهت جلستك. يرجى تسجيل الدخول مرة أخرى');
          setShowLoginPrompt(true);
          return;
        }
      }

      if (!res.ok) {
        throw new Error(responseData.message || `خطأ في الخادم (${res.status})`);
      }

      resetForm();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Submission error:', err);
      if (err.message.includes("جلسة") || err.message.includes("انتهت")) {
        setAuthError('انتهت جلستك. يرجى تسجيل الدخول مرة أخرى');
        setShowLoginPrompt(true);
      } else {
        alert(err.message || "حدث خطأ أثناء محاولة إضافة المنشور. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  // ------------------------
  // Mobile/scroll behaviors
  // ------------------------
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

  const mobileNavRef = useRef(null);
  const subNavRef = useRef(null);
  const [mobileActiveTab, setMobileActiveTab] = useState("all");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showSubNav, setShowSubNav] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(null);

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
      const category = serviceCategories.find((cat) => cat.id === sectionId);
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
  // عرض حالة التحميل للأقسام
  if (categoriesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">جاري تحميل الأقسام...</p>
        </div>
      </div>
    );
  }

  // عرض حالة الخطأ للأقسام
  if (categoriesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">خطأ في تحميل الأقسام</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{categoriesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=" flex flex-col md:flex-row">
      {/* --- Sidebar (Desktop) --- */}
      <aside
        ref={sidebarRef}
        className="sidebar-container hidden md:block w-64  border-l border-gray-200 dark:border-gray-700 overflow-y-auto h-screen sticky top-0"
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
        {allServices.map((s) => {
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
                    {getAddBtnText(s.title)}
                  </button>
                </header>

                {/* == عرض المنشورات (بدون تغيير التصميم) == */}
                <ServicePosts
                  categoryName={s.title}
                  governorate={selectedGov}
                  search={searchQuery}
                  isAuthenticated={isAuthenticated}
                />
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
            {quickAddServices.map((q) => (
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
                إضافة {allServices.find((s) => s.id === currentService)?.title}
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

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  نشر بشكل مجهول
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData(prev => ({...prev, isAnonymous: e.target.checked}))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                </label>
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
              {serviceCategories.find((cat) => cat.id === expandedCategory)?.services.map(
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
            {serviceCategories.map((cat) => (
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

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        aria-labelledby="success-dialog-title"
        dir="rtl"
        maxWidth="xs"
        fullWidth
        PaperProps={{
          className: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 rounded-2xl overflow-hidden border-0 shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100',
          style: {
            background: 'linear-gradient(145deg, #fff8e1 0%, #fff3e0 100%)',
            border: '1px solid rgba(245, 158, 11, 0.1)'
          }
        }}
      >
        <div className="relative">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-300 opacity-5 -z-10"></div>
          
          {/* Header with Icon */}
          <div className="relative pt-10 pb-6 px-8 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mb-4 transform transition-transform duration-300 hover:rotate-12">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">تم بنجاح!</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">تم إرسال طلبك بنجاح</p>
          </div>
          
          {/* Content */}
          <div className="px-8 pb-8 text-center">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">تم استلام طلبك بنجاح!</span> سيتم مراجعته من قبل الإدارة. سيتم إشعارك فور الموافقة عليه.
              </p>
            </div>
            
            <button
              onClick={() => setShowSuccessDialog(false)}
              className="relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white transition duration-300 ease-out bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-lg group hover:ring-2 hover:ring-offset-2 hover:ring-amber-300 focus:outline-none"
            >
              <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-gradient-to-r from-yellow-500 to-amber-600 group-hover:translate-x-0 ease">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
              <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">
                تم الفهم
              </span>
              <span className="relative invisible">تم الفهم</span>
            </button>
            
            
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400 rounded-full opacity-10 -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400 rounded-full opacity-10 -ml-16 mb-6"></div>
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
        </div>
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