'use client';

import { useState, useEffect } from 'react';
import { FaComments, FaPhone, FaVideo, FaSearch, FaEllipsisV } from 'react-icons/fa';
import '/profile-styles.css';

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // تحميل البيانات
  useEffect(() => {
    const t = setTimeout(() => {
      const mockData = [
        {
          id: 1,
          name: 'صيدلية النيل',
          type: 'store',
          lastMessage: 'نعم، نحن نوفر هذا الدواء',
          timestamp: 'منذ 10 دقائق',
          unread: 3,
          avatar: '/store1.jpg'
        },
        {
          id: 2,
          name: 'محمد أحمد',
          type: 'user',
          lastMessage: 'هل الدواء متوفر؟',
          timestamp: 'منذ ساعة',
          unread: 1,
          avatar: '/user1.jpg'
        },
        {
          id: 3,
          name: 'صيدلية النخيل',
          type: 'store',
          lastMessage: 'تم التوصيل بنجاح',
          timestamp: 'منذ 2 ساعات',
          unread: 0,
          avatar: '/store2.jpg'
        }
      ];

      setChats(mockData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(t);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    setUnreadCount(0);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">المحادثات</h2>
      </div>

      <div className="flex h-full">
        {/* قائمة المحادثات */}
        <div className="w-64 border-r border-[var(--border)] bg-[var(--card)]">
          {/* رأس القائمة */}
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[var(--text-primary)]">المحادثات</h3>
              <button className="text-[var(--text-secondary)] hover:text-[var(--primary)]">
                <FaEllipsisV />
              </button>
            </div>
          </div>

          {/* بحث */}
          <div className="p-4 border-b border-[var(--border)]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="ابحث عن محادثة..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* قائمة المحادثات */}
          <div className="overflow-y-auto p-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  layout
                  className="p-3 rounded-lg bg-gray-200/30 animate-pulse mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-300/30" />
                    <div>
                      <div className="h-4 w-24 bg-gray-300/30 rounded mb-2" />
                      <div className="h-3 w-32 bg-gray-300/30 rounded" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : chats
              .filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(chat => (
                <motion.div
                  key={chat.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-3 rounded-lg cursor-pointer ${
                    activeChat?.id === chat.id ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--background-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-full h-full object-cover"
                      />
                      {chat.type === 'store' && (
                        <span className="absolute bottom-0 right-0 bg-[var(--primary)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          <FaStore />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)] truncate">{chat.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{chat.lastMessage}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-[var(--text-secondary)]">{chat.timestamp}</span>
                      {chat.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center mt-1">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        {/* محتوى المحادثة */}
        <div className="flex-1 flex flex-col">
          {/* رأس المحادثة */}
          {activeChat && (
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  >
                    <FaChevronLeft />
                  </button>
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">{activeChat.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">متجر</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-[var(--text-secondary)] hover:text-[var(--primary)]">
                    <FaPhone />
                  </button>
                  <button className="text-[var(--text-secondary)] hover:text-[var(--primary)]">
                    <FaVideo />
                  </button>
                  <button className="text-[var(--text-secondary)] hover:text-[var(--primary)]">
                    <FaEllipsisV />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* محتوى المحادثة */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeChat && (
              <>
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[var(--text-secondary)]">ابدأ المحادثة...</p>
                  </div>
                )}
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === 'me'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--background)] text-[var(--text-primary)]'
                      }`}
                    >
                      {message.text}
                      <div className="text-xs text-right mt-1">
                        <span className="text-[var(--text-secondary)]">{message.timestamp}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* شريط الإدخال */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => console.log('إضافة مرفق')}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)]"
              >
                <FaPaperclip />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالة..."
                className="flex-1 min-w-0 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className={`px-4 py-2 rounded-lg ${
                  newMessage.trim()
                    ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90'
                    : 'bg-[var(--background-hover)] text-[var(--text-secondary)] cursor-not-allowed'
                }`}
              >
                إرسال
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
