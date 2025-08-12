// Currency exchange rates component
import { useState, useEffect } from 'react';

// أسماء العملات بالعربية والإنجليزية
const CURRENCIES = {
  'دولار أمريكي': 'USD',
  'دولار': 'USD',
  'يورو': 'EUR',
  'جنيه إسترليني': 'GBP',
  'جنيه': 'GBP',
  'دينار أردني': 'JOD',
  'دينار': 'JOD',
  'ريال سعودي': 'SAR',
  'ريال': 'SAR',
  'جنيه مصري': 'EGP',
  'شيكل': 'ILS',
  'ين ياباني': 'JPY',
  'ين': 'JPY',
  'دولار أسترالي': 'AUD',
  'دولار كندي': 'CAD',
  'فرنك سويسري': 'CHF',
  'يوان صيني': 'CNY',
  'درهم إماراتي': 'AED',
  'درهم': 'AED',
  'دينار كويتي': 'KWD',
  'ريال قطري': 'QAR',
  'ليرة تركية': 'TRY',
  'روبل روسي': 'RUB',
};

// أسماء العملات بالعربية
const CURRENCY_NAMES = {
  'USD': 'الدولار الأمريكي',
  'EUR': 'اليورو',
  'GBP': 'الجنيه الإسترليني',
  'JOD': 'الدينار الأردني',
  'SAR': 'الريال السعودي',
  'EGP': 'الجنيه المصري',
  'JPY': 'الين الياباني',
  'AUD': 'الدولار الأسترالي',
  'CAD': 'الدولار الكندي',
  'CHF': 'الفرنك السويسري',
  'CNY': 'اليوان الصيني',
  'AED': 'الدرهم الإماراتي',
  'KWD': 'الدينار الكويتي',
  'QAR': 'الريال القطري',
  'TRY': 'الليرة التركية',
  'RUB': 'الروبل الروسي',
};

export const useCurrencyRates = () => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      
      if (!response.ok) {
        throw new Error('Failed to fetch currency rates');
      }
      
      const data = await response.json();
      if (data.result === 'success') {
        setRates(data.rates);
      } else {
        throw new Error('Failed to load currency data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching currency rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!rates || !rates[fromCurrency] || !rates[toCurrency]) return null;
    
    // Convert to USD first, then to target currency
    const amountInUsd = amount / rates[fromCurrency];
    return amountInUsd * rates[toCurrency];
  };

  // الحصول على سعر عملة معينة
  const getCurrencyRate = (currency) => {
    if (!rates) return null;
    const currencyCode = CURRENCIES[currency] || currency;
    return rates[currencyCode] || null;
  };

  return {
    rates,
    loading,
    error,
    convertCurrency,
    refreshRates: fetchRates,
    getCurrencyRate,
    currencyNames: CURRENCY_NAMES,
    currencyCodes: CURRENCIES
  };
};

// التحقق مما إذا كان السؤال يتعلق بالعملات
const isCurrencyQuestion = (message) => {
  const currencyKeywords = [
    'سعر', 'عملة', 'عملات', 'دولار', 'يورو', 'جنيه', 'دينار', 'ريال',
    'شيكل', 'ين', 'فرنك', 'يوان', 'درهم', 'ليرة', 'روبل', 'تحويل'
  ];
  
  const messageLower = message.toLowerCase();
  return currencyKeywords.some(keyword => 
    messageLower.includes(keyword)
  );
};

