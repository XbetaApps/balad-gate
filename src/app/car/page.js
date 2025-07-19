'use client';

import { useState, useEffect, useContext } from 'react';
import { Clock, MapPin, XCircle, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { useTheme } from '../nav/theme/ThemeProvider';

export default function RoadStatusPage() {
  const { darkMode } = useTheme();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('all');
  const [cities, setCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (checkpoints.length > 0) {
      const uniqueCities = [...new Set(checkpoints.map(cp => cp.city))];
      setCities(['all', ...uniqueCities]);
    }
  }, [checkpoints]);

  const fetchData = async (isManualRefresh = false) => {
    isManualRefresh ? setIsRefreshing(true) : setLoading(true);
    try {
      const response = await fetch('/api/roads', {
        cache: 'no-store',
        next: { revalidate: 0 },
      });
      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (!response.ok || !result.success) throw new Error(result.error || 'خطأ في تحميل البيانات');

      const data = Array.isArray(result.data) ? result.data : [];
      setCheckpoints(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCheckpoints = checkpoints.filter(cp => {
    const matchSearch =
      searchQuery === '' ||
      cp.checkpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cp.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCity = selectedCity === 'all' || cp.city === selectedCity;
    const matchStatus =
      activeTab === 'all' ||
      (cp.entering_status === activeTab && cp.leaving_status === activeTab);
    return matchSearch && matchCity && matchStatus;
  });

  const getStatusColor = status => {
    switch (status) {
      case 'سالك': return 'bg-green-300 text-black hover:bg-green-500';
      case 'أزمة': return 'bg-yellow-300 text-black hover:bg-yellow-500';
      case 'مغلق': return 'bg-red-300 text-black hover:bg-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={` transition-colors duration-300 ${darkMode ? 'dark ' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg shadow p-6 mb-6">
        {/* الفلاتر */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          {/* اختيار المدينة */}
          <div className="w-full md:w-1/4">
            <div className="relative">
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className={`w-full border-2 border-yellow-500 focus:ring-yellow-400 focus:border-yellow-400 rounded-md py-2 px-3 transition duration-300 shadow-sm ${
                  darkMode ? 'bg-gray-900 text-white' : 'bg-white'
                }`}
              >
                {cities.map(city => (
                  <option key={city} value={city}>
                    {city === 'all' ? ' اختر المدينة  ' : city}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-yellow-500" />
            </div>
          </div>

          {/* شريط البحث */}
          <div className="w-full md:w-2/3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن حاجز..."
                className={`w-full border-2 border-yellow-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 rounded-full shadow-md pl-4 pr-10 py-2 transition-all duration-300 ${
                  darkMode ? 'bg-gray-900 text-white placeholder-gray-400' : 'bg-white'
                }`}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-yellow-500" />
            </div>
          </div>

          {/* الفلاتر حسب الحالة */}
          <div className="w-full md:w-auto flex justify-center md:justify-end gap-2">
            {['سالك', 'أزمة', 'مغلق'].map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(activeTab === status ? 'all' : status)}
                className={`px-3 py-1 rounded-full text-sm font-medium border border-yellow-500 transition-all duration-200 ${
                  activeTab === status
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-gray-900 dark:text-yellow-300 dark:border-yellow-500'
                    : `hover:bg-yellow-50 hover:border-yellow-400 ${darkMode ? 'bg-gray-900 text-gray-200 hover:bg-yellow-500' : ''}`
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* وقت التحديث وزر التحديث */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 ml-1" />
            آخر تحديث: {lastUpdated.toLocaleTimeString('ar-PS')}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 ml-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        {/* عرض النتائج أو الخطأ */}
        {loading && !isRefreshing ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحديث البيانات...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCheckpoints.length > 0 ? (
              filteredCheckpoints.map(cp => (
                <div
                  key={cp.id}
                  className={`transition-all duration-300 p-4 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-500 hover:border-yellow-500 hover:shadow-[0_0_15px_2px_rgba(100,100,100,0.3)]' 
                      : 'bg-white border-yellow-500 hover:border-yellow-600 hover:shadow-[0_0_15px_2px_rgba(234,179,8,0.3)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cp.checkpoint}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border-2 ${getStatusColor(cp.entering_status)}`}>
                        دخول: {cp.entering_status || 'غير معروف'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border-2 ${getStatusColor(cp.leaving_status)}`}>
                        خروج: {cp.leaving_status || 'غير معروف'}
                      </span>
                    </div>
                  </div>
                  <div className={`mt-3 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <MapPin className={`w-4 h-4 ml-1 ${darkMode ? 'text-blue-300' : 'text-gray-500'}`} />
                      <span>{cp.city}</span>
                    </div>
                    {cp.alert_text && (
                      <div className={`mt-2 p-2 text-xs rounded border-r-2 ${
                        darkMode 
                          ? 'bg-yellow-500 text-white border-amber-500' 
                          : 'bg-amber-50 text-amber-900 border-amber-400'
                      }`}>
                        {cp.alert_text}
                      </div>
                    )}
                    <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      آخر تحديث: {new Date(cp.entering_status_last_updated).toLocaleString('ar-PS', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                لا توجد بيانات متاحة حالياً
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
