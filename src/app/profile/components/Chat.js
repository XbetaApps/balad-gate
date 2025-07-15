"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaPaperPlane,
  FaStore,
  FaUserCircle,
  FaBars,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../profile-styles.css";

/**
 * ChatPage – واجهة محادثات متكاملة (قائمة محادثات + شاشة الرسائل).
 * ----------------------------------------------------------------
 * • شريط جانبي يحتوي على حقل بحث وقائمة المحادثات (متاجر وأعضاء).
 * • عند النقر على محادثة يتم عرض الرسائل في اللوحة اليمنى.
 * • إمكانية إرسال رسالة جديدة (نموذج إدخال + زر إرسال).
 * • عرض اسم وصورة (أو أيقونة) المتجر/العضو، وآخر رسالة، وعدّاد غير مقروء.
 * • انتقالات Framer‑Motion لرسائل جديدة.
 */

export default function ChatPage() {
  /* ---------------- بيانات تجريبية ---------------- */
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({}); // { convId: [ {id,text,inbound,timestamp} ] }
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    /* Dummy data */
    const convs = [
      {
        id: 1,
        name: "صيدلية النيل",
        avatar: "/store1.jpg",
        type: "store",
        last: "هل متوفر دواء XYZ؟",
        unread: 2,
      },
      {
        id: 2,
        name: "Ahmed A.",
        avatar: "",
        type: "user",
        last: "شكراً على الرد!",
        unread: 0,
      },
    ];

    const msgs = {
      1: [
        { id: 101, text: "مرحبا، هل متوفر دواء XYZ؟", inbound: true, timestamp: Date.now() - 3600000 },
        { id: 102, text: "نعم متوفر حاليًا.", inbound: false, timestamp: Date.now() - 3500000 },
      ],
      2: [
        { id: 201, text: "تم استلام طلبك.", inbound: true, timestamp: Date.now() - 7200000 },
        { id: 202, text: "شكراً على الرد!", inbound: false, timestamp: Date.now() - 7100000 },
      ],
    };

    setConversations(convs);
    setMessages(msgs);
    setActiveId(convs[0].id);
  }, []);

  /* ---------------- إرسال رسالة ---------------- */
  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      text: input,
      inbound: false,
      timestamp: Date.now(),
    };
    setMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));
    setInput("");
    // Scroll إلى الأسفل بعد الإرسال
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  /* ---------------- الفلترة ---------------- */
  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeMsgs = messages[activeId] || [];

  /* ---------------- مكونات فرعية ---------------- */
  const ConversationItem = ({ c }) => (
    <button
      onClick={() => {
        setActiveId(c.id);
        // تعيين unread = 0 عند الفتح
        setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition ${
        c.id === activeId ? "bg-[var(--primary)]/15" : "hover:bg-[var(--card)]"
      }`}
    >
      {c.avatar ? (
        <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <FaUserCircle className="w-10 h-10 text-[var(--text-secondary)]" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--text-primary)] truncate">{c.name}</p>
        <p className="text-xs text-[var(--text-secondary)] truncate">{c.last}</p>
      </div>
      {!!c.unread && (
        <span className="bg-[var(--primary)] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {c.unread}
        </span>
      )}
    </button>
  );

  const Bubble = ({ m }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
        m.inbound
          ? "bg-green-300 self-start rounded-bl-none"
          : "bg-[var(--primary)] text-black self-end rounded-br-none"
      }`}
    >
      {m.text}
      <span className="block text-[10px] mt-1 text-gray-900 dark:text-white text-left rtl:text-right">
        {new Date(m.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </motion.div>
  );

  /* ---------------- واجهة الصفحة ---------------- */
  return (
    <div className="h-screen flex overflow-hidden bg-[var(--background)] text-right direction-rtl">
      {/* الشريط الجانبي للمحادثات */}
      <aside className="w-72 shrink-0 border-l border-[var(--border)] bg-[var(--card)]/50 flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <FaSearch className="text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="ابحث عن محادثة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder-[var(--text-secondary)]"
          />
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConvs.map((c) => (
            <ConversationItem key={c.id} c={c} />
          ))}
        </nav>
      </aside>

      {/* منطقة الرسائل */}
      <section className="flex-1 flex flex-col">
        {/* رأس المحادثة */}
        <header className="h-16 border-b border-[var(--border)] px-4 flex items-center gap-3 bg-[var(--card)]/60 backdrop-blur">
          {activeId && (
            <>
              {conversations.find((c) => c.id === activeId)?.avatar ? (
                <img
                  src={conversations.find((c) => c.id === activeId).avatar}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <FaStore className="w-8 h-8 text-[var(--text-secondary)]" />
              )}
              <h3 className="font-medium text-[var(--text-primary)]">
                {conversations.find((c) => c.id === activeId)?.name}
              </h3>
            </>
          )}
        </header>

        {/* رسائل */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {activeMsgs.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </main>

        {/* إدخال رسالة جديدة */}
        {activeId && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 border-t border-[var(--border)] bg-[var(--card)]/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالة..." className="w-full pl-4 pr-10 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]" 
              //className="flex-1 py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm placeholder-[var(--text-secondary)]"
            />
            <button
              type="submit"
              className="p-3 rounded-lg bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 transition"
            >
              <FaPaperPlane />
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
