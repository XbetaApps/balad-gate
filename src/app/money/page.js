'use client';

import { useState, useEffect } from 'react';
import { 
  FaSyncAlt, 
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle
} from 'react-icons/fa';

// Default rates for initialization
const defaultRates = {
  USD: { value: 1, rateToUSD: 1, change: 0, name: 'الدولار الأمريكي', symbol: '$', flag: '🇺🇸' },
  EUR: { value: 0.92, rateToUSD: 1.09, change: 0.25, name: 'اليورو الأوروبي', symbol: '€', flag: '🇪🇺' },
  GBP: { value: 0.79, rateToUSD: 1.27, change: 0.12, name: 'الجنية الإسترليني', symbol: '£', flag: '🇬🇧' },
  JPY: { value: 151.5, rateToUSD: 0.0066, change: -0.3, name: 'الين الياباني', symbol: '¥', flag: '🇯🇵' },
  TRY: { value: 32.5, rateToUSD: 0.031, change: 1.2, name: 'الليرة التركية', symbol: '₺', flag: '🇹🇷' },
  SAR: { value: 3.75, rateToUSD: 0.27, change: 0, name: 'الريال السعودي', symbol: '﷼', flag: '🇸🇦' },
  AED: { value: 3.67, rateToUSD: 0.27, change: 0, name: 'الدرهم الإماراتي', symbol: 'د.إ', flag: '🇦🇪' },
  KWD: { value: 0.31, rateToUSD: 3.25, change: 0.05, name: 'الدينار الكويتي', symbol: 'د.ك', flag: '🇰🇼' },
  QAR: { value: 3.64, rateToUSD: 0.27, change: 0, name: 'الريال القطري', symbol: 'ر.ق', flag: '🇶🇦' },
  EGP: { value: 30.9, rateToUSD: 0.032, change: -0.5, name: 'الجنيه المصري', symbol: 'ج.م', flag: '🇪🇬' },
  ILS: { value: 3.65, rateToUSD: 0.27, change: 0.3, name: 'الشيكل الإسرائيلي', symbol: '₪', flag: '🇮🇱' },
  JOD: { value: 0.71, rateToUSD: 1.41, change: 0, name: 'الدينار الأردني', symbol: 'د.أ', flag: '🇯🇴' }
};