// معالجة سؤال العملات
const handleCurrencyQuestion = async (message, updateMessage, setShowCurrencyPrompt, setSelectedCurrency) => {
  // البحث عن نمط تحويل مباشر (مثال: 100 دولار كم شيكل)
  const directConversionMatch = message.match(/(\d+(?:\.\d+)?)\s*([^\d\s]+)\s*(?:كم|بكم|يساوي|=\s*)([^\d\s]+)/i);
  
  if (directConversionMatch) {
    const [_, amountStr, fromCurrencyText, toCurrencyText] = directConversionMatch;
    const amount = parseFloat(amountStr);
    
    if (!isNaN(amount)) {
      // البحث عن العملة المصدر
      const matchedFromCurrency = Object.keys(CURRENCIES).find(currency => 
        fromCurrencyText.includes(currency) || currency.includes(fromCurrencyText)
      );
      
      // البحث عن العملة الهدف
      const matchedToCurrency = Object.keys(CURRENCIES).find(currency => 
        toCurrencyText.includes(currency) || currency.includes(toCurrencyText)
      );
      
      if (matchedFromCurrency && matchedToCurrency) {
        const fromCode = CURRENCIES[matchedFromCurrency];
        const toCode = CURRENCIES[matchedToCurrency];
        
        try {
          // الحصول على سعر صرف العملة المصدر إلى الدولار
          const fromRate = await fetchRate(fromCode);
          // الحصول على سعر صرف العملة الهدف إلى الدولار
          const toRate = await fetchRate(toCode);
          
          if (fromRate && toRate) {
            // التحويل من العملة المصدر إلى الدولار ثم إلى العملة الهدف
            const amountInUsd = amount / fromRate;
            const convertedAmount = (amountInUsd * toRate).toFixed(4);
            
            const response = `💱 ${amount} ${CURRENCY_NAMES[fromCode] || fromCode} = ${convertedAmount} ${CURRENCY_NAMES[toCode] || toCode}`;
            updateMessage({ text: response, isUser: false });
            return;
          }
        } catch (error) {
          console.error('Error in currency conversion:', error);
        }
      }
    }
  }
  
  // البحث عن أرقام فقط (مثال: 100) لعرض أسعار العملات الرئيسية
  const numberOnlyMatch = message.match(/^(\d+(?:\.\d+)?)(?:\s+كم\s+ب(\S+))?(?:\s+و(.*))?$/);
  
  if (numberOnlyMatch) {
    const [_, amountStr, toCurrencyText, additionalCurrencies] = numberOnlyMatch;
    const amount = parseFloat(amountStr);
    
    if (!isNaN(amount)) {
      // إذا كان هناك عملة محددة بعد "كم"
      if (toCurrencyText) {
        const matchedToCurrency = Object.keys(CURRENCIES).find(currency => 
          toCurrencyText.includes(currency) || currency.includes(toCurrencyText)
        );
        
        if (matchedToCurrency) {
          const toCode = CURRENCIES[matchedToCurrency];
          const rate = await fetchRate(toCode);
          
          if (rate) {
            const convertedAmount = (amount / rate).toFixed(4);
            const response = `💱 ${amount} = ${convertedAmount} ${CURRENCY_NAMES[toCode] || toCode}`;
            updateMessage({ text: response, isUser: false });
            return;
          }
        }
      }
      
      // إذا كان هناك عملات إضافية بعد "و"
      if (additionalCurrencies) {
        const requestedCurrencies = [];
        const currencyNames = additionalCurrencies.split(/\s+و\s+|\s*,\s*|\s+/).filter(Boolean);
        
        for (const name of currencyNames) {
          const matchedCurrency = Object.keys(CURRENCIES).find(currency => 
            name.includes(currency) || currency.includes(name)
          );
          if (matchedCurrency) {
            requestedCurrencies.push({
              code: CURRENCIES[matchedCurrency],
              name: CURRENCY_NAMES[CURRENCIES[matchedCurrency]] || matchedCurrency
            });
          }
        }
        
        if (requestedCurrencies.length > 0) {
          // جلب أسعار العملات المطلوبة
          const rates = await Promise.all(
            requestedCurrencies.map(async ({ code }) => ({
              code,
              rate: await fetchRate(code)
            }))
          );
          
          let response = `💰 ${amount} تساوي:\n\n`;
          
          for (let i = 0; i < requestedCurrencies.length; i++) {
            const { code, name } = requestedCurrencies[i];
            const rate = rates.find(r => r.code === code)?.rate;
            
            if (rate) {
              const convertedAmount = (amount / rate).toFixed(2);
              response += `• ${convertedAmount} ${name} (${code})\n`;
            }
          }
          
          updateMessage({ text: response, isUser: false });
          return;
        }
      }
      
      // إذا لم يتم تحديد عملات، نعرض العملات الرئيسية الافتراضية
      const mainCurrencies = [
        { code: 'JOD', name: 'دينار أردني' },
        { code: 'ILS', name: 'شيكل إسرائيلي' },
        { code: 'USD', name: 'دولار أمريكي' },
        { code: 'EUR', name: 'يورو' }
      ];
      
      // جلب أسعار الصرف
      const rates = await Promise.all(
        mainCurrencies.map(async ({ code }) => ({
          code,
          rate: await fetchRate(code)
        }))
      );
      
      // حساب القيم المحولة
      let response = `💰 ${amount} تساوي:\n\n`;      
      for (let i = 0; i < mainCurrencies.length; i++) {
        const { code, name } = mainCurrencies[i];
        const rate = rates.find(r => r.code === code)?.rate;
        
        if (rate) {
          const convertedAmount = (amount / rate).toFixed(2);
          response += `• ${convertedAmount} ${name} (${code})\n`;
        }
      }
      
      response += '\n\nℹ️ للمزيد من المعلومات عن أسعار العملات، يرجى زيارة صفحة العملات.';
      updateMessage({ text: response, isUser: false });
      return;
    }
  }
  
  // البحث عن مبالغ مع عملة (مثال: 100 دينار أردني)
  const amountMatch = message.match(/(\d+(?:\.\d+)?)\s+([^\d\s]+)(?:\s+كم\s+ب(\S+))?/);
  
  if (amountMatch) {
    const [_, amountStr, fromCurrencyText, toCurrencyText] = amountMatch;
    const amount = parseFloat(amountStr);
    
    // البحث عن العملة المصدر
    const matchedFromCurrency = Object.keys(CURRENCIES).find(currency => 
      fromCurrencyText.includes(currency)
    );
    
    // البحث عن العملة الهدف إذا وجدت
    let matchedToCurrency = null;
    if (toCurrencyText) {
      matchedToCurrency = Object.keys(CURRENCIES).find(currency => 
        toCurrencyText.includes(currency)
      );
    }
    
    if (matchedFromCurrency && !isNaN(amount)) {
      const fromCode = CURRENCIES[matchedFromCurrency];
      
      // إذا لم يتم تحديد عملة هدف، نستخدم الشيكل الإسرائيلي كافتراضي
      const toCode = matchedToCurrency ? CURRENCIES[matchedToCurrency] : 'ILS';
      
      // جلب سعري الصرف
      const fromRate = await fetchRate(fromCode);
      const toRate = await fetchRate(toCode);
      
      if (fromRate && toRate) {
        // حساب سعر التحويل
        const rate = fromRate / toRate;
        const convertedAmount = (amount * rate).toFixed(2);
        
        // تنسيق الرسالة
        let response;
        if (toCode === 'ILS') {
          response = `💰 ${amount} ${CURRENCY_NAMES[fromCode] || fromCode} = ${convertedAmount} شيكل إسرائيلي`;
        } else {
          response = `💱 ${amount} ${CURRENCY_NAMES[fromCode] || fromCode} = ${convertedAmount} ${CURRENCY_NAMES[toCode] || toCode}`;
        }
        
        updateMessage({ text: response, isUser: false });
        return;
      }
    }
  }
  
  // البحث عن أزواج العملات (مثل "الدينار مقابل الشيكل")
  const match = message.match(/([^\s]+)\s+مقابل\s+([^\s]+)/);
  
  if (match) {
    // إذا كان الطلب بصيغة "عملة مقابل عملة"
    const [_, fromCurrencyText, toCurrencyText] = match;
    const fromCurrency = Object.keys(CURRENCIES).find(currency => fromCurrencyText.includes(currency));
    const toCurrency = Object.keys(CURRENCIES).find(currency => toCurrencyText.includes(currency));
    
    if (fromCurrency && toCurrency) {
      const fromCode = CURRENCIES[fromCurrency];
      const toCode = CURRENCIES[toCurrency];
      
      // جلب سعري الصرف
      const fromRate = await fetchRate(fromCode);
      const toRate = await fetchRate(toCode);
      
      if (fromRate && toRate) {
        const rate = fromRate / toRate;
        const response = `سعر صرف 1 ${CURRENCY_NAMES[fromCode] || fromCode} = ${rate.toFixed(4)} ${CURRENCY_NAMES[toCode] || toCode}`;
        updateMessage({ text: response, isUser: false });
        return;
      }
    }
  }
  
  // البحث عن اسم العملة في الرسالة
  const matchedCurrency = Object.keys(CURRENCIES).find(currency => 
    message.includes(currency)
  );

  if (matchedCurrency) {
    // إذا تم العثور على عملة محددة في الرسالة
    const currencyCode = CURRENCIES[matchedCurrency];
    const rate = await fetchRate(currencyCode);
    
    if (rate) {
      const response = `سعر صرف 1 ${CURRENCY_NAMES[currencyCode] || currencyCode} = ${rate.toFixed(4)} شيكل إسرائيلي`;
      updateMessage({ text: response, isUser: false });
    } else {
      updateMessage({ 
        text: `عذراً، لم أتمكن من العثور على سعر صرف ${matchedCurrency}. هل يمكنك التأكد من اسم العملة؟`,
        isUser: false 
      });
    }
  } else {
    // إذا لم يتم تحديد عملة، نطلب من المستخدم تحديدها
    setShowCurrencyPrompt(true);
    updateMessage({ 
      text: 'من فضلك اختر العملة التي تريد معرفة سعرها:',
      isUser: false,
      isCurrencyPrompt: true
    });
  }
};

