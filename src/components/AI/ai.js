'use client';

import { useState, useRef, useEffect } from 'react';
import { config } from '@/components/config';
import { OpenAI } from 'openai';
import { getWeatherForCity, isWeatherQuestion, PALESTINIAN_CITIES } from '@/components/AI/weather';
import { isCurrencyQuestion, handleCurrencyQuestion, CURRENCIES, CURRENCY_NAMES } from '@/components/AI/many';
import { Box, IconButton, Paper, TextField, Typography, Fade, Slide, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';


const ChatContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: '20px',
  left: '20px', // تغيير من right إلى left
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start', // تغيير من flex-end إلى flex-start
}));

const ChatButton = styled(IconButton)(({ theme }) => ({
  width: '80px',
  height: '80px',
  backgroundColor: '#F59E0B',
  color: '#fff',
  position: 'fixed',
  bottom: '30px',
  left: '30px',
  zIndex: 9999,
  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
  border: '2px solid white',
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '&:hover': {
    backgroundColor: '#D97706',
    transform: 'scale(1.08) translateY(-3px)',
    boxShadow: '0 6px 25px rgba(245, 158, 11, 0.4)',
  },
  '& svg': {
    fontSize: '32px',
    transition: 'transform 0.3s ease',
  },
  '&:hover svg': {
    transform: 'scale(1.1)',
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    animation: 'ripple 2s infinite',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover:before': {
    opacity: 1,
  },
  '&:after': {
    content: '"مساعد ذكي"',
    position: 'absolute',
    left: '90px',
    whiteSpace: 'nowrap',
    backgroundColor: 'white',
    color: '#F59E0B',
    padding: '10px 18px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    opacity: 0,
    transform: 'translateX(10px)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    pointerEvents: 'none',
  },
  '&:hover:after': {
    opacity: 1,
    transform: 'translateX(0)',
    transform: 'translateX(0)',
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(1)',
      opacity: 0.6,
    },
    '100%': {
      transform: 'scale(1.3)',
      opacity: 0,
    },
  }
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  width: '400px',
  maxWidth: '90vw',
  height: '600px',
  maxHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  borderRadius: '16px',
  marginBottom: '15px',
  border: '1px solid #e0e0e0',
  background: '#ffffff',
  transform: 'translateY(20px)',
  opacity: 0,
  transition: 'all 0.3s ease',
  '&.open': {
    transform: 'translateY(0)',
    opacity: 1,
  },
  '& *': {
    fontFamily: 'var(--font-tajawal), sans-serif !important',
    color: '#000000',
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#F59E0B', // تم تغيير اللون الأزرق إلى ذهبي
  color: 'white',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => !['isUser', 'isLink'].includes(prop),
})(({ theme, isUser, isLink }) => ({
  maxWidth: '80%',
  padding: '10px 16px',
  margin: '8px 0',
  borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
  backgroundColor: isUser ? '#F59E0B' : (isLink ? '#e3f2fd' : theme.palette.grey[200]),
  color: 'black', // جعل النص أسود دائماً
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 1.5,
  '&:first-of-type': {
    marginTop: 'auto',
  },
}));

const InputContainer = styled(Box)({
  padding: '16px',
  borderTop: '1px solid #e0e0e0',
  backgroundColor: '#ffffff',
  display: 'flex',
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#bdbdbd',
    },
  },
  '& .MuiInputBase-input': {
    color: '#000000',
  },
});

const MessagesContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

// مفتاح التخزين المحلي للمحادثات
const CHAT_STORAGE_KEY = 'ai_chat_messages';

// List of Palestinian governorates
const PALESTINIAN_GOVERNORATES = [
  'القدس', 'رام الله', 'الخليل', 'بيت لحم', 'أريحا',
  'نابلس', 'طولكرم', 'قلقيلية', 'سلفيت', 'جنين',
  'طوباس', 'أريحا', 'غزة', 'خان يونس', 'رفح',
  'دير البلح', 'بيت لاهيا', 'جباليا', 'خان يونس', 'رفح'
];

// Function to check if the message is about road conditions and extract governorate
const isRoadConditionQuery = (text) => {
  const roadKeywords = [
    'حالة الطرق', 'حالة طريق', 'الطرق', 'الطرقات','طرق','حواجز',
    'حاجز', 'حالة الحواجز', 'هل الطرق مفتوحة', 
    'هل الشوارع مفتوحة', 'حالة المعابر', 'المرور',
    'road', 'roads', 'checkpoint', 'checkpoints', 'road conditions'
  ];
  
  const lowerText = text.trim().toLowerCase();
  
  // Check if it's a general road condition query
  const isGeneralQuery = roadKeywords.some(keyword => 
    lowerText === keyword.toLowerCase()
  );
  
  // Check if it's a direct checkpoint query (e.g., "حاجز المربعة")
  const checkpointMatch = lowerText.match(/(?:حاجز|بوابة|معبر|نقطة تفتيش|checkpoint|point)\s+(.+)/i);
  const checkpointName = checkpointMatch ? checkpointMatch[1].trim() : null;
  
  // Check if it's a road condition query with a governorate
  const hasGovernorate = PALESTINIAN_GOVERNORATES.some(gov => 
    lowerText.includes(gov.toLowerCase())
  );
  
  // If it's a direct checkpoint query, only match the checkpoint name
  if (checkpointName) {
    return {
      isRoadQuery: true,
      isGeneralQuery: false,
      governorate: null,
      checkpointName: checkpointName
    };
  }
  
  // For other road queries
  return {
    isRoadQuery: roadKeywords.some(keyword => lowerText.includes(keyword.toLowerCase())),
    isGeneralQuery: isGeneralQuery,
    governorate: hasGovernorate 
      ? PALESTINIAN_GOVERNORATES.find(gov => 
          lowerText.includes(gov.toLowerCase())
        )
      : null,
    checkpointName: null
  };
};

