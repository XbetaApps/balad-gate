'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaBell, FaCheckCircle, FaTimesCircle, FaInbox } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // جلب مع تمرير الكوكيز + Authorization (إن وُجد)
  const authFetch = useCallback(async (url, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...options,
      headers,
    });
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/notifications', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'فشل جلب الإشعارات');

      // نعتمد فقط على الحقول الموجودة في الجدول
      const mapped = (data || [])
        .map((n) => ({
          id: n.id,
          content: n.content || '',
          read: Boolean(n.read ?? n.is_read),
          createdAt: n.created_at ? new Date(n.created_at).getTime() : Date.now(),
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // الأحدث أولاً

      setNotifications(mapped);
    } catch (e) {
      console.error('Error loading notifications:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // تحديث عدد الإشعارات غير المقروءة عند تغيير قائمة الإشعارات
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
    
    // تحديث الدالة في window عند تغير unreadCount
    if (typeof window !== 'undefined') {
      window.getUnreadNotificationsCount = () => count;
    }
  }, [notifications]);
  
  // تعيين الدالة الأولية عند التحميل
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.getUnreadNotificationsCount = () => unreadCount;
    }
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !n.read;
    if (tab === 'read') return n.read;
    return true;
  });
  
  // تم نقل تحديث الدالة إلى useEffect أعلاه

  const markAsRead = async (id) => {
    // تحديث تفاؤلي
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) await loadNotifications();
    } catch (e) {
      console.error('markAsRead failed:', e);
      await loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    // تحديث تفاؤلي
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const res = await authFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read_all' }),
      });
      if (!res.ok) await loadNotifications();
    } catch (e) {
      console.error('markAllAsRead failed:', e);
      await loadNotifications();
    }
  };

  const deleteNotification = async (id) => {
    const prev = notifications;
    setNotifications((cur) => cur.filter((n) => n.id !== id));
    try {
      const res = await authFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) setNotifications(prev);
    } catch (e) {
      console.error('deleteNotification failed:', e);
      setNotifications(prev);
    }
  };

  const deleteAll = async () => {
    const prev = notifications;
    setNotifications([]);
    try {
      const res = await authFetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_all' }),
      });
      if (!res.ok) setNotifications(prev);
    } catch (e) {
      console.error('deleteAll failed:', e);
      setNotifications(prev);
    }
  };

  const StatusIcon = ({ read }) =>
    read ? (
      <FaCheckCircle className="text-green-500" />
    ) : (
      <FaBell className="text-blue-500" />
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">الإشعارات</h2>
        <div className="flex gap-4">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--foreground)] hover:bg-[var(--primary)]/90 transition-colors"
          >
            تمييز الكل كمقروء
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
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg ${
            tab === 'all'
              ? 'bg-[var(--primary)] text-[var(--foreground)]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setTab('unread')}
          className={`px-4 py-2 rounded-lg ${
            tab === 'unread'
              ? 'bg-[var(--primary)] text-[var(--foreground)]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          غير مقروءة
        </button>
        <button
          onClick={() => setTab('read')}
          className={`px-4 py-2 rounded-lg ${
            tab === 'read'
              ? 'bg-[var(--primary)] text-[var(--foreground)]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                {tab === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
              </h3>
              <p className="text-[var(--text-secondary)]">
                {tab === 'unread'
                  ? 'لا توجد إشعارات جديدة حالياً'
                  : 'لا توجد إشعارات في هذا القسم'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[var(--card)] p-4 rounded-lg ${
                  n.read ? 'opacity-75' : 'opacity-100'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <StatusIcon read={n.read} />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    {/* لا يوجد title في الجدول؛ نعرض المحتوى مباشرة */}
                    <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap">
                      {n.content}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-[var(--text-secondary)] gap-2">
                      <span>{new Date(n.createdAt).toLocaleString('ar-SA')}</span>
                      {!n.read && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          غير مقروء
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="p-2 rounded-md text-blue-500 hover:text-blue-600"
                        aria-label="تمييز كمقروء"
                        title="تمييز كمقروء"
                      >
                        <FaCheckCircle />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-2 rounded-md text-red-400 hover:text-red-500 ml-2"
                      aria-label="حذف الإشعار"
                      title="حذف الإشعار"
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