// جلب سعر صرف عملة محددة مقابل الشيكل
const fetchRate = async (currencyCode) => {
  try {
    // جلب جميع أسعار العملات
    const response = await fetch('https://open.er-api.com/v6/latest/ILS');
    if (!response.ok) throw new Error('فشل في جلب بيانات العملات');
    
    const data = await response.json();
    if (data.result === 'success') {
      if (currencyCode === 'ILS') return 1; // إذا كانت العملة هي الشيكل نفسها
      // حساب سعر الصرف مقابل الشيكل
      return 1 / data.rates[currencyCode];
    }
    return null;
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    return null;
  }
};

const CurrencyRates = () => {
  const { rates, loading, error } = useCurrencyRates();
  
  // Common currencies to display
  const commonCurrencies = ['USD', 'EUR', 'GBP', 'JOD', 'SAR', 'EGP'];

  if (loading) return <div>جاري تحميل أسعار العملات...</div>;
  if (error) return <div>خطأ في تحميل أسعار العملات: {error}</div>;
  if (!rates) return <div>لا تتوفر بيانات العملات</div>;

  return (
    <div className="currency-rates p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-right">أسعار العملات مقابل الدولار الأمريكي</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commonCurrencies.map((currency) => (
          <div key={currency} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{currency}</span>
              <span className="text-green-600">{rates[currency]?.toFixed(4)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export all at once to avoid duplicates
export { 
  CurrencyRates as default,
  isCurrencyQuestion,
  handleCurrencyQuestion,
  CURRENCIES,
  CURRENCY_NAMES
};