export default function CurrencyPage() {
  // State for dark mode - will be overridden by parent's dark mode
  const [darkMode, setDarkMode] = useState(false);
  
  // Listen for dark mode changes from parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // This will be overridden by parent's dark mode class
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
      
      // Optional: Watch for changes (if parent toggles dark mode)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isDarkNow = document.documentElement.classList.contains('dark');
            setDarkMode(isDarkNow);
          }
        });
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      return () => observer.disconnect();
    }
  }, []);
  
  // State for currency conversion
  const [baseAmount, setBaseAmount] = useState('1');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [convertedAmount, setConvertedAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceCurrency, setReferenceCurrency] = useState('USD'); // العملة المرجعية
  const [rates, setRates] = useState({...defaultRates});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Fetch currency rates function
  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.result === 'success') {
        const timestamp = new Date(data.time_last_update_unix * 1000);
        const formattedDate = timestamp.toLocaleString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        setRates(prevRates => {
          const newRates = { ...prevRates };
          
          // Update rates that we got from the API
          Object.entries(data.rates).forEach(([code, rate]) => {
            if (newRates[code]) {
              const prevRate = newRates[code].value;
              const change = prevRate ? ((rate - prevRate) / prevRate * 100).toFixed(2) : 0;
              
              newRates[code] = {
                ...newRates[code],
                value: rate,
                rateToUSD: code === 'USD' ? 1 : (1 / rate),
                change: parseFloat(change)
              };
            }
          });

          return newRates;
        });
        
        setLastUpdated(`تم التحديث في: ${formattedDate}`);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      setLastUpdated('تعذر تحديث الأسعار - جاري استخدام آخر البيانات المتوفرة');
      
      // Set some default rates if API fails
      setRates(prevRates => ({
        ...prevRates,
        USD: { ...prevRates.USD, value: 1, rateToUSD: 1, change: 0 },
        EUR: { ...prevRates.EUR, value: 0.92, rateToUSD: 1.09, change: 0.25 },
        GBP: { ...prevRates.GBP, value: 0.79, rateToUSD: 1.27, change: 0.12 },
        JPY: { ...prevRates.JPY, value: 151.5, rateToUSD: 0.0066, change: -0.3 },
        TRY: { ...prevRates.TRY, value: 32.5, rateToUSD: 0.031, change: 1.2 },
        SAR: { ...prevRates.SAR, value: 3.75, rateToUSD: 0.27, change: 0 },
        AED: { ...prevRates.AED, value: 3.67, rateToUSD: 0.27, change: 0 },
        KWD: { ...prevRates.KWD, value: 0.31, rateToUSD: 3.25, change: 0.05 },
        QAR: { ...prevRates.QAR, value: 3.64, rateToUSD: 0.27, change: 0 },
        EGP: { ...prevRates.EGP, value: 30.9, rateToUSD: 0.032, change: -0.5 },
        ILS: { ...prevRates.ILS, value: 3.65, rateToUSD: 0.27, change: 0.3 },
        JOD: { ...prevRates.JOD, value: 0.71, rateToUSD: 1.41, change: 0 }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchRates();
    
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBaseAmount(value);
    }
  };
  
  // Handle currency swap
  const handleSwap = () => {
    const temp = baseCurrency;
    setBaseCurrency(targetCurrency);
    setTargetCurrency(temp);
  };
  
  // Filter currencies based on search term
  const filteredCurrencies = Object.entries(rates).filter(([code, currency]) => {
    if (!currency) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      code.toLowerCase().includes(searchLower) ||
      (currency.name && currency.name.toLowerCase().includes(searchLower)) ||
      (currency.symbol && currency.symbol.toLowerCase().includes(searchLower))
    );
  });

  // Calculate converted amount
  useEffect(() => {
    if (baseAmount && !isNaN(baseAmount) && rates[baseCurrency] && rates[targetCurrency]) {
      const amount = parseFloat(baseAmount);
      const result = (amount * rates[targetCurrency].value / rates[baseCurrency].value).toFixed(6);
      setConvertedAmount(result);
    }
  }, [baseAmount, baseCurrency, targetCurrency, rates]);

  // Format number with proper decimal places
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-black' : 'bg-white'} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-black'}`}>
          أسعار صرف العملات
        </h1>
        
        {/* Currency Converter */}
        <div className={`${darkMode ? 'bg-black' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8 transition-all duration-300 ${
          darkMode ? 'border-2 border-gray-700' : 'border-2 border-amber-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-6 pb-2 border-b ${darkMode ? 'text-white border-gray-800' : 'text-black border-gray-200'}`}>
           محول العملات 
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>المبلغ</label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full p-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-900 text-white' 
                      : 'border-gray-300 bg-white text-black'
                  }`}
                  value={baseAmount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white">
                  {rates[baseCurrency]?.symbol}
                </span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>من</label>
              <div className="relative">
                <select
                  className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-900 text-white' 
                      : 'border-gray-300 bg-white text-black'
                  }`}
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                >
                  {Object.entries(rates).map(([code, currency]) => (
                    <option key={`from-${code}`} value={code}>
                      {code} - {currency.name}
                    </option>
                  ))}
                </select>
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  {rates[baseCurrency]?.flag}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <button
                onClick={handleSwap}
                className={`p-3 rounded-full transition-all duration-300 transform hover:rotate-180 ${
                  darkMode 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
                aria-label="تبديل العملات"
                title="تبديل العملات"
              >
                <FaSyncAlt />
              </button>
            </div>
            
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>إلى</label>
              <div className="relative">
                <select
                  className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-900 text-white' 
                      : 'border-gray-300 bg-white text-black'
                  }`}
                  value={targetCurrency}
                  onChange={(e) => setTargetCurrency(e.target.value)}
                >
                  {Object.entries(rates).map(([code, currency]) => (
                    <option key={`to-${code}`} value={code}>
                      {code} - {currency.name}
                    </option>
                  ))}
                </select>
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? 'text-white' : 'text-black'}`}>
                  {rates[targetCurrency]?.flag}
                </div>
              </div>
            </div>
          </div>
          
          <div className={`mt-6 p-5 rounded-lg border ${
            darkMode 
              ? 'bg-black border-gray-800 text-white' 
              : 'bg-white border-blue-200 text-black'
          }`}>
            <div className="text-center">
              <p className={`text-sm mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                {baseAmount || '0'} {baseCurrency} يساوي
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {convertedAmount ? formatNumber(convertedAmount) : '0.00'} {targetCurrency}
              </p>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>
                1 {baseCurrency} = {rates[baseCurrency] && rates[targetCurrency] ? 
                  (1 * rates[targetCurrency].value / rates[baseCurrency].value).toFixed(6) : '0.00'} {targetCurrency}
              </p>
              <p className="text-xs text-gray-800 dark:text-gray-400">
                1 {targetCurrency} = {rates[baseCurrency] && rates[targetCurrency] ? 
                  (1 * rates[baseCurrency].value / rates[targetCurrency].value).toFixed(6) : '0.00'} {baseCurrency}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-xs text-black dark:text-gray-400">
              <div className="flex items-center text-black dark:text-white">
                <FaInfoCircle className="ml-1" />
                <span>أسعار الصرف المحدثة: {lastUpdated || 'جاري التحميل...'}</span>
              </div>
            <button 
              onClick={fetchRates}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              disabled={loading}
            >
              <FaSyncAlt className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-black dark:text-white">تحديث</span>
            </button>
          </div>
        </div>
        
        {/* Currency List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold mb-6 pb-2 border-b ${darkMode ? 'text-white border-gray-800' : 'text-black border-gray-200'}`}>قائمة العملات</h2>
            <div className="flex gap-2 items-center">
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-700" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  placeholder="ابحث عن عملة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className={`p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${darkMode ? 'border-gray-600 bg-gray-900 text-white' : 'border-gray-300 bg-white text-black'}`}
                value={referenceCurrency}
                onChange={e => setReferenceCurrency(e.target.value)}
              >
                {Object.entries(rates).map(([code, currency]) => (
                  <option key={`ref-${code}`} value={code}>{code} - {currency.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCurrencies.map(([code, currency]) => (
              <div 
                key={code}
                className={`p-4 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gradient-to-br text-white' 
                    : 'bg-white hover:bg-gray-50 text-black'
                } border-2 ${
                  darkMode 
                    ? 'border-gray-700 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20' 
                    : 'border-amber-200 hover:border-amber-400'
                } relative overflow-hidden group transition-colors duration-300`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{currency.flag}</span>
                    <div>
                      <h3 className="font-semibold">
                        {code} - {currency.name}
                      </h3>
                      <p className="text-sm text-black dark:text-gray-400">
                        {currency.symbol} • {formatNumber(currency.value)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      currency.change > 0 ? 'text-green-500' : currency.change < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {currency.change > 0 ? (
                        <span className="flex items-center justify-end">
                          <FaArrowUp className="ml-1" />
                          {Math.abs(currency.change)}%
                        </span>
                      ) : currency.change < 0 ? (
                        <span className="flex items-center justify-end">
                          <FaArrowDown className="ml-1" />
                          {Math.abs(currency.change)}%
                        </span>
                      ) : (
                        <span>0.00%</span>
                      )}
                    </p>
                    {/* عرض السعر مقابل العملة المرجعية المختارة */}
                    <p className="text-xs text-black dark:text-gray-400">
                      {referenceCurrency === code ? '--' : `${formatNumber(rates[referenceCurrency] && rates[referenceCurrency].rateToUSD ? (currency.rateToUSD / rates[referenceCurrency].rateToUSD) : 0)} ${referenceCurrency}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="mt-1">  بوابة البلد  </p>
        </div>
      </div>
    </div>
  );
}
