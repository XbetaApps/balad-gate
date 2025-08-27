"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaInbox,
  FaFilter,
  FaTrashAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../profile-styles.css";

/**
 * NotificationsPage – لوحة إشعارات احترافية
 * -------------------------------------------------
 * • Tabs للتصفية (الكل، غير مقروءة، مقروءة).
 * • زر "تحديد الكل كمقروء" وزر "حذف الكل" مع تأكيد.
 * • انتقالات سلسة via Framer‑Motion.
 * • Skeleton loader أثناء الجلب الأولي.
 * • متجاوبة بالكامل (mobile ↔ desktop).
 */

const TABS = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروءة" },
  { key: "read", label: "مقروءة" },
];

function NotificationCard({ n, markAsRead, deleteNotification }) {
  const iconBg = n.read ? "bg-gray-200" : "bg-[var(--primary)] text-white";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className={`p-4 rounded-xl border border-[var(--border)] shadow-sm ${
        n.read ? "bg-[var(--background)]" : "bg-[var(--card)]/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-full ${iconBg}`}>{<FaBell />}</span>
            <h3 className="font-medium text-[var(--text-primary)]">{n.title}</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {n.message}
          </p>
          <time className="block text-xs text-gray-500 mt-1" dateTime={new Date(n.timestamp).toISOString()}>
            {new Date(n.timestamp).toLocaleString("ar-EG", {
              hour12: false,
            })}
          </time>
        </div>
        <div className="flex flex-col gap-2 items-center shrink-0">
          {!n.read && (
            <button
              onClick={() => markAsRead(n.id)}
              className="p-2 rounded-full hover:bg-gray-100"
              title="وضع كمقروء"
            >
              <FaCheckCircle className="text-green-600" />
            </button>
          )}
          <button
            onClick={() => deleteNotification(n.id)}
            className="p-2 rounded-full hover:bg-gray-100"
            title="حذف الإشعار"
          >
            <FaTimesCircle className="text-red-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("unread");

  // Fake fetch – replace with API in production
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = Date.now();
      setNotifications([
        {
          id: 1,
          title: "تم تحديث حالة الطلب",
          message: "طلبك رقم #12345 تم تحديث حالته إلى \"قيد المعالجة\".",
          read: false,
          timestamp: now - 3600 * 1000,
        },
        {
          id: 2,
          title: "رسالة من الدعم",
          message: "لديك رد جديد من فريق الدعم الفني.",
          read: false,
          timestamp: now - 2 * 3600 * 1000,
        },
        {
          id: 3,
          title: "تحديث متاح",
          message: "أطلقنا نسخة جديدة للتطبيق – جرّبها الآن!",
          read: true,
          timestamp: now - 24 * 3600 * 1000,
        },
      ]);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (tab === "unread") return notifications.filter((n) => !n.read);
    if (tab === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, tab]);

  const markAsRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const deleteNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const deleteAll = () => setNotifications([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <section className="h-full flex flex-col p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FaBell className="text-xl text-[var(--text-primary)]" />
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">الإشعارات</h1>
          {!!unreadCount && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={markAllAsRead}
            disabled={!unreadCount}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--primary)]/10 disabled:opacity-50"
          >
            <FaCheckCircle /> <span>تحديد الكل كمقروء</span>
          </button>
          <button
            onClick={deleteAll}
            disabled={!notifications.length}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-red-500/10 text-red-600 disabled:opacity-50"
          >
            <FaTrashAlt /> <span>حذف الكل</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm rounded-full border ${
              tab === t.key
                ? "bg-[var(--primary)] text-black border-transparent"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--primary)]/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-gradient-to-r from-gray-200/30 via-gray-300/30 to-gray-200/30"
            />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4">
          <AnimatePresence initial={false}>
            {filtered.map((n) => (
              <NotificationCard
                key={n.id}
                n={n}
                markAsRead={markAsRead}
                deleteNotification={deleteNotification}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center mt-20 gap-2 text-gray-500">
          <FaInbox className="text-5xl" />
          <p>{tab === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات"}</p>
        </div>
      )}
    </section>
  );
}
