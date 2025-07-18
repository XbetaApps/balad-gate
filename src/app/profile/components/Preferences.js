import React, { useState, useEffect } from 'react';
import { FaTags, FaRobot, FaArchive, FaCheck, FaTimes, FaSearch, FaPlus, FaPaperPlane, FaMinus } from 'react-icons/fa';

const Preferences = () => {
  // حالات التبويبات
  const [activeTab, setActiveTab] = useState('approved');
  
  // حالات التصنيفات
  const [approvedTags, setApprovedTags] = useState(['تكنولوجيا', 'رياضة', 'سياحة']);
  const [suggestedTags, setSuggestedTags] = useState(['تعليم', 'صحة', 'فنون']);
  const [archivedTags, setArchivedTags] = useState(['سياسة', 'اقتصاد']);
  
  // حالة البحث
  const [searchQuery, setSearchQuery] = useState('');
  
  // حالة المحادثة مع المساعد
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  
  // حالة طي المساعد
  const [isAssistantExpanded, setIsAssistantExpanded] = useState(true);
  
  // وظائف إدارة التصنيفات
  const approveTag = (tag) => {
    setSuggestedTags(suggestedTags.filter(t => t !== tag));
    setApprovedTags([...approvedTags, tag]);
  };
  
  const archiveTag = (tag, from) => {
    if (from === 'approved') {
      setApprovedTags(approvedTags.filter(t => t !== tag));
    } else {
      setSuggestedTags(suggestedTags.filter(t => t !== tag));
    }
    setArchivedTags([...archivedTags, tag]);
  };
  
  const restoreTag = (tag) => {
    setArchivedTags(archivedTags.filter(t => t !== tag));
    setSuggestedTags([...suggestedTags, tag]);
  };
  
  const deleteTag = (tag) => {
    setArchivedTags(archivedTags.filter(t => t !== tag));
  };
  
  // وظيفة إرسال رسالة للمساعد
  const sendMessage = () => {
    if (chatInput.trim() === '') return;
    
    const userMessage = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    
    // هنا سيتم إضافة المنطق لمعالجة الرسالة بواسطة الذكاء الاصطناعي
    // واستخراج التصنيفات المقترحة
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: 'لقد قمت بتحليل رسالتك واقترح عليك هذه التصنيفات: [تصنيف1, تصنيف2]',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
        suggestedTags: ['تصنيف1', 'تصنيف2']
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };
  
  // وظيفة البحث
  const filteredTags = {
    approved: approvedTags.filter(tag => tag.includes(searchQuery)),
    suggested: suggestedTags.filter(tag => tag.includes(searchQuery)),
    archived: archivedTags.filter(tag => tag.includes(searchQuery)),
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
          التفضيلات
        </div>
      </div>
      {/* شريط البحث */}
      <div className="p-4 border-b border-[var(--border)] dark:border-[var(--gold-border)]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن تصنيف..."
          className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm text-[var(--text-on-card)]"
        />
      </div>
      {/* قائمة التصنيفات */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTags[activeTab].length === 0 ? (
          <p className="text-center text-[var(--text-on-card)] py-8">
            لا يوجد عناصر في هذا القسم
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTags[activeTab].map((tag, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg border border-[var(--border)] dark:border-[var(--gold-border)] bg-[var(--card)] flex justify-between items-center"
              >
                <span className="font-medium text-[var(--text-on-card)]">{tag}</span>
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
                        onClick={() => archiveTag(tag, 'suggested')}
                        className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                        title="أرشفة"
                      >
                        <FaArchive />
                      </button>
                    </>
                  )}
                  {activeTab === 'approved' && (
                    <button 
                      onClick={() => archiveTag(tag, 'approved')}
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
                        title="حذف"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* مساعد الذكاء الاصطناعي العائم */}
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
              {chatMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`mb-2 ${msg.sender === 'user' ? 'text-right' : ''}`}
                >
                  <div className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-[var(--primary)] text-[var(--text-on-primary)]' : 'bg-[var(--assistant-bubble)] text-[var(--text-on-card)]'}`}>
                    {msg.text}
                  </div>
                  <div className="text-xs text-[var(--text-on-card)] mt-1">
                    {msg.timestamp}
                  </div>
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
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
