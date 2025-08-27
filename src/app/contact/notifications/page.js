'use client';

import React, { useState, useEffect } from 'react';
import { FaBell, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // مثال على بيانات الاشعارات
  const sampleNotifications = [
    {
      id: 1,
      title: 'تم تحديث حالة الطلب',
      message: 'طلبك رقم #12345 تم تحديث حالته إلى المعالجة',
      type: 'info',
      read: false,
      timestamp: new Date().getTime()
    },
    {
      id: 2,
      title: 'رسالة جديدة',
      message: 'لديك رسالة جديدة من الدعم الفني',
      type: 'info',
      read: false,
      timestamp: new Date().getTime()
    },
    {
      id: 3,
      title: 'تحديث تطبيق',
      message: 'جاهز لتنزيل التحديث الجديد للتطبيق',
      type: 'info',
      read: false,
      timestamp: new Date().getTime()
    }
  ];

  useEffect(() => {
    // في التطبيق الحقيقي، ستحتاج إلى استدعاء API للحصول على الإشعارات
    setNotifications(sampleNotifications);
    setIsLoading(false);
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">الإشعارات</h1>
        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
          {unreadCount}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaBell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">لا توجد إشعارات</h3>
              <p className="mt-1 text-sm text-gray-500">لا توجد إشعارات جديدة حالياً</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border border-[var(--border)] ${
                  notification.read ? 'bg-[var(--background)]' : 'bg-[var(--card)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`p-2 rounded-full ${
                          notification.read ? 'bg-gray-100' : 'bg-[var(--primary)] text-white'
                        }`}
                      >
                        {notification.type === 'info' ? <FaBell /> : <FaCheckCircle />}
                      </span>
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">
                        {notification.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="العلامة كمقروء"
                      >
                        <FaCheckCircle className="h-5 w-5 text-green-500" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-full hover:bg-gray-100"
                      title="حذف"
                    >
                      <FaTimesCircle className="h-5 w-5 text-red-500" />
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
