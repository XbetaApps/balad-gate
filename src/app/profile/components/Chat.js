"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaPaperPlane, FaUser, FaStore, FaSearch, FaTimes, FaComments } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../auth/AuthProvider";
import "../profile-styles.css";

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const fetchChats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // تحقق الجلسة
      const sRes = await fetch(`/api/test-session`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      const sData = await sRes.json();
      if (!sRes.ok || !sData.authenticated) throw new Error("انتهت جلستك، يرجى تسجيل الدخول مرة أخرى");

      // جلب المحادثات
      const res = await fetch(`/api/chats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "فشل تحميل المحادثات");
      }
      const data = await res.json();

      const formatted = data.map((c) => ({
        id: c.id,
        participantName: c.participant_name || "مستخدم مجهول",
        participantAvatar: c.participant_avatar || null,
        lastMessage: c.last_message || "لا توجد رسائل",
        lastMessageAt: c.last_message_at || new Date().toISOString(),
        unreadCount: parseInt(c.unread_count) || 0,
        participantType: c.participant_type || "user",
        isStore: c.participant_type === "store",
        isOnline: false,
      }));

      setChats(formatted);
    } catch (e) {
      console.error("Error fetching chats:", e);
      if (chats.length === 0) alert(e.message || "حدث خطأ أثناء تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  }, [user?.id, token, chats.length]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat?.id) return;

    try {
      // تحقق الجلسة
      const sRes = await fetch(`/api/test-session`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      const sData = await sRes.json();
      if (!sRes.ok || !sData.authenticated) throw new Error("انتهت جلستك، يرجى تسجيل الدخول مرة أخرى");

      setLoading(true);

      // رسائل المحادثة
      const res = await fetch(`/api/conversations/${selectedChat.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "فشل تحميل الرسائل");
      }
      const data = await res.json();

      setMessages((prev) => {
        if (data.length === prev.length) {
          const changed = data.some(
            (m, i) =>
              m.id !== prev[i]?.id ||
              m.content !== prev[i]?.content ||
              m.is_read !== prev[i]?.is_read
          );
          if (!changed) return prev;
        }
        return data.map((m) => ({
          id: m.id,
          conversation_id: m.conversation_id,
          senderId: m.sender_id,
          sender_type: m.sender_type,
          content: m.content,
          is_read: m.is_read,
          timestamp: m.created_at,
          sender_name: m.sender_name || "مستخدم مجهول",
          sender_avatar: m.sender_avatar || null,
          status: "sent",
        }));
      });

      // تحديث قائمة المحادثات (عداد غير المقروء/آخر رسالة)
      fetchChats();
    } catch (e) {
      console.error("Error fetching messages:", e);
      if (messages.length === 0) alert(e.message || "حدث خطأ أثناء تحميل الرسائل");
    } finally {
      setLoading(false);
    }
  }, [selectedChat?.id, token, messages.length, fetchChats]);

  useEffect(() => {
    if (user?.id) {
      fetchChats();
      const i = setInterval(fetchChats, 30000);
      return () => clearInterval(i);
    }
  }, [user?.id, fetchChats]);

  useEffect(() => {
    if (selectedChat?.id) {
      fetchMessages();
      const i = setInterval(fetchMessages, 15000);
      return () => clearInterval(i);
    }
  }, [selectedChat?.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat?.id || !user?.id) return;

    const contentToSend = newMessage;
    const tempId = Date.now();

    const optimistic = {
      id: tempId,
      conversation_id: selectedChat.id,
      senderId: user.id,
      sender_type: user.role === "store" ? "store" : "user",
      content: contentToSend,
      timestamp: new Date().toISOString(),
      is_read: false,
      status: "sending",
      sender_name: user.name || "أنا",
      sender_avatar: user.image || null,
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    try {
      const res = await fetch(`/api/conversations/${selectedChat.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ content: contentToSend }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "فشل إرسال الرسالة");
      }

      const saved = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: saved.id,
                conversation_id: saved.conversation_id,
                senderId: saved.sender_id,
                sender_type: saved.sender_type,
                content: saved.content,
                timestamp: saved.created_at,
                is_read: saved.is_read ?? false,
                status: "sent",
                sender_name: user.name || "أنا",
                sender_avatar: user.image || null,
              }
            : m
        )
      );

      // تحديث قائمة المحادثات
      await fetchChats();
    } catch (e) {
      console.error("Error sending message:", e);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !selectedChat) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">الرسائل</h2>
            <div className="relative mt-3">
              <input
                type="text"
                placeholder="ابحث عن محادثة..."
                className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">لا توجد محادثات</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer flex items-center ${
                      selectedChat?.id === chat.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      setSelectedChat(chat);
                      setMessages([]); // تفريغ مؤقت حتى يتم الجلب
                    }}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {chat.participantAvatar ? (
                          <img
                            src={chat.participantAvatar}
                            alt={chat.participantName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaUser className="text-gray-400 text-xl" />
                        )}
                      </div>
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="mr-3 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900">{chat.participantName}</h3>
                        <span className="text-xs text-gray-500">
                          {chat.lastMessageAt
                            ? new Date(chat.lastMessageAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage || "لا توجد رسائل"}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-col flex-1 bg-white">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <button
                  className="md:hidden mr-2 text-gray-500"
                  onClick={() => setSelectedChat(null)}
                >
                  <FaTimes className="text-xl" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedChat.participantAvatar ? (
                      <img
                        src={selectedChat.participantAvatar}
                        alt={selectedChat.participantName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUser className="text-gray-400 text-lg" />
                    )}
                  </div>
                  {selectedChat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="mr-3">
                  <h3 className="font-medium text-gray-900">
                    {selectedChat.participantName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedChat.isOnline ? "متصل الآن" : "غير متصل"}
                  </p>
                </div>
                <div className="mr-auto">
                  {selectedChat.isStore && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FaStore className="ml-1" />
                      متجر
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <FaComments className="text-4xl mb-2 opacity-30" />
                    <p>لا توجد رسائل بعد</p>
                    <p className="text-sm mt-1">ابدأ المحادثة الآن</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                            m.senderId === user?.id
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-white border border-gray-200 rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm">{m.content}</p>
                          <div className="flex items-center justify-end mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(m.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {m.senderId === user?.id && (
                              <span className="mr-1 text-xs">
                                {m.status === "sending" ? "..." : m.status === "failed" ? "!" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="اكتب رسالتك..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    dir="auto"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-white p-3 rounded-l-lg hover:bg-primary-dark transition-colors"
                    disabled={!newMessage.trim()}
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <FaComments className="text-5xl mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">مرحبًا في الرسائل</h3>
              <p className="text-gray-500 mb-6">اختر محادثة لبدء المحادثة</p>
              <p className="text-sm text-gray-400">يمكنك التواصل مع البائعين والمشترين الآخرين</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Chat View */}
      <AnimatePresence>
        {selectedChat && (
          <motion.div
            className="fixed inset-0 bg-white z-50 md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween" }}
          >
            <div className="p-4 border-b border-gray-200 flex items-center">
              <button className="text-gray-500" onClick={() => setSelectedChat(null)}>
                <FaTimes className="text-xl" />
              </button>
              <div className="mr-3 flex-1 text-center">
                <h3 className="font-medium text-gray-900">{selectedChat.participantName}</h3>
                <p className="text-xs text-gray-500">
                  {selectedChat.isOnline ? "متصل الآن" : "غير متصل"}
                </p>
              </div>
            </div>

            <div className="h-[calc(100vh-130px)] p-4 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <FaComments className="text-4xl mb-2 opacity-30" />
                  <p>لا توجد رسائل بعد</p>
                  <p className="text-sm mt-1">ابدأ المحادثة الآن</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          m.senderId === user?.id
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-white border border-gray-200 rounded-tl-none"
                        }`}
                      >
                        <p className="text-sm">{m.content}</p>
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {m.senderId === user?.id && (
                            <span className="mr-1 text-xs">
                              {m.status === "sending" ? "..." : m.status === "failed" ? "!" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                  type="text"
                  className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="اكتب رسالتك..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  dir="auto"
                />
                <button
                  type="submit"
                  className="bg-primary text-white p-3 rounded-l-lg hover:bg-primary-dark transition-colors"
                  disabled={!newMessage.trim()}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
