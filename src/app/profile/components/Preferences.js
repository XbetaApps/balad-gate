'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FaRobot, FaArchive, FaCheck, FaTimes, FaSearch, FaPlus, FaPaperPlane, FaMinus } from 'react-icons/fa';

const Preferences = () => {
  // التبويب الحالي
  const [activeTab, setActiveTab] = useState('approved'); // approved | suggested | archived

  // المصدر الأصلي لكل التاغات من الـ API
  const [allTags, setAllTags] = useState([]); // [{id,name,user_status,follower_count,...}]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // بحث داخلي ضمن قوائم المستخدم
  const [searchQuery, setSearchQuery] = useState('');

  // بحث عام بكل التاغات (محلي من allTags)
  const [globalQuery, setGlobalQuery] = useState('');

  // حالات واجهة/حفظ
  const [saving, setSaving] = useState(false);

  // مساعد (واجهة فقط)
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isAssistantExpanded, setIsAssistantExpanded] = useState(true);

  // ===== Helpers =====
  const fetchJSON = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', ...opts });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!res.ok) {
      throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    }
    return data;
  };

  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    try {
      // API الصحيح لديك
      const data = await fetchJSON('/api/preferences/tags', { method: 'GET', cache: 'no-store' });
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      // تأكد أن كل عنصر يحمل id و name
      const normalized = items
        .map((t) => (typeof t === 'string' ? { id: t, name: t, user_status: null } : t))
        .filter((t) => t && t.id && t.name);
      setAllTags(normalized);
      // Debug
      console.log('Loaded tags:', normalized);
    } catch (e) {
      console.error('Failed to load tags:', e);
      setLoadError(e.message || 'تعذر تحميل التفضيلات');
      setAllTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // تقسيم allTags إلى القوائم الثلاث حسب user_status
  const approvedTags = useMemo(
    () => allTags.filter((t) => t.user_status === 'following'),
    [allTags]
  );
  const suggestedTags = useMemo(
    () => allTags.filter((t) => t.user_status === 'suggested'),
    [allTags]
  );
  const archivedTags = useMemo(
    () => allTags.filter((t) => t.user_status === 'archived'),
    [allTags]
  );

  // تصفية داخل القوائم الثلاث
  const filteredTags = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filterByQ = (arr) => arr.filter((t) => (t?.name || '').toLowerCase().includes(q));
    return {
      approved: filterByQ(approvedTags),
      suggested: filterByQ(suggestedTags),
      archived: filterByQ(archivedTags),
    };
  }, [approvedTags, suggestedTags, archivedTags, searchQuery]);

  // البحث العام على كل التاغات (محلي من allTags)
  const globalResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return allTags.filter((t) => (t?.name || '').toLowerCase().includes(q));
  }, [allTags, globalQuery]);

  const tagStatusOf = (tagId) => {
    const t = allTags.find((x) => x.id === tagId);
    return t ? t.user_status : null;
  };

  // تغيير الحالة عبر PATCH API ثم تحديث allTags محليًا
  const setStatus = async (tag, status) => {
    setSaving(true);
    try {
      await fetchJSON(`/api/preferences/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status }), // following | suggested | archived
      });
      // تحديث محلي
      setAllTags((prev) =>
        prev.map((t) => (t.id === tag.id ? { ...t, user_status: status } : t))
      );
    } catch (e) {
      console.error('Failed to set status:', e);
      alert(e.message || 'تعذر تنفيذ العملية، حاول مجددًا.');
    } finally {
      setSaving(false);
    }
  };

  const removeLink = async (tag) => {
    setSaving(true);
    try {
      await fetchJSON(`/api/preferences/tags/${tag.id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      // نفك ارتباط المستخدم من التاغ (نجعلها null بدل الحذف من allTags)
      setAllTags((prev) =>
        prev.map((t) => (t.id === tag.id ? { ...t, user_status: null } : t))
      );
    } catch (e) {
      console.error('Failed to delete link:', e);
      alert(e.message || 'تعذر الحذف، حاول مجددًا.');
    } finally {
      setSaving(false);
    }
  };

  const approveTag = (tag) => setStatus(tag, 'following');
  const archiveTag  = (tag) => setStatus(tag, 'archived');
  const restoreTag  = (tag) => setStatus(tag, 'suggested');
  const deleteTag   = (tag) => removeLink(tag);

  // مساعد (واجهة فقط)
  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };
    setChatMessages((m) => [...m, userMsg]);
    setChatInput('');
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        text: 'حللت رسالتك وأقترح: [تقنية, تعليم]',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatMessages((m) => [...m, aiMsg]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full">
      {/* شريط التبويبات */}
      <div className="flex border-b border-[var(--border)] dark:border-[var(--gold-border)]">
        <div className="flex-1 flex">
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'approved' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-on-card)]'}`}
            onClick={() => setActiveTab('approved')}
          >
            المفضلة
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'suggested' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-on-card)]'}`}
            onClick={() => setActiveTab('suggested')}
          >
            المقترحة
          </button>
          <button
            className={`px-4 py-3 font-medium ${activeTab === 'archived' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-on-card)]'}`}
            onClick={() => setActiveTab('archived')}
          >
            المؤرشفة
          </button>
        </div>
        <div className="px-4 py-3 text-[var(--text-on-card)]">
          التفضيلات {saving ? '…' : ''}
        </div>
      </div>

      {/* شريط البحث الداخلي */}
      <div className="p-4 border-b border-[var(--border)] dark:border-[var(--gold-border)]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث داخل تفضيلاتك..."
          className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm text-[var(--text-on-card)]"
        />
      </div>

      {/* رسالة خطأ تحميل */}
      {!!loadError && (
        <div className="px-4 pt-3">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {loadError}
          </div>
        </div>
      )}

      {/* القوائم */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-[var(--text-on-card)] py-8">جاري التحميل…</p>
        ) : (
          (() => {
            const list =
              activeTab === 'approved'
                ? filteredTags.approved
                : activeTab === 'suggested'
                ? filteredTags.suggested
                : filteredTags.archived;

            if (!list.length) {
              return <p className="text-center text-[var(--text-on-card)] py-8">لا يوجد عناصر في هذا القسم</p>;
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((tag) => (
                  <div
                    key={tag.id}
                    className="p-3 rounded-lg border border-[var(--border)] dark:border-[var(--gold-border)] bg-[var(--card)] flex justify-between items-center"
                  >
                    <span className="font-medium text-[var(--text-on-card)]">{tag.name}</span>
                    <div className="flex gap-2">
                      {activeTab === 'suggested' && (
                        <>
                          <button
                            onClick={() => approveTag(tag)}
                            className="p-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                            title="قبول"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => archiveTag(tag)}
                            className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                            title="أرشفة"
                          >
                            <FaArchive />
                          </button>
                        </>
                      )}
                      {activeTab === 'approved' && (
                        <button
                          onClick={() => archiveTag(tag)}
                          className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                          title="أرشفة"
                        >
                          <FaArchive />
                        </button>
                      )}
                      {activeTab === 'archived' && (
                        <>
                          <button
                            onClick={() => restoreTag(tag)}
                            className="p-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="استعادة"
                          >
                            <FaPlus />
                          </button>
                          <button
                            onClick={() => deleteTag(tag)}
                            className="p-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                            title="حذف الربط"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>

      {/* البحث العام بكل التاغات (محلي) */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-lg border border-[var(--border)] dark:border-[var(--gold-border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <FaSearch className="text-[var(--text-on-card)]" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="بحث عن تاغ جديد لمتابعته..."
              className="flex-1 py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm text-[var(--text-on-card)]"
            />
          </div>

          {globalQuery.trim().length >= 2 && (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {!globalResults.length ? (
                <div className="text-sm text-[var(--text-on-card)] px-2 py-1">لا نتائج</div>
              ) : (
                globalResults.map((tag) => {
                  const s = tagStatusOf(tag.id);
                  return (
                    <div
                      key={tag.id}
                      className="p-2 rounded-md border border-[var(--border)] bg-[var(--background)] flex justify-between items-center"
                    >
                      <span className="text-[var(--text-on-card)]">{tag.name}</span>
                      <div className="flex items-center gap-2">
                        {s ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {s === 'following' ? 'متابَع' : s === 'suggested' ? 'مقترح لديك' : 'مؤرشف لديك'}
                          </span>
                        ) : (
                          <button
                            onClick={() => setStatus(tag, 'following')}
                            className="px-2 py-1 text-sm rounded-md bg-[var(--primary)] text-[var(--text-on-primary)] hover:bg-[var(--primary)]/90"
                            disabled={saving}
                          >
                            متابعة
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* مساعد الذكاء الاصطناعي (واجهة فقط) */}
      <div className="fixed bottom-16 left-4 w-96 max-w-full bg-[var(--card)] shadow-lg rounded-lg border border-[var(--border)] dark:border-[var(--gold-border)] z-50">
        <div className="p-3 bg-[var(--card)] rounded-t-lg flex justify-between items-center">
          <div className="font-medium flex items-center gap-2 text-[var(--text-on-card)]">
            <FaRobot className="text-yellow-500" />
            مساعد التفضيلات
          </div>
          <button
            onClick={() => setIsAssistantExpanded(!isAssistantExpanded)}
            className="p-1 rounded-full hover:bg-[var(--border)] text-[var(--text-on-card)]"
          >
            {isAssistantExpanded ? <FaMinus /> : <FaPlus />}
          </button>
        </div>
        {isAssistantExpanded && (
          <div className="absolute bottom-full left-0 w-full bg-[var(--card)] shadow-lg rounded-lg border border-[var(--border)] dark:border-[var(--gold-border)] mb-2">
            <div className="p-4 max-h-64 overflow-y-auto">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block p-2 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-[var(--primary)] text-[var(--text-on-primary)]'
                        : 'bg-[var(--assistant-bubble)] text-[var(--text-on-card)]'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="text-xs text-[var(--text-on-card)] mt-1">{msg.timestamp}</div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[var(--border)] dark:border-[var(--gold-border)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اطلب من المساعد إضافة تفضيلات..."
                  className="flex-1 py-2 px-3 rounded-lg border border-[var(--border)] dark:border-[var(--gold-border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm text-[var(--text-on-card)]"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="p-2 rounded-lg bg-[var(--primary)] text-[var(--text-on-primary)] hover:bg-[var(--primary)]/90"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preferences;
