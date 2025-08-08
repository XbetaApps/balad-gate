// file: ./src/app/profile/components/AdminSupport.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaUserTie, FaPaperPlane } from "react-icons/fa";
import "../profile-styles.css";

/** التحقق من دور الأدمن */
function isAdmin(userData) {
  return !!userData && Number(userData.role_id) === 4;
}

/** جلب بيانات الجلسة وتوحيد role_id */
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
  const role_id =
    data?.rawPayload?.role_id ??
    data?.user?.role_id ??
    null;
  return { ...data.user, role_id };
}

/** أداة مبسطة لطلبات JSON */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { credentials: "include", ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

export default function AdminSupport() {
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [threadsList, setThreadsList] = useState([]);
  const [threads, setThreads] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState("");
  const bottomRef = useRef(null);
  const isUserAdmin = userData && isAdmin(userData);

  // جلب جلسة المستخدم والتحقّق من دوره
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAuthLoading(true);
      try {
        const ud = await fetchUserDataFromSession();
        if (mounted) {
          setUserData(ud);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (mounted) {
          setAuthLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // جلب قائمة الثريدات عندما يصبح المستخدم مشرفًا
  useEffect(() => {
    if (!isUserAdmin) return;
    
    let mounted = true;
    
    const fetchThreads = async () => {
      try {
        const list = await fetchJSON("/api/support/threads", { cache: "no-store" });
        if (!mounted) return;
        
        const filtered = list.filter(t => t.participant_type !== "admin");
        setThreadsList(filtered);
        
        const init = {};
        filtered.forEach(t => {
          init[t.id] = { id: t.id, messages: [], loading: false };
        });
        
        setThreads(init);
        if (filtered.length > 0) setActiveId(filtered[0].id);
      } catch (e) {
        console.error("فشل جلب الثريدات:", e);
      }
    };
    
    fetchThreads();
    
    return () => { mounted = false; };
  }, [isUserAdmin]);

  // تحميل رسائل الثريد النشط
  const loadMessages = async (threadId) => {
    if (!threads[threadId]) return;
    
    setThreads(p => ({ ...p, [threadId]: { ...p[threadId], loading: true } }));
    
    try {
      const msgs = await fetchJSON(`/api/support/threads/${threadId}/messages`, { cache: "no-store" });
      
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
        [threadId]: { 
          ...p[threadId], 
          messages: normalized, 
          loading: false 
        }
      }));
      
      scrollToBottom();
    } catch (e) {
      console.error("فشل جلب الرسائل:", e);
      setThreads(p => ({ 
        ...p, 
        [threadId]: { 
          ...p[threadId], 
          loading: false 
        } 
      }));
    }
  };

  // تحميل الرسائل عند تغيير الثريد النشط
  useEffect(() => {
    if (
      isUserAdmin &&
      activeId &&
      threads[activeId] &&
      threads[activeId].messages.length === 0 &&
      !threads[activeId].loading
    ) {
      loadMessages(activeId);
    }
  }, [activeId, threads, isUserAdmin]);

  // إرسال رسالة من الأدمن
  const handleSend = async () => {
    const txt = message.trim();
    if (!txt || !activeId) return;

    // رسالة مؤقتة
    const tmpId = `tmp-${Date.now()}`;
    const tmpMsg = {
      id: tmpId,
      threadId: activeId,
      senderId: userData.id,
      senderRole: "admin",
      content: txt,
      timestamp: new Date().toISOString(),
    };
    setThreads(p => ({
      ...p,
      [activeId]: { ...p[activeId], messages: [...p[activeId].messages, tmpMsg] }
    }));
    setMessage("");
    scrollToBottom();

    // الإرسال الفعلي
    try {
      const saved = await fetchJSON(`/api/support/threads/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: txt }),
      });
      setThreads(p => {
        const withoutTmp = p[activeId].messages.filter(m => m.id !== tmpId);
        return {
          ...p,
          [activeId]: {
            ...p[activeId],
            messages: [
              ...withoutTmp,
              {
                id: saved.id,
                threadId: saved.thread_id,
                senderId: saved.sender_id,
                senderRole: saved.sender_type,
                content: saved.content,
                timestamp: saved.created_at,
              }
            ]
          }
        };
      });
      scrollToBottom();
    } catch (e) {
      console.error("فشل إرسال الرسالة:", e);
    }
  };

  const scrollToBottom = () =>
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    );

  return (
    <div className="flex h-full bg-[var(--background)] direction-rtl text-right">
      {/* قائمة جهات الاتصال المستخرجة */}
      <aside className="w-72 border-l border-[var(--border)] bg-[var(--card)]/50 overflow-y-auto">
        <h2 className="p-6 text-xl font-semibold text-[var(--text-primary)]">
          جهات الاتصال
        </h2>
        <ul className="space-y-2 px-4 pb-6">
          {threadsList.map(t => (
            <li
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`p-4 rounded-lg cursor-pointer transition ${
                activeId === t.id
                  ? "border-2 border-yellow-500 shadow-lg shadow-yellow-500/20"
                  : "hover:bg-[var(--background-hover)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <FaUser className="w-8 h-8 text-[var(--text-secondary)]" />
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {t.participant_name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {t.last_message}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {threadsList.length === 0 && (
            <li className="p-4 text-center text-[var(--text-secondary)]">
              لا توجد جهات اتصال
            </li>
          )}
        </ul>
      </aside>

      {/* مساحة المحادثة */}
      <section className="flex-1 flex flex-col">
        <header className="h-16 px-6 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--card)]/60 backdrop-blur">
          <FaUserTie className="w-8 h-8 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {threadsList.find(t => t.id === activeId)?.participant_name || ""}
          </h3>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {(threads[activeId]?.messages || []).map(msg => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderRole === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] p-4 rounded-lg ${
                  msg.senderRole === "user" ? "bg-[var(--primary)] text-black" : "bg-gray-100"
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                <span className="block mt-1 text-xs text-[var(--blue)]">
                  {new Date(msg.timestamp).toLocaleTimeString("ar-EG")}
                </span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </main>

        <footer className="border-t border-[var(--border)] p-6 bg-[var(--card)]/60">
          <div className="flex gap-4">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]"
            />
            <button
              onClick={handleSend}
              className="px-6 py-2 rounded-lg bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 flex items-center gap-2"
            >
              إرسال <FaPaperPlane />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
