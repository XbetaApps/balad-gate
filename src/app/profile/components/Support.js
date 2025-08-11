"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaHeadset, FaUserTie, FaPaperPlane } from "react-icons/fa";
import "../profile-styles.css";

// --- الدوال المساعدة ---

/** التحقق من أن المستخدم ليس مشرفًا */
function isNotAdmin(userData) {
  return !userData || Number(userData.role_id) !== 4;
}

/** جلب بيانات الجلسة */
async function fetchUserDataFromSession() {
  const res = await fetch("/api/test-session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.authenticated || !data?.user) return null;
  const role_id = data?.rawPayload?.role_id ?? data?.user?.role_id ?? null;
  return { ...data.user, role_id };
}

/** أداة طلب JSON */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { credentials: "include", ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// --- المكونات الفرعية ---

const LoadingState = () => (
  <div className="text-center p-6">جاري التحميل...</div>
);

const AdminAccessDenied = () => (
  <div className="text-center p-6">
    <p className="text-xl text-red-600">الرجاء استخدام صفحة دعم المشرفين</p>
  </div>
);

// --- المكون الرئيسي ---

const SupportContent = ({ user }) => {
  // الحالات
  const [threads, setThreads] = useState({
    admin: { id: null, messages: [], loading: false },
    supervisor: { id: null, messages: [], loading: false }
  });
  
  const [activeRecipient, setActiveRecipient] = useState("admin");
  const [message, setMessage] = useState("");
  const bottomRef = useRef(null);
  const hasSupervisor = Boolean(user?.supervisorId);

  // تعريف المتلقين
  const allRecipients = [
    {
      id: "admin",
      label: "مشرف الموقع",
      desc: "للاستفسارات العامة والأخطاء الفنية",
      icon: <FaHeadset className="w-8 h-8 text-[var(--text-secondary)]" />,
      isVisible: true
    },
    {
      id: "supervisor",
      label: "المشرف الشخصي",
      desc: hasSupervisor ? `مشرفك: ${user.supervisorName}` : "غير متوفر",
      icon: <FaUserTie className="w-8 h-8 text-[var(--text-secondary)]" />,
      isVisible: hasSupervisor
    }
  ];

  // تصفية المتلقين بناءً على الحالة
  const recipients = allRecipients.filter(r => r.isVisible);

  // --- الدوال المساعدة ---

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const loadMessages = useCallback(async (key, threadId) => {
    if (!threadId) return;
    
    setThreads(p => ({ ...p, [key]: { ...p[key], loading: true } }));
    
    try {
      const msgs = await fetchJSON(`/api/support/threads/${threadId}/messages`, { 
        cache: "no-store" 
      });
      
      const normalized = msgs.map(m => ({
        id: m.id,
        threadId: m.thread_id,
        senderId: m.sender_id,
        senderRole: m.sender_type,
        content: m.content,
        timestamp: m.created_at,
      }));
      
      setThreads(p => ({
        ...p,
        [key]: { ...p[key], messages: normalized, loading: false }
      }));
      
      scrollToBottom();
    } catch (e) {
      console.error("فشل جلب الرسائل:", e);
      setThreads(p => ({ ...p, [key]: { ...p[key], loading: false } }));
    }
  }, [scrollToBottom]);

  const handleSend = useCallback(async () => {
    const txt = message.trim();
    if (!txt) return;

    let { id: threadId } = threads[activeRecipient];

    // إنشاء ثريد جديد إذا لزم الأمر
    if (!threadId) {
      try {
        const resp = await fetchJSON("/api/support/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(activeRecipient === "supervisor" ? { userId: user.id } : {}),
            firstMessage: txt,
          }),
        });
        threadId = String(resp.id);
        setThreads(p => ({ 
          ...p, 
          [activeRecipient]: { 
            ...p[activeRecipient], 
            id: threadId 
          } 
        }));
        setMessage("");
        await loadMessages(activeRecipient, threadId);
        return;
      } catch (e) {
        console.error("فشل إنشاء الثريد:", e);
        return;
      }
    }

    // إضافة رسالة مؤقتة
    const tempId = `tmp-${Date.now()}`;
    const tmpMsg = {
      id: tempId,
      threadId,
      senderId: user.id,
      senderRole: "user",
      content: txt,
      timestamp: new Date().toISOString(),
    };
    
    setThreads(p => ({
      ...p,
      [activeRecipient]: { 
        ...p[activeRecipient], 
        messages: [...p[activeRecipient].messages, tmpMsg] 
      },
    }));
    
    setMessage("");
    scrollToBottom();

    // إرسال الرسالة الفعلي
    try {
      const saved = await fetchJSON(`/api/support/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: txt }),
      });
      
      setThreads(p => {
        const msgs = p[activeRecipient].messages.filter(m => m.id !== tempId);
        return {
          ...p,
          [activeRecipient]: { 
            ...p[activeRecipient], 
            messages: [...msgs, { ...saved, senderRole: saved.sender_type }] 
          },
        };
      });
      
      scrollToBottom();
    } catch (e) {
      console.error("فشل إرسال الرسالة:", e);
    }
  }, [activeRecipient, message, threads, user.id, loadMessages, scrollToBottom]);

  // --- التأثيرات ---

  // تحميل الرسائل عند تغيير المستلم النشط
  useEffect(() => {
    const currentThread = threads[activeRecipient];
    if (currentThread?.id && currentThread.messages.length === 0 && !currentThread.loading) {
      loadMessages(activeRecipient, currentThread.id);
    }
  }, [activeRecipient, threads, loadMessages]);

  // تحميل قائمة الثريدات
  useEffect(() => {
    let isMounted = true;
    
    const fetchThreads = async () => {
      try {
        const list = await fetchJSON("/api/support/threads", { cache: "no-store" });
        if (!isMounted) return;
        
        const adminThread = list.find(t => t.participant_type === "admin");
        const supThread = list.find(t => t.participant_type === "user");
        
        setThreads(prev => ({
          ...prev,
          ...(adminThread ? { 
            admin: { ...prev.admin, id: String(adminThread.id) } 
          } : {}),
          ...(supThread && hasSupervisor ? { 
            supervisor: { ...prev.supervisor, id: String(supThread.id) } 
          } : {})
        }));
      } catch (e) {
        console.error("فشل جلب الثريدات:", e);
      }
    };
    
    fetchThreads();
    return () => { isMounted = false; };
  }, [hasSupervisor]);

  // --- التصيير ---

  // إذا لم يكن هناك متلقين متاحين
  if (recipients.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">لا توجد قنوات دعم متاحة حاليًا</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-[var(--background)] direction-rtl text-right">
      {/* زر عرض/إخفاء القائمة في الجوال */}
      <button 
        onClick={() => document.getElementById('sidebar').classList.toggle('hidden')}
        className="md:hidden flex items-center justify-center p-3 bg-[var(--card)] border-b border-[var(--border)]"
      >
        <span className="text-[var(--text-primary)]">☰ عرض قنوات الدعم</span>
      </button>

      {/* قائمة الجهات */}
      <aside 
        id="sidebar" 
        className="w-full md:w-72 border-l border-[var(--border)] bg-[var(--card)]/50 overflow-y-auto hidden md:block"
      >
        <h2 className="p-4 md:p-6 text-lg md:text-xl font-semibold text-[var(--text-primary)]">الدعم الفني</h2>
        <ul className="space-y-2 px-2 md:px-4 pb-4 md:pb-6">
          {recipients.map((r) => (
            <li
              key={r.id}
              onClick={() => {
                setActiveRecipient(r.id);
                // إخفاء القائمة بعد الاختيار في وضع الجوال
                if (window.innerWidth < 768) {
                  document.getElementById('sidebar').classList.add('hidden');
                }
              }}
              className={`p-3 md:p-4 rounded-lg cursor-pointer transition ${
                activeRecipient === r.id
                  ? "border-2 border-yellow-500 shadow-lg shadow-yellow-500/20"
                  : "hover:bg-[var(--background-hover)]"
              }`}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  {React.cloneElement(r.icon, { className: 'w-full h-full' })}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm md:text-base text-[var(--text-primary)]">{r.label}</h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{r.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* مساحة المحادثة */}
      <section className="flex-1 flex flex-col">
        <header className="h-14 md:h-16 px-4 md:px-6 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--card)]/60 backdrop-blur">
          {activeRecipient === "admin" ? (
            <FaHeadset className="w-6 h-6 md:w-8 md:h-8 text-[var(--text-secondary)]" />
          ) : (
            <FaUserTie className="w-6 h-6 md:w-8 md:h-8 text-[var(--text-secondary)]" />
          )}
          <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">
            {activeRecipient === "admin" ? "مشرف الموقع" : "المشرف الشخصي"}
          </h3>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
          {threads[activeRecipient]?.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[90%] p-3 md:p-4 rounded-lg text-sm md:text-base ${
                  msg.senderRole === "user" 
                    ? "bg-[var(--primary)] text-black" 
                    : "bg-gray-100"
                }`}
              >
                <p className="whitespace-pre-line break-words">{msg.content}</p>
                <span className="block mt-1 text-[10px] md:text-xs text-[var(--blue)]">
                  {new Date(msg.timestamp).toLocaleTimeString("ar-EG", {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} className="h-4 md:h-6" />
        </main>

        <footer className="border-t border-[var(--border)] p-3 md:p-4 bg-[var(--card)]/60">
          <div className="flex gap-2 md:gap-4">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 p-2 md:p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)] text-sm md:text-base"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="px-4 md:px-6 py-2 rounded-lg bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 disabled:opacity-50 flex items-center gap-1 md:gap-2 text-sm md:text-base"
              aria-label="إرسال الرسالة"
            >
              <span className="hidden md:inline">إرسال</span> <FaPaperPlane className="text-sm md:text-base" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

// المكون الرئيسي المعبأ
export default function Support() {
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // جلب جلسة المستخدم والتحقق من دوره
  useEffect(() => {
    let mounted = true;
    
    const loadUserData = async () => {
      try {
        const ud = await fetchUserDataFromSession();
        if (mounted) {
          setUserData(ud);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };
    
    loadUserData();
    
    return () => {
      mounted = false;
    };
  }, []);

  // عرض حالة التحميل
  if (authLoading) {
    return <LoadingState />;
  }

  // إذا كان المستخدم مشرفًا، لا نعرض هذه الصفحة
  if (!isNotAdmin(userData)) {
    return <AdminAccessDenied />;
  }

  // عرض محتوى الدعم مع بيانات المستخدم
  return <SupportContent user={userData} />;
}