// Function to fetch road conditions
const fetchRoadConditions = async (checkpointName = '') => {
  try {
    // Fetch data from your API endpoint
    const response = await fetch('/api/roads');
    
    if (!response.ok) {
      throw new Error(`فشل في جلب البيانات (${response.status})`);
    }
    
    const result = await response.json();
    const data = result.data || [];
    
    if (!checkpointName) return data;
    
    // Search for the specific checkpoint
    const normalizedCheckpoint = checkpointName.trim().toLowerCase();
    const foundCheckpoint = data.find(item => 
      (item.checkpoint && item.checkpoint.toLowerCase().includes(normalizedCheckpoint)) ||
      (item.city && item.city.toLowerCase().includes(normalizedCheckpoint))
    );
    
    return foundCheckpoint || {
      checkpoint: checkpointName,
      city: 'غير معروف',
      entering_status: 'غير معروف',
      leaving_status: 'غير معروف',
      alert_text: 'لا توجد معلومات متوفرة عن هذه النقطة',
      entering_status_last_updated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching road conditions:', error);
    return {
      checkpoint: checkpointName || 'نقطة التفتيش',
      city: 'غير معروف',
      entering_status: 'غير معروف',
      leaving_status: 'غير معروف',
      alert_text: 'حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً.',
      entering_status_last_updated: new Date().toISOString()
    };
  }
};

// Format the road condition response
const formatRoadConditionResponse = (data, specificCheckpoint = '') => {
  if (!data) return 'عذراً، حدث خطأ أثناء جلب بيانات الطرق. يرجى المحاولة لاحقاً.';
  
  // If a specific checkpoint was requested
  if (specificCheckpoint && !Array.isArray(data)) {
    if (!data) return `عذراً، لا توجد معلومات متوفرة عن ${specificCheckpoint}`;
    
    let response = `🛣️ *${data.checkpoint || 'نقطة التفتيش'}*`;
    if (data.city) response += ` - ${data.city}`;
    
    response += `\n\n🚦 *حالة الدخول:* ${formatStatus(data.entering_status)}`;
    response += `\n🚦 *حالة الخروج:* ${formatStatus(data.leaving_status)}`;
    
    if (data.alert_text) {
      response += `\n\�\n📌 *ملاحظة:* ${data.alert_text}`;
    }
    
    if (data.entering_status_last_updated) {
      const updateTime = new Date(data.entering_status_last_updated);
      const now = new Date();
      const diffHours = Math.floor((now - updateTime) / (1000 * 60 * 60));
      
      let timeAgo = '';
      if (diffHours < 1) {
        timeAgo = 'منذ أقل من ساعة';
      } else if (diffHours === 1) {
        timeAgo = 'منذ ساعة';
      } else if (diffHours < 24) {
        timeAgo = `منذ ${diffHours} ساعات`;
      } else {
        timeAgo = updateTime.toLocaleString('ar-PS', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      response += `\n\n🕒 *آخر تحديث:* ${timeAgo}`;
    }
    
    return response;
  }
  
  // If no specific checkpoint was requested
  if (Array.isArray(data)) {
    if (data.length === 0) return 'لا توجد بيانات متاحة عن الطرق في الوقت الحالي.';
    
    // Group by city
    const groupedByCity = data.reduce((acc, road) => {
      const city = road.city || 'أخرى';
      if (!acc[city]) {
        acc[city] = [];
      }
      acc[city].push(road);
      return acc;
    }, {});
    
    let response = '🚧 *حالة الطرق الحالية* 🚧\n\n';
    
    // Add each city's checkpoints
    Object.entries(groupedByCity).forEach(([city, checkpoints]) => {
      response += `📍 *${city}*\n`;
      
      checkpoints.slice(0, 10).forEach(road => {
        const status = road.entering_status === 'سالك' && road.leaving_status === 'سالك' ? '✅' : '⚠️';
        response += `${status} ${road.checkpoint}: `;
        response += `دخول: ${formatStatus(road.entering_status)}, `;
        response += `خروج: ${formatStatus(road.leaving_status)}\n`;
      });
      
      response += '\n';
    });
    
    if (data.length > 10) {
      response += '\n💡 يمكنك السؤال عن نقطة محددة لمعرفة المزيد من التفاصيل.';
    }
    
    return response;
  }
  
  return 'عذراً، لم أتمكن من العثور على المعلومات المطلوبة.';
};

// Helper function to format status with emojis
const formatStatus = (status) => {
  if (!status) return '❓ غير معروف';
  
  const statusMap = {
    'سالك': '🟢 سالك',
    'مغلق': '🔴 مغلق',
    'مفتوح': '🟢 مفتوح',
    'مزدحم': '🟠 مزدحم',
    'مغلق للصيانة': '🔧 مغلق للصيانة',
    'مغلق مؤقتاً': '⏳ مغلق مؤقتاً'
  };
  
  return statusMap[status] || `❓ ${status}`;
};

export default function AIChatWidget() {
  console.log('AIChatWidget component is rendering');
  
  const [isOpen, setIsOpen] = useState(false);
  
  // تحميل الرسائل المحفوظة من localStorage عند التحميل الأولي
  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        { text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', isUser: false }
      ];
    }
    return [
      { text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', isUser: false }
    ];
  });
  
  // حفظ الرسائل في localStorage عند تغييرها
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);
  
  useEffect(() => {
    console.log('AIChatWidget mounted, isOpen:', isOpen);
    return () => console.log('AIChatWidget unmounted');
  }, [isOpen]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [awaitingGovernorate, setAwaitingGovernorate] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add debug effect to check if component mounts
  useEffect(() => {
    console.log('AI Chat Widget mounted');
    // Only check for token in browser environment
    if (typeof window !== 'undefined') {
      console.log('HF Token available:', !!process.env.NEXT_PUBLIC_HF_TOKEN);
    }
  }, []);

  // دالة للتحقق من أن السؤال يتعلق بالأخبار بدقة
  const isNewsQuery = (text) => {
    // كلمات مفتاحية للأخبار مع استثناء الكلمات المشتركة مع مواضيع أخرى
    const newsKeywords = [
      // كلمات إخبارية عامة
      'أخبار', 'خبر', 'أحداث', 'تحديثات', 'الأنباء', 'العناوين', 'الجرائد', 'الصحف', 'التقارير',
      'صحيفة', 'تقرير', 'تصريح', 'بيان', 'مؤتمر صحفي', 'اخبار', 'نشرة', 'الاخبار',
      'عاجل', 'طارئ', 'مستجدات', 'تطورات', 'الاحداث', 'وقائع الأيام',
      
      // رياضة
      'رياضة', 'كرة قدم', 'مباراة', 'دوري', 'بطولة', 'منتخب', 'نادي', 'ملعب', 'هدف', 'نتيجة',
      'مباريات', 'تصفيات', 'كأس', 'دور', 'ميدالية', 'مشاركة', 'منافسة',
      
      // صحة
      'صحة', 'طبية', 'طوارئ', 'وباء', 'فيروس', 'جائحة', 'إصابات', 'حالات', 'إجراءات وقائية',
      'علاج', 'دواء', 'مستشفى', 'مستوصف', 'عيادة', 'طوارئ', 'إسعاف',
      
     
      
      
      
      // سياسة
      'سياسة', 'حكومة', 'وزير', 'رئيس', 'وزارة', 'برلمان', 'مجلس', 'انتخابات', 'تصويت',
      'قانون', 'تشريع', 'قرار', 'اجتماع', 'قمة', 'مؤتمر', 'مفاوضات', 'اتفاقية',
      
    
      
      // تعليم
      'تعليم', 
      
     
      
      // كلمات إنجليزية
      'news', 'update', 'headline', 'report', 'breaking', 'latest', 'announcement', 'press',
      'sports', 'football', 'basketball', 'olympics', 'championship', 'tournament',
      'health', 'medical', 'hospital', 'emergency', 'pandemic', 'virus', 'vaccine',
      'technology', 'tech', 'smartphone', 'gadget', 'app', 'update', 'release',
      'economy', 'business', 'market', 'stock', 'investment', 'trading', 'finance',
      'politics', 'government', 'president', 'minister', 'parliament', 'election',
      'art', 'culture', 'music', 'film', 'movie', 'series', 'theater', 'exhibition',
      'education', 'school', 'university', 'student', 'teacher', 'exam', 'degree',
      'transport', 'airport', 'flight', 'train', 'station', 'ticket', 'travel'
    ];

    // كلمات قد تسبب تداخل مع مواضيع أخرى
    const excludeKeywords = [
      // كلمات العملات
      'سعر', 'دولار', 'يورو', 'شيكل', 'جنيه', 'ريال', 'دينار', 'ليرة', 'عملة', 'تحويل',
      'price', 'dollar', 'euro', 'shekel', 'pound', 'riyal', 'dinar', 'lira', 'currency', 'exchange',
      
      // كلمات الطقس
      'طقس', 'جو', 'حرارة', 'مطر', 'ثلج', 'عاصفة', 'رياح', 'رطوبة', 'توقعات', 'مناخ',
      'weather', 'temperature', 'rain', 'snow', 'storm', 'wind', 'humidity', 'forecast', 'climate',
      
      // كلمات عامة قد تسبب تداخل
      'كيف', 'ما هو', 'ما هي', 'متى', 'أين', 'لماذا', 'كيف', 'هل', 'كم', 'ماذا',
      'how', 'what', 'when', 'where', 'why', 'is', 'are', 'was', 'were', 'do', 'does', 'did'
    ];

    const textLower = text.toLowerCase().trim();
    const words = textLower.split(/\s+/);
    
    // التحقق من وجود كلمات استثناء أولاً
    const hasExcludedKeyword = excludeKeywords.some(keyword => 
      words.includes(keyword.toLowerCase()) || 
      textLower.includes(keyword.toLowerCase())
    );
    
    if (hasExcludedKeyword) {
      return false;
    }
    
    // التحقق من وجود كلمات إخبارية
    return newsKeywords.some(keyword => 
      words.includes(keyword.toLowerCase()) || 
      textLower.includes(keyword.toLowerCase())
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Clear input immediately
    const userInput = input;
    setInput('');
    setIsLoading(true);

    // Add user message and loading indicator in one update
    setMessages(prev => [
      ...prev.filter(msg => !msg.isTyping),
      { text: userInput, isUser: true },
      { text: 'جاري معالجة طلبك...', isUser: false, isTyping: true }
    ]);

    // Clean input and remove punctuation
    const cleanInput = userInput.trim().replace(/[؟?،,.]/g, '');
    
    // Check if we're waiting for a governorate
    if (awaitingGovernorate) {
      const mentionedGovernorate = PALESTINIAN_GOVERNORATES.find(gov => 
        cleanInput.toLowerCase().includes(gov.toLowerCase())
      );
      
      if (mentionedGovernorate) {
        // Show loading message
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
          { text: 'جاري البحث عن معلومات الطرق...', isUser: false, isTyping: true }
        ]);
        
        try {
          const roadData = await fetchRoadConditions();
          // Filter checkpoints by the mentioned governorate
          const filteredData = roadData.filter(item => 
            item.city && item.city.includes(mentionedGovernorate)
          );
          
          if (filteredData.length > 0) {
            const response = formatRoadConditionResponse(filteredData, mentionedGovernorate);
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
              { text: response, isUser: false }
            ]);
          } else {
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
              { 
                text: `عذراً، لا توجد معلومات متوفرة عن الحواجز في محافظة ${mentionedGovernorate} حالياً.`,
                isUser: false 
              }
            ]);
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الطرق:', error);
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
            { 
              text: 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطرق. يرجى المحاولة مرة أخرى لاحقاً.',
              isUser: false,
              isError: true
            }
          ]);
        }
        setAwaitingGovernorate(false);
        setIsLoading(false);
        return;
      }
    }
    
    // Check road conditions query if not waiting for governorate
    const roadQuery = isRoadConditionQuery(cleanInput);
    
    if (roadQuery.isRoadQuery) {
      // If it's a general road query without a governorate
      if (roadQuery.isGeneralQuery) {
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
          { 
            text: '🔍 من فضلك حدد المحافظة التي تريد معرفة حالة الطرق فيها.\nمثال: حالة الطرق في نابلس',
            isUser: false 
          }
        ]);
        setAwaitingGovernorate(true);
        setIsLoading(false);
        return;
      }
      
      // If it's a direct checkpoint query (e.g., "حاجز المربعة")
      if (roadQuery.checkpointName) {
        try {
          const roadData = await fetchRoadConditions();
          // Find the specific checkpoint with flexible matching
          const checkpoint = roadData.find(item => {
            if (!item.checkpoint) return false;
            const checkpointLower = item.checkpoint.toLowerCase();
            const searchTerm = roadQuery.checkpointName.toLowerCase();
            return checkpointLower.includes(searchTerm) || 
                   searchTerm.includes(checkpointLower) ||
                   checkpointLower.replace(/[^\u0600-\u06FF\s]/g, '').includes(searchTerm);
          });
          
          if (checkpoint) {
            const response = formatRoadConditionResponse(checkpoint, checkpoint.checkpoint);
            // Only show the direct response
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping),
              { text: response, isUser: false }
            ]);
          } else {
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping),
              { 
                text: `عذراً، لا توجد معلومات متوفرة عن ${roadQuery.checkpointName}.`,
                isUser: false 
              }
            ]);
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الطرق:', error);
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
            { 
              text: 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطرق. يرجى المحاولة مرة أخرى لاحقاً.',
              isUser: false,
              isError: true
            }
          ]);
        }
      }
      // If governorate is mentioned in the initial query (e.g., "حالة الطرق في نابلس")
      else if (roadQuery.governorate) {
        // Show loading message
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
          { text: 'جاري البحث عن معلومات الطرق...', isUser: false, isTyping: true }
        ]);
        
        try {
          const roadData = await fetchRoadConditions();
          // Filter checkpoints by the mentioned governorate
          const filteredData = roadData.filter(item => 
            item.city && item.city.includes(roadQuery.governorate)
          );
          
          if (filteredData.length > 0) {
            const response = formatRoadConditionResponse(filteredData, roadQuery.governorate);
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
              { text: response, isUser: false }
            ]);
          } else {
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
              { 
                text: `عذراً، لا توجد معلومات متوفرة عن الحواجز في محافظة ${roadQuery.governorate} حالياً.`,
                isUser: false 
              }
            ]);
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الطرق:', error);
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
            { 
              text: 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطرق. يرجى المحاولة مرة أخرى لاحقاً.',
              isUser: false,
              isError: true
            }
          ]);
        }
        setAwaitingGovernorate(false);
        setIsLoading(false);
        return;
      }
    }
    
    // If we're waiting for a governorate and user sent a governorate name
    if (awaitingGovernorate) {
      setIsLoading(true);
      
      // Add user message and loading indicator
      setMessages([
        { text: userInput, isUser: true },
        { text: 'جاري البحث عن معلومات الطرق...', isUser: false, isTyping: true }
      ]);
      
      const mentionedGovernorate = PALESTINIAN_GOVERNORATES.find(gov => 
        cleanInput.toLowerCase().includes(gov.toLowerCase())
      );
      
      if (mentionedGovernorate) {
        try {
          const roadData = await fetchRoadConditions();
          // Filter checkpoints by the mentioned governorate
          const filteredData = roadData.filter(item => 
            item.city && item.city.includes(mentionedGovernorate)
          );
          
          if (filteredData.length > 0) {
            const response = formatRoadConditionResponse(filteredData, mentionedGovernorate);
            setMessages([
              { text: userInput, isUser: true },
              { text: response, isUser: false }
            ]);
          } else {
            setMessages([
              { text: userInput, isUser: true },
              { 
                text: `عذراً، لا توجد معلومات متوفرة عن الحواجز في محافظة ${mentionedGovernorate} حالياً.`,
                isUser: false 
              }
            ]);
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الطرق:', error);
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
            { 
              text: 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطرق. يرجى المحاولة مرة أخرى لاحقاً.',
              isUser: false,
              isError: true
            }
          ]);
        }
      } else {
        // If no valid governorate was mentioned
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping && !msg.isWaitingForGovernorate),
          { 
            text: 'عذراً، لم يتم التعرف على اسم المحافظة. الرجاء إدخال اسم محافظة صحيح.\nمثال: نابلس، رام الله، الخليل',
            isUser: false 
          }
        ]);
      }
      
      setAwaitingGovernorate(false);
      setIsLoading(false);
      return;
    }
    
    // 1. التحقق من أسئلة الطقس أولاً
    const { isWeatherQuery: isWeather, city, isGeneralQuery } = isWeatherQuestion(cleanInput);
    if (isWeather) {
      // معالجة سؤال الطقس
      if (isGeneralQuery) {
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping),
          { 
            text: '🔍 من فضلك حدد المدينة التي تريد معرفة حالة الطقس فيها.\nمثال: ما حالة الطقس في رام الله؟',
            isUser: false 
          }
        ]);
        setIsLoading(false);
        return;
      }
      
      if (city) {
        try {
          const weatherData = await getWeatherForCity(city);
          const weatherMessage = formatWeatherMessage(weatherData);
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping),
            { 
              text: weatherMessage.trim(),
              isUser: false,
              weatherData: {
                ...weatherData,
                icon: weatherData.icon
              }
            }
          ]);
        } catch (error) {
          console.error('خطأ في جلب بيانات الطقس:', error);
          let errorMessage = 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطقس.\n';
          
          if (error.message.includes('المدينة غير معروفة')) {
            errorMessage = 'عذراً، لم أتمكن من العثور على هذه المدينة.\n';
            errorMessage += 'المدن المتوفرة: ' + Object.keys(PALESTINIAN_CITIES).join('، ');
          } else {
            errorMessage += 'يرجى المحاولة مرة أخرى لاحقاً.';
          }
          
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping),
            { 
              text: errorMessage,
              isUser: false,
              isError: true
            }
          ]);
        }
        setIsLoading(false);
        return;
      }
    }
    
    // 2. التحقق من أسئلة العملات ثانياً
    if (isCurrencyQuestion(cleanInput)) {
      // معالجة سؤال العملات
      const updateMessages = (newMessage) => {
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping && !msg.isCurrencyPrompt),
          newMessage
        ]);
      };

      await handleCurrencyQuestion(
        cleanInput,
        updateMessages,
        (show) => setShowCurrencyPrompt(show),
        (currency) => setSelectedCurrency(currency)
      );
      
      setIsLoading(false);
      return;
    }
    
    // 3. إذا كان السؤال عن حاجز محدد، نتخطى الرد التلقائي
    const isCheckpointQuery = isRoadConditionQuery(cleanInput).isRoadQuery && 
                            !isRoadConditionQuery(cleanInput).isGeneralQuery;
    
    if (isCheckpointQuery) {
      setIsLoading(false);
      return;
    }
    
    // 4. التحقق من الأسئلة المتعلقة بالخدمات
    const serviceQuestions = [
      'شو بتقدر تقدملي', 'شو بتقدر تعمل', 'ماذا يمكنك ان تفعل', 'ما فايدتك',
      'شو بساعدي', 'شو فائدتك', 'شو بتسوي', 'شو بتقدم', 'شو خدماتك',
      'شو بتساعدني', 'شو في عندك', 'شو في خدماتك', 'شو في مساعدتك'
    ];

    const isServiceQuestion = serviceQuestions.some(q => cleanInput.includes(q));
    
    if (isServiceQuestion) {
      const capabilitiesMessage = `أنا هنا لمساعدتك في خدمات الموقع كاملة:

• الأخبار
• حالة الطرق والمرور
• أسعار العملات
• حالة الطقس (اكتب اسم المدينة)
• الخدمات
• وأي استفسارات أخرى

كيف يمكنني مساعدتك اليوم؟`;
      
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        { text: capabilitiesMessage, isUser: false }
      ]);
      setIsLoading(false);
      return;
    }
    
    // 4. التحقق مما إذا كان الإدخال اسم مدينة فقط (لحالة الطقس)
    const cityNames = Object.keys(PALESTINIAN_CITIES);
    const isCityOnly = cityNames.some(city => cleanInput === city);
    
    if (isCityOnly) {
      try {
        const weatherData = await getWeatherForCity(cleanInput);
        const weatherMessage = formatWeatherMessage(weatherData);
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping),
          { 
            text: weatherMessage.trim(),
            isUser: false,
            weatherData: {
              ...weatherData,
              icon: weatherData.icon
            }
          }
        ]);
      } catch (error) {
        console.error('خطأ في جلب بيانات الطقس:', error);
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping),
          { 
            text: 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطقس. يرجى المحاولة مرة أخرى لاحقاً.',
            isUser: false,
            isError: true
          }
        ]);
      }
      setIsLoading(false);
      return;
    }
    
    // 5. أخيراً، التحقق من الأسئلة الإخبارية
    if (isNewsQuery(cleanInput)) {
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        { 
          text: '📰 يمكنك العثور على آخر الأخبار في صفحة الأخبار.\n\n' +
                '🔍 للمزيد من التفاصيل، يرجى زيارة صفحة الأخبار:\n' +
                '👉اضغط هنا ',
          isUser: false,
          isLink: true
        }
      ]);
      setIsLoading(false);
      return;
    }

    try {
      // تنظيف الإدخال وإزالة علامات الاستفهام والفواصل
      const cleanInput = input.trim().replace(/[؟?،,.]/g, '');
      
      // التحقق أولاً من أسئلة الطقس
      const { isWeatherQuery, city, isGeneralQuery } = isWeatherQuestion(cleanInput);
      if (isWeatherQuery) {
        try {
          // إذا كان السؤال عامًا عن الطقس ولم يتم ذكر مدينة
          if (isGeneralQuery) {
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping),
              { 
                text: '🔍 من فضلك حدد المدينة التي تريد معرفة حالة الطقس فيها.\nمثال: ما حالة الطقس في رام الله؟',
                isUser: false 
              }
            ]);
            setIsLoading(false);
            return;
          }
          
          // إذا تم ذكر مدينة
          const cityName = city || cleanInput;
          if (cityName) {
            const weatherData = await getWeatherForCity(cityName);
            const weatherMessage = formatWeatherMessage(weatherData);
            setMessages(prev => [
              ...prev.filter(msg => !msg.isTyping),
              { 
                text: weatherMessage.trim(),
                isUser: false,
                weatherData: {
                  ...weatherData,
                  icon: weatherData.icon
                }
              }
            ]);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الطقس:', error);
          let errorMessage = 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطقس.\n';
          
          if (error.message.includes('المدينة غير معروفة')) {
            errorMessage = 'عذراً، لم أتمكن من العثور على هذه المدينة.\n';
            errorMessage += 'المدن المتوفرة: ' + Object.keys(PALESTINIAN_CITIES).join('، ');
          } else {
            errorMessage += 'يرجى المحاولة مرة أخرى لاحقاً.';
          }
          
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping),
            { 
              text: errorMessage,
              isUser: false,
              isError: true
            }
          ]);
          setIsLoading(false);
          return;
        }
      }
      
      // التحقق من أسئلة العملات (فقط إذا لم يكن سؤال طقس)
      if (isCurrencyQuestion(cleanInput)) {
        // إنشاء دالة مساعدة لتعيين الرسائل
        const updateMessages = (newMessage) => {
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping && !msg.isCurrencyPrompt),
            newMessage
          ]);
        };

        // استدعاء الدالة مع المعلمات الصحيحة
        await handleCurrencyQuestion(
          cleanInput,
          updateMessages,
          (show) => setShowCurrencyPrompt(show),
          (currency) => setSelectedCurrency(currency)
        );
        
        setIsLoading(false);
        return;
      }
      
      // معالجة أسئلة الخدمات
      const serviceQuestions = [
        'شو بتقدر تقدملي',
        'شو بتقدر تعمل',
        'ماذا يمكنك ان تفعل',
        'ما فايدتك',
        'شو بساعدي',
        'شو فائدتك',
        'شو بتسوي',
        'شو بتقدم',
        'شو خدماتك',
        'شو بتساعدني',
        'شو في عندك',
        'شو في خدماتك',
        'شو في مساعدتك'
        
      ];

      const isServiceQuestion = serviceQuestions.some(q => cleanInput.includes(q));
      
      if (isServiceQuestion) {
        const capabilitiesMessage = `أنا هنا لمساعدتك في خدمات الموقع كاملة:

• الأخبار
• حالة الطرق والمرور
• أسعار العملات
• حالة الطقس (اكتب اسم المدينة)
• الخدمات
• وأي استفسارات أخرى

كيف يمكنني مساعدتك اليوم؟`;
        
        setMessages(prev => [
          ...prev.filter(msg => !msg.isTyping),
          { text: capabilitiesMessage, isUser: false }
        ]);
        return;
      }
      
      // التحقق مما إذا كان الإدخال هو اسم مدينة فقط
      const cityNames = Object.keys(PALESTINIAN_CITIES);
      const isCityOnly = cityNames.some(city => cleanInput === city);
      
      // إذا كان الإدخال اسم مدينة فقط، نعتبره طلباً للحصول على الطقس
      if (isCityOnly) {
        try {
          const weatherData = await getWeatherForCity(cleanInput);
          const weatherMessage = formatWeatherMessage(weatherData);
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping),
            { 
              text: weatherMessage.trim(),
              isUser: false,
              weatherData: {
                ...weatherData,
                icon: weatherData.icon
              }
            }
          ]);
        } catch (error) {
          console.error('خطأ في جلب بيانات الطقس:', error);
          setMessages(prev => [
            ...prev.filter(msg => !msg.isTyping),
            { 
              text: 'عذراً، حدث خطأ أثناء محاولة جلب بيانات الطقس. يرجى المحاولة مرة أخرى لاحقاً.',
              isUser: false,
              isError: true
            }
          ]);
        }
        setIsLoading(false);
        return;
      }
      
      console.log('جاري تهيئة عميل OpenAI...');
      
      // إذا لم يكن السؤال متعلقاً بالطقس، نرسله إلى نموذج الذكاء الاصطناعي
      if (!isWeatherQuery) {
        // التحقق من وجود رمز API
        if (!config.hfToken) {
          throw new Error('لم يتم تكوين مفتاح Hugging Face API');
        }

        // تهيئة عميل OpenAI
        const client = new OpenAI({
          baseURL: "https://router.huggingface.co/v1",
          apiKey: config.hfToken,
          dangerouslyAllowBrowser: true
        });

        console.log('جاري إرسال الطلب إلى النموذج...');
        
        // إرسال الطلب باستخدام واجهة chat completions
        const chatCompletion = await client.chat.completions.create({
          model: "openai/gpt-oss-120b:cerebras",
          messages: [
            {
              role: "system",
              content: "أنت مساعد ذكي يتحدث العربية. كن مفيداً وودوداً في إجاباتك."
            },
            {
              role: "user",
              content: input
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        console.log('تم استلام الرد:', chatCompletion);
        
        // إزالة رسالة التحميل
        setMessages(prev => prev.filter(msg => !msg.isTyping));
        
        // معالجة الرد
        if (chatCompletion?.choices?.[0]?.message?.content) {
          const aiMessage = chatCompletion.choices[0].message.content;
          setMessages(prev => [...prev, { text: aiMessage, isUser: false }]);
        } else {
          throw new Error('تنسيق الاستجابة غير متوقع');
        }
      }
      
    } catch (error) {
      console.error('تفاصيل الخطأ الكامل:', error);
      
      let errorMessage = 'حدث خطأ غير متوقع';
      
      // تحليل رسالة الخطأ
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
      } else if (error.message.includes('401')) {
        errorMessage = 'مفتاح API غير صالح أو منتهي الصلاحية';
      } else if (error.message.includes('429')) {
        errorMessage = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.';
      } else if (error.message.includes('503')) {
        errorMessage = 'النموذج قيد التحميل. يرجى الانتظار قليلاً ثم إعادة المحاولة.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('رسالة الخطأ:', errorMessage);
      
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        { 
          text: `خطأ: ${errorMessage}`,
          isUser: false,
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // تنسيق رسالة الطقس
  const formatWeatherMessage = (weatherData) => {
    return `
${weatherData.city}
🌡️ ${weatherData.temperature}°م (تشعر بها ${weatherData.feels_like}°م)
    `;
  };










  
  // جلب سعر صرف عملة محددة
  const fetchRate = async (currencyCode) => {
    try {
      // استخدام نقطة النهاية المباشرة للشيكل الإسرائيلي للحصول على أحدث الأسعار
      const response = await fetch('https://open.er-api.com/v6/latest/ILS');
      if (!response.ok) throw new Error('فشل في جلب بيانات العملات');
      
      const data = await response.json();
      if (data.result === 'success' && data.rates) {
        if (currencyCode === 'ILS') return 1; // سعر الشيكل مقابل نفسه هو 1
        
        // الحصول على سعر العملة المطلوبة مقابل الشيكل
        const ilsToCurrency = data.rates[currencyCode];
        
        if (ilsToCurrency) {
          // حساب سعر العملة بالشيكل (1 عملة = X شيكل)
          return 1 / ilsToCurrency;
        }
      }
      throw new Error('لم يتم العثور على سعر الصرف المطلوب');
    } catch (error) {
      console.error('Error fetching currency rate:', error);
      return null;
    }
  };

  // حالة لعرض رسالة تأكيد الحذف
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // حذف سجل المحادثة
  const clearChat = () => {
    // إظهار رسالة التأكيد فقط
    setShowClearConfirm(true);
    
    // إخفاء رسالة التأكيد بعد 5 ثواني إذا لم يتم النقر على أي زر
    setTimeout(() => {
      setShowClearConfirm(false);
    }, 5000);
  };
  
  // تأكيد حذف المحادثة
  const confirmClearChat = () => {
    setMessages([
      { text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', isUser: false }
    ]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
    setShowClearConfirm(false);
  };

  return (
    <ChatContainer>
      <Fade in={!isOpen}>
        <ChatButton 
          color="primary" 
          aria-label="chat" 
          onClick={() => setIsOpen(true)}
          className="chat-button"
        >
          <ChatBubbleOutlineIcon />
        </ChatButton>
      </Fade>

      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <ChatWindow elevation={3} className={isOpen ? 'open' : ''}>
          <ChatHeader>
            <Box display="flex" alignItems="center" gap={1}>
              <ChatBubbleOutlineIcon />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Salameh
              </Typography>
              <IconButton 
                onClick={clearChat} 
                size="small" 
                color="error" 
                title="حذف سجل المحادثة"
                sx={{ mr: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <IconButton 
              color="inherit" 
              onClick={() => setIsOpen(false)}
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </ChatHeader>
          
          <MessagesContainer>
            {messages.map((message, index) => {
              // إذا كانت الرسالة تحتوي على رابط لصفحة الأخبار
              if (message.isLink) {
                return (
                  <MessageBubble 
                    key={index} 
                    isUser={message.isUser}
                    isLink={message.isLink}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: message.isLink ? '#bbdefb' : undefined } }}
                    onClick={() => {
                      if (message.isLink) {
                        window.location.href = '/news';
                      }
                    }}
                  >
                    {message.text.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </MessageBubble>
                );
              }
              
              // عرض الرسالة العادية
              return (
                <MessageBubble key={index} isUser={message.isUser}>
                  {message.text}
                </MessageBubble>
              );
            })}
            {isLoading && (
              <MessageBubble isUser={false}>
                <Box display="flex" gap={1}>
                  <Box className="dot-flashing" />
                </Box>
              </MessageBubble>
            )}
            <div ref={messagesEndRef} />
            
            {showClearConfirm && (
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: '#fff8e1',
                  borderRadius: '12px',
                  m: 2,
                  border: '1px solid #ffe0b2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 1
                }}
              >
                <Typography sx={{ color: '#5d4037', textAlign: 'center' }}>
                  هل أنت متأكد من رغبتك في حذف سجل المحادثة؟
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="small"
                    onClick={confirmClearChat}
                  >
                    نعم، احذف
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    إلغاء
                  </Button>
                </Box>
              </Box>
            )}
          </MessagesContainer>
          
          {/* Currency Selection */}
          {showCurrencyPrompt && (
            <Box sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                اختر العملة المطلوبة:
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: 1,
                mt: 1
              }}>
                {/* إضافة الشيكل الإسرائيلي كخيار أول */}
                <Button
                  key="ILS-الشيكل"
                  variant={selectedCurrency === 'ILS' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={async () => {
                    setSelectedCurrency('ILS');
                    setShowCurrencyPrompt(false);
                    setMessages(prev => [
                      ...prev.filter(msg => !msg.isTyping && !msg.isCurrencyPrompt),
                      { 
                        text: '1 شيكل إسرائيلي = 1 شيكل إسرائيلي',
                        isUser: false 
                      }
                    ]);
                  }}
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    p: 1,
                    minWidth: 0,
                    '': {                    }
                  }}
                >
                  الشيكل الإسرائيلي
                </Button>
                
                {Object.entries(CURRENCIES).filter(([name, code], index, self) => 
                  // تصفية القيم المكررة باستخدام الاسم الكامل للعملة
                  index === self.findIndex(([n, c]) => c === code)
                ).map(([name, code]) => (
                  <Button
                    key={`${code}-${name}`}
                    variant={selectedCurrency === code ? 'contained' : 'outlined'}
                    size="small"
                    onClick={async () => {
                      setSelectedCurrency(code);
                      setShowCurrencyPrompt(false);
                      const rate = await fetchRate(code);
                      if (rate) {
                        const response = `1 ${CURRENCY_NAMES[code] || code} = ${rate.toFixed(4)} شيكل إسرائيلي`;
                        setMessages(prev => [
                          ...prev.filter(msg => !msg.isCurrencyPrompt),
                          { text: response, isUser: false }
                        ]);
                      }
                    }}
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      p: 1,
                      minWidth: 0
                    }}
                  >
                    {name}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
          
          <InputContainer>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="اكتب رسالتك هنا..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  backgroundColor: 'white',
                },
                '& .MuiOutlinedInput-input': {
                  padding: '10px 16px',
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    color="primary"
                    sx={{ marginLeft: '8px' }}
                  >
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </InputContainer>
        </ChatWindow>
      </Slide>

      <style jsx global>{`
        @keyframes dot-flashing {
          0% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-5px); }
          100% { opacity: 0.2; transform: translateY(0); }
        }
        .dot-flashing {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 5px;
          background-color: #1976d2;
          color: #1976d2;
          animation: dot-flashing 1s infinite linear;
          animation-delay: 0s;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
          width: 8px;
          height: 8px;
          border-radius: 5px;
          background-color: #1976d2;
          color: #1976d2;
        }
        .dot-flashing::before {
          left: -15px;
          animation: dot-flashing 1s infinite linear;
          animation-delay: 0.2s;
        }
        .dot-flashing::after {
          left: 15px;
          animation: dot-flashing 1s infinite linear;
          animation-delay: 0.4s;
        }
      `}</style>
    </ChatContainer>
  );
}