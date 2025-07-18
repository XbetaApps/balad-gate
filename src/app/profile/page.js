"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import { useSession } from '../../contexts/SessionContext';
import { 
  FaUser, 
  FaBell, 
  FaFlask, 
  FaCapsules, 
  FaComments, 
  FaMoneyBill, 
  FaCog, 
  FaQuestionCircle, 
  FaSignOutAlt, 
  FaStar, 
  FaHeart, 
  FaPhone, 
  FaLock, 
  FaMapMarkerAlt,
  FaEnvelope
} from 'react-icons/fa';
import NavItem from './components/NavItem';
import Link from 'next/link';
import Notifications from './components/Notifications';
import Favorites from './components/Favorites';
import Chat from './components/Chat';
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import "./profile-styles.css";
import ErrorBoundary from '../../components/ErrorBoundary';
import Preferences from './components/Preferences';
import Support from './components/Support';
import { AccountInfo, PasswordSection } from './components/Account';

/**
 * Account page – fully responsive.
 * Mobile: Sidebar becomes a slide‑in drawer with overlay.
 * Desktop: Sidebar fixed.
 */

function TextField({ label, placeholder = "", type = "text", icon = null, fullWidth = false }) {
  const icons = {
    phone: <FaPhone className="text-[var(--text-secondary)]" />,
    lock: <FaLock className="text-[var(--text-secondary)]" />,
    "map-marker": <FaMapMarkerAlt className="text-[var(--text-secondary)]" />
  };
  const IconEl = icon ? icons[icon] : null;

  return (
    <div className={`${fullWidth ? "md:col-span-2" : ""} space-y-2`}>
      <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      <div className="relative">
        {IconEl && <span className="absolute left-3 top-1/2 -translate-y-1/2">{IconEl}</span>}
        <input
          type={type}
          placeholder={placeholder}
          className={`${IconEl ? "pl-10" : "pl-4"} w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pr-4 placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition`}
        />
      </div>
    </div>
  );
}

