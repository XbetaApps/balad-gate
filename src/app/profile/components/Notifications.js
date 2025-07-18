'use client';

import React, { useState, useEffect } from 'react';
import { FaBell, FaCheckCircle, FaTimesCircle, FaInbox, FaFilter, FaTrashAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // محاكاة تحميل البيانات
    setTimeout(() => {
      const now = Date.now();
      const sampleNotifications = [
        {
          id: 1,
          title: "تم تجديد العلاج",
          message: "تم تجديد علاجك بنجاح. يمكنك الآن استلام الدواء من الصيدلية.",
          type: "success",
          read: false,
          timestamp: now - 3600 * 1000,
        },
        {
          id: 2,
          title: "موعد جديد",
          message: "تم حجز موعدك مع الطبيب في العيادة يوم غدٍ الساعة 10 صباحاً.",
          type: "info",
          read: false,
          timestamp: now - 2 * 3600 * 1000,
        },
        {
          id: 3,
          title: "تحذير: تذكير بالدواء",
          message: "لقد نسيت تناول جرعة الدواء في الموعد المحدد.",
          type: "warning",
          read: true,
          timestamp: now - 3 * 3600 * 1000,
        },
      ];
      setNotifications(sampleNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (tab === "all") return true;
    if (tab === "unread") return !notification.read;
    if (tab === "read") return notification.read;
    return true;
  });

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const deleteAll = () => {
    setNotifications([]);
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-green-500" />;
      case "warning":
        return <FaBell className="text-yellow-500" />;
      default:
        return <FaBell className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">الإشعارات</h2>
        <div className="flex gap-4">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--foreground)] hover:bg-[var(--primary)]/90 transition-colors"
          >
            علامة كلها كمقروءة
          </button>
          <button
            onClick={deleteAll}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            حذف الكل
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 overflow-x-auto">
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-lg ${
            tab === "all"
              ? "bg-[var(--primary)] text-[var(--foreground)]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setTab("unread")}
          className={`px-4 py-2 rounded-lg ${
            tab === "unread"
              ? "bg-[var(--primary)] text-[var(--foreground)]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          غير مقروءة
        </button>
        <button
          onClick={() => setTab("read")}
          className={`px-4 py-2 rounded-lg ${
            tab === "read"
              ? "bg-[var(--primary)] text-[var(--foreground)]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          مقروءة
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[var(--card)] p-4 rounded-lg"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-[var(--card)] p-6 rounded-lg text-center">
              <FaInbox className="text-4xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {tab === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات"}
              </h3>
              <p className="text-[var(--text-secondary)]">
                {tab === "unread"
                  ? "لا توجد إشعارات جديدة حالياً"
                  : "لا توجد إشعارات في هذا القسم"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-[var(--card)] p-4 rounded-lg ${notification.read ? "opacity-70" : "opacity-100"}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationTypeIcon(notification.type)}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-[var(--text-primary)] truncate">
                      {notification.title}
                    </h3>
                    <p className="mt-2 text-[var(--text-secondary)] text-sm">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-[var(--text-secondary)]">
                      <span>{new Date(notification.timestamp).toLocaleString("ar-SA")}</span>
                      {!notification.read && (
                        <span className="ml-2 px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                          جديد
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 rounded-md text-blue-400 hover:text-blue-500"
                      aria-label="العلامة كمقروءة"
                    >
                      <FaCheckCircle />
                    </button>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-md text-red-400 hover:text-red-500 ml-2"
                      aria-label="حذف الإشعار"
                    >
                      <FaTimesCircle />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
