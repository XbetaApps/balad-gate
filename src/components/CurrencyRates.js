'use client';

import { useState, useEffect } from 'react';
import { FaDollarSign, FaChartLine, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../app/nav/theme/ThemeProvider';
import Link from 'next/link';

const CurrencyRates = () => {
  const { darkMode } = useTheme();
  const [rates, setRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();

        if (!data || !data.rates || !data.time_last_update_utc) {
          throw new Error('Invalid data');
        }

        const usdToIls = data.rates.ILS;
        const eurToIls = data.rates.ILS / data.rates.EUR;
        const jodToIls = data.rates.ILS / data.rates.JOD;
        

        setRates({
          USD: {
            current: parseFloat(usdToIls.toFixed(4)),
            name: 'الدولار الأمريكي',
            icon: '💵'
          },
          EUR: {
            current: parseFloat(eurToIls.toFixed(4)),
            name: 'اليورو الأوروبي',
            icon: '💶'
          },
          JOD: {
            current: parseFloat(jodToIls.toFixed(4)),
            name: 'الدينار الأردني',
            icon: 'د.أ'
          }
        });

        setLastUpdated(new Date(data.time_last_update_utc).toLocaleString('ar-EG'));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching currency rates:', error);
        setLoading(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!rates) {
    return (
      <div className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow text-black'}`}>
        <p>فشل تحميل أسعار العملات.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold flex items-center gap-2 ">
          <FaDollarSign className="text-indigo-600 dark:text-indigo-400" />
          <span>أسعار العملات</span>
        </h2>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex flex-nowrap gap-4 pb-2">
          {Object.entries(rates).map(([key, currency]) => (
            <div key={key} className={`min-w-[250px] p-4 rounded-lg transition-all hover:shadow-md border flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl ml-2">{currency.icon}</span>
                  <span className="font-medium text-gray-800 dark:text-black">{currency.name}</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-black">
                  {currency.current.toLocaleString('ar-EG')} شيكل
                </div>
              </div>
              <div className="mt-3 text-right">
                <Link 
                  href="/money"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-end gap-1"
                >
                  للمزيد من التفاصيل
                  <FaArrowLeft className="text-xs mt-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencyRates;
