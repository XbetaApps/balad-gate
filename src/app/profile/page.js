"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaBell, FaFlask, FaCapsules, FaComments, FaMoneyBill, FaCog, FaQuestionCircle, FaSignOutAlt, FaStar, FaPhone, FaEnvelope, FaLock, FaMapMarkerAlt, FaHeart } from 'react-icons/fa';
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
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('profile');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setCurrentSection(section);
    }
  }, [searchParams]);

  const handleSectionClick = (section) => {
    console.log('Changing section to:', section);
    setCurrentSection(section);
    setSidebarOpen(false);
    // إضافة تأخير بسيط للتأكد من تغيير القسم
    setTimeout(() => console.log('Current section:', currentSection), 100);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'profile':
        return (
          <section className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-[var(--text-primary)]">معلومات الحساب</h2>
              <p className="text-[var(--text-secondary)]">حدّث بيانات حسابك</p>
            </div>

            <form className="grid gap-6 md:grid-cols-2 bg-[var(--card)]/50 p-6 rounded-2xl border border-[var(--border)] shadow-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">الاسم</label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Alexa Andriana</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">البريد الإلكتروني</label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">alexaandriana@gmail.com</span>
                </div>
              </div>
              <TextField label="رقم الهاتف" placeholder="+12 3456 7890" icon="phone" />
              <TextField label="المحافظة" placeholder="القاهرة" icon="map-marker" />
              <TextField type="password" label="كلمة المرور الحالية" placeholder="•••••" icon="lock" />
              <TextField type="password" label="كلمة المرور الجديدة" placeholder="•••••" icon="lock" />
              <TextField type="password" label="تأكيد كلمة المرور" placeholder="•••••" icon="lock" />
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full px-6 py-3 rounded-lg bg-[var(--primary)] text-black font-medium hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors">
                  تحديث البيانات
                </button>
              </div>
            </form>
          </section>
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
            <Support user={{}} />
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
            onClick={() => {
              setSidebarOpen(false);
              // إضافة منطق تسجيل الخروج هنا
            }} 
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
              <h1 className="font-semibold text-lg sm:text-xl text-[var(--text-primary)]">مرحباً، Alexa A.</h1>
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
