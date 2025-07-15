"use client";
import React, { useState } from "react";
import {
  FaHeadset,
  FaUserTie,
  FaUserCircle,
  FaPaperPlane,
} from "react-icons/fa";
import "../profile-styles.css"; // عدِّل المسار عند الحاجة

/**
 * Support – قناة تواصل مع مشرف الموقع أو المشرف الشخصي.
 *
 * • يحدَّد وجود المشرف الشخصي من user.supervisorId.
 * • كل رسالة: فقاعات RTL، بلا حدود للرسائل الواردة.
 */

export default function Support({ user }) {
  /* ---------------- حالات ---------------- */
  const [message, setMessage] = useState("");
  const [activeRecipient, setActiveRecipient] = useState("admin");
  const hasSupervisor = user.supervisorId !== null;

  // تخصيص المحادثات لكل جهة
  const [chats, setChats] = useState({
    admin: [],
    ...(hasSupervisor ? { supervisor: [] } : {})
  });

  /* ---------------- إرسال ---------------- */
  const handleSend = () => {
    if (!message.trim()) return;

    // إنشاء رسالة جديدة
    const newMsg = {
      id: Date.now(),
      text: message,
      sender: "user",
      ts: new Date().toLocaleTimeString(),
    };

    // تحديث المحادثة الخاصة بالجهة الحالية
    setChats(prev => ({
      ...prev,
      [activeRecipient]: [...(prev[activeRecipient] || []), newMsg]
    }));

    setMessage("");

    // ردّ تلقائي تجريبي
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        text: "تم استلام رسالتك، سنرد في أقرب وقت ممكن",
        sender: activeRecipient,
        ts: new Date().toLocaleTimeString(),
      };

      setChats(prev => ({
        ...prev,
        [activeRecipient]: [...(prev[activeRecipient] || []), reply]
      }));
    }, 1500);
  };

  /* ---------------- خيارات الجهات ---------------- */
  const recipients = [
    {
      id: "admin",
      label: "مشرف الموقع",
      desc: "للاستفسارات العامة والأخطاء الفنية",
      icon: <FaHeadset className="w-8 h-8 text-[var(--text-secondary)]" />,
    },
    ...(hasSupervisor
      ? [
          {
            id: "supervisor",
            label: "المشرف الشخصي",
            desc: `مشرفك: ${user.supervisorName}`,
            icon: <FaUserTie className="w-8 h-8 text-[var(--text-secondary)]" />,
          },
        ]
      : []),
  ];

  /* ---------------- واجهة ---------------- */
  return (
    <div className="flex h-full bg-[var(--background)] direction-rtl text-right">
      {/* قائمة الجهات */}
      <aside className="w-72 border-l border-[var(--border)] bg-[var(--card)]/50 overflow-y-auto">
        <h2 className="p-6 text-xl font-semibold text-[var(--text-primary)]">
          الدعم الفني
        </h2>
        <ul className="space-y-2 px-4 pb-6">
          {recipients.map((r) => (
            <li
              key={r.id}
              onClick={() => setActiveRecipient(r.id)}
              className={`p-4 rounded-lg cursor-pointer transition ${
                activeRecipient === r.id
                  ? "border-2 border-yellow-500 shadow-lg shadow-yellow-500/20"
                  : "hover:bg-[var(--background-hover)]"
              }`}
            >
              <div className="flex items-center gap-3">
                {r.icon}
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {r.label}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {r.desc}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* مساحة المحادثة */}
      <section className="flex-1 flex flex-col">
        {/* رأس */}
        <header className="h-16 px-6 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--card)]/60 backdrop-blur">
          {activeRecipient === "admin" ? (
            <FaHeadset className="w-8 h-8 text-[var(--text-secondary)]" />
          ) : (
            <FaUserTie className="w-8 h-8 text-[var(--text-secondary)]" />
          )}
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {activeRecipient === "admin" ? "مشرف الموقع" : "المشرف الشخصي"}
          </h3>
        </header>

        {/* الرسائل */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {(chats[activeRecipient] || []).map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] p-4 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-[var(--primary)] text-black"
                    : "bg-gray-100" // لا حدود هنا
                }`}
              >
                <p className="text-base">{msg.text}</p>
                <span className="block mt-1 text-xs text-[var(--blue)]">
                  {msg.ts}
                </span>
              </div>
            </div>
          ))}
        </main>

        {/* إدخال رسالة */}
        <footer className="border-t border-[var(--border)] p-6 bg-[var(--card)]/60">
          <div className="flex gap-4">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]"
            />
            <button
              onClick={handleSend}
              className="px-6 py-2 rounded-lg bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 flex items-center gap-2"
            >
              إرسال
              <FaPaperPlane />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