function NotificationBadge({ count }) {
  return !count ? null : (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
      {count}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isVerified: isSessionVerified, setVerified: setSessionVerified } = useSession();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentSection, setCurrentSection] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    role_id: null,
    serial_id: null
  });
  const [editData, setEditData] = useState({
    phone: '',
    city: ''
  });
  const [isEditing, setIsEditing] = useState({
    phone: false,
    city: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleEditClick = (field) => {
    setEditData(prev => ({
      ...prev,
      [field]: userData[field] || ''
    }));
    setIsEditing(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleSaveClick = (field) => {
    // تحديث البيانات المحلية فقط
    setUserData(prev => ({
      ...prev,
      [field]: editData[field]
    }));

    // إغلاق وضع التعديل
    setIsEditing(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handleCancelEdit = (field) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handleInputChange = (e, field) => {
    setEditData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  useEffect(() => {
    const section = searchParams.get('section') || 'profile';
    setCurrentSection(section);
  }, [searchParams]);

  const handleSectionClick = (section) => {
    console.log('Changing section to:', section);
    setCurrentSection(section);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSessionVerified(false);
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleVerifySession = () => {
    // محاكاة عملية التحقق من الجلسة
    setTimeout(() => {
      setSessionVerified(true);
      setShowVerificationModal(false);
    }, 500);
  };

  // التحقق من صحة الجلسة عند تحميل الصفحة
  useEffect(() => {
    if (user && !isSessionVerified) {
      setShowVerificationModal(true);
    }
    
    // جلب بيانات المستخدم
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        setIsAuthenticated(true);

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المستخدم');
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('حدث خطأ أثناء جلب بيانات المستخدم');
      } finally {
        setIsLoading(false);
      }  
    };

    fetchUserData();
  }, [user, isSessionVerified, router]);

  if (loading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">جاري تحميل البيانات...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-2xl text-[var(--primary)] mb-4">يجب تسجيل الدخول</div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">عذراً، يجب عليك تسجيل الدخول للوصول إلى هذه الصفحة.</p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => router.push('/auth')}
              className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
            >
              الانتقال إلى تسجيل الدخول
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              العودة للصفحة السابقة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full space-y-6 p-8 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4 text-[var(--text-primary)]">الرجاء تسجيل الدخول أولاً</h2>
          <p className="text-center text-[var(--text-secondary)] mb-6">
            هل تريد الاستمرار في تصفح الموقع كزائر؟
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/auth')}
              className="px-8 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => router.back()} // العودة إلى الصفحة السابقة
              className="px-8 py-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--background)]/50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'profile':
        return (
          <section className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-[var(--text-primary)]">الملف الشخصي</h2>
              <p className="text-[var(--text-secondary)]">إدارة معلوماتك الشخصية</p>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">الاسم</label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">{userData?.name || 'غير محدد'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">البريد الإلكتروني</label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">{userData?.email || 'غير محدد'}</span>
                </div>
              </div>
              {/* حقول غير قابلة للتعديل */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">رقم العضوية</label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">{userData?.serial_id || 'غير محدد'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">نوع العضوية</label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">
                    {userData?.role_id === 1 ? 'مستخدم عادي' : 
                     userData?.role_id === 2 ? 'مستخدم مميز' : 
                     userData?.role_id === 3 ? 'مدير' : 'غير محدد'}
                  </span>
                </div>
              </div>
              
              {/* حقول قابلة للتعديل */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-primary)]">رقم الجوال</label>
                  {!isEditing.phone && (
                    <button 
                      onClick={() => handleEditClick('phone')}
                      className="p-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
                      aria-label="تعديل رقم الجوال"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {isEditing.phone ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editData.phone}
                      onChange={(e) => handleInputChange(e, 'phone')}
                      className="flex-1 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                      placeholder="أدخل رقم الجوال"
                    />
                    <button 
                      onClick={() => handleSaveClick('phone')}
                      className="px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      حفظ
                    </button>
                    <button 
                      onClick={() => handleCancelEdit('phone')}
                      className="px-3 bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">{userData?.phone || 'غير محدد'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-primary)]">المدينة</label>
                  {!isEditing.city && (
                    <button 
                      onClick={() => handleEditClick('city')}
                      className="p-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
                      aria-label="تعديل المدينة"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {isEditing.city ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => handleInputChange(e, 'city')}
                      className="flex-1 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                      placeholder="أدخل المدينة"
                    />
                    <button 
                      onClick={() => handleSaveClick('city')}
                      className="px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      حفظ
                    </button>
                    <button 
                      onClick={() => handleCancelEdit('city')}
                      className="px-3 bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">{userData?.city || 'غير محدد'}</span>
                  </div>
                )}
              </div>
              <div className="[--password-text:var(--text-primary)] dark:[--password-text:var(--primary)] [--password-placeholder:var(--text-secondary)] dark:[--password-placeholder:var(--primary-light)]text-sm font-medium text-[var(--text-primary)]">
                <TextField 
                  type="password" 
                  label="كلمة المرور الحالية" 
                  placeholder="" 
                  icon="lock"
                  className="[&_input]:text-[var(--password-text)] [&_input::placeholder]:text-[var(--password-placeholder)]"
                />
              </div>
              <div className="[--password-text:var(--text-primary)] dark:[--password-text:var(--primary)] [--password-placeholder:var(--text-secondary)] dark:[--password-placeholder:var(--primary-light)]text-sm font-medium text-[var(--text-primary)]">
                <TextField 
                  type="password"      //text-sm font-medium text-[var(--text-primary)]
                  label="كلمة المرور الجديدة" 
                  placeholder="" 
                  icon="lock"
                  className="[&_input]:text-[var(--password-text)] [&_input::placeholder]:text-[var(--password-placeholder)]"
                />
              </div>
              <div className="[--password-text:var(--text-primary)] dark:[--password-text:var(--primary)] [--password-placeholder:var(--text-secondary)] dark:[--password-placeholder:var(--primary-light)]text-sm font-medium text-[var(--text-primary)]">
                <TextField 
                  type="password" 
                  label="تأكيد كلمة المرور" 
                  placeholder="" 
                  icon="lock"
                  className="[&_input]:text-[var(--password-text)] [&_input::placeholder]:text-[var(--password-placeholder)]"
                />
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full px-6 py-3 rounded-lg bg-[var(--primary)] text-black font-medium hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors">
                  تحديث البيانات
                </button>
              </div>
            </form>
          </section>
        );
      case 'account':
        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 shadow-sm">
              <AccountInfo userData={userData} />
              <PasswordSection />
            </div>
          </div>
        );
      case 'notifications':
        return <Notifications />;
      case 'favorites':
        return <Favorites />;
      case 'chat':
        return <Chat />;
      case 'payments':
        return <div>المدفوعات</div>;
      case 'settings':
        return <div>الإعدادات</div>;
      case 'support':
        return (
          <div className="flex-1 overflow-hidden">
            <Support user={user} />
          </div>
        );
      case 'preferences':
        return (
          <ErrorBoundary>
            <Preferences />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-[var(--background)] text-right direction-rtl overflow-hidden">
      {/* Drawer overlay */}
      <div
        className={`fixed inset-0 bg-[var(--background)]/40 z-30 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 w-64 bg-[var(--background)] border-l border-[var(--border)] z-40 transform transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">لوحة التحكم</h1>
          <button
            className="md:hidden text-2xl text-[var(--text-primary)]"
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة"
          >
            &times;
          </button>
        </div>
        <nav className="mt-6 space-y-1 px-2 pb-10 overflow-y-auto bg-[var(--background)]">
          <NavItem 
            icon={<FaUser />} 
            label="الملف الشخصي" 
            active={currentSection === 'profile'} 
            onClick={() => handleSectionClick('profile')} 
          />
          <nav className="flex flex-col gap-2 mt-4">
            <NavItem 
              icon={<FaHeart />} 
              label="المفضلة" 
              active={currentSection === 'favorites'}
              onClick={() => handleSectionClick('favorites')}
            />
            <NavItem 
              icon={<FaBell />} 
              label="الإشعارات" 
              active={currentSection === 'notifications'}
              onClick={() => handleSectionClick('notifications')}
              badgeCount={3}
            />
            <NavItem 
              icon={<FaComments />} 
              label="المحادثات" 
              active={currentSection === 'chat'}
              onClick={() => handleSectionClick('chat')}
            />
            <NavItem 
              icon={<FaFlask />} 
              label="التفضيلات" 
              active={currentSection === 'preferences'}
              onClick={() => handleSectionClick('preferences')}
            />
          </nav>
          <NavItem 
            icon={<FaCog />} 
            label="الإعدادات" 
            active={currentSection === 'settings'} 
            onClick={() => handleSectionClick('settings')} 
          />
          <NavItem 
            icon={<FaQuestionCircle />} 
            label="الدعم الفني" 
            active={currentSection === 'support'} 
            onClick={() => handleSectionClick('support')} 
          />
          <NavItem 
            icon={<FaSignOutAlt />} 
            label="تسجيل الخروج" 
            onClick={handleLogout} 
          />
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
        <header className="flex items-center justify-between flex-row-reverse px-4 sm:px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]/60 backdrop-blur md:pr-10">
          <button
            className="text-2xl text-[var(--text-primary)] md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="فتح القائمة"
          >
            <HiOutlineMenuAlt2 />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="font-semibold text-lg sm:text-xl text-[var(--text-primary)]">مرحباً، {user.name}</h1>
              {currentSection === 'notifications' && (
                <span className="text-sm text-[var(--text-secondary)]">3 إشعارات جديدة</span>
              )}
            </div>
            <div className="relative">
              <button 
                className="p-2 rounded-full bg-[var(--primary)] text-[var(--foreground)] hover:bg-[var(--primary)]/90 transition-colors"
                onClick={() => handleSectionClick('notifications')}
              >
                <FaBell className="text-lg" />
                <NotificationBadge count={3} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {renderSection()}
        </div>

        
      </div>
    </div>
  );
}
