'use client';

import { useEffect, useState } from 'react';
import { FaRoad, FaSync, FaInfoCircle, FaFilter, FaClock } from 'react-icons/fa';
import { useTheme } from '@mui/material/styles';
import RoadStatus from './components/RoadStatus';
import { fetchRoadData } from './utils/fetchRoadData';

export default function RoadConditions() {
  const [roadData, setRoadData] = useState([]);
  const [filteredRoads, setFilteredRoads] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [lastUpdate, setLastUpdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching road data...');
      const data = await fetchRoadData(selectedCity === 'الكل' ? null : selectedCity);
      console.log('Road data received:', data);
      
      if (!data || !Array.isArray(data.roads)) {
        throw new Error('بيانات غير صالحة من الخادم');
      }
      
      setRoadData(data.roads);
      setFilteredRoads(data.roads);
      
      // تحميل المدن المتاحة
      const loadCities = async () => {
        try {
          const response = await fetch('/api/roads');
          const data = await response.json();
          
          // قائمة المدن مع القرى والمناطق التابعة لها
          const allCities = [
            'الكل',
            'نابلس',
            'جنين',
            'طولكرم',
            'قلقيلية',
            'القدس',
            'رام الله',
            'الخليل',
            'بيت لحم',
            'أريحا',
            'طوباس',
            'سلفيت'
          ];
          
          setCities(allCities);
        } catch (error) {
          console.error('Error loading cities:', error);
          setCities(['الكل', 'نابلس', 'جنين', 'طولكرم', 'قلقيلية', 'القدس', 'رام الله', 'الخليل']);
        }
      };
      loadCities();
      
      setLastUpdate(data.lastUpdate || new Date().toLocaleTimeString('ar-PS'));
      
    } catch (err) {
      console.error('Error loading road data:', err);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الطرق. يرجى المحاولة مرة أخرى لاحقًا.');
      
      // Set default data in case of error
      const defaultData = [{
        name: 'معبر بيت حانون',
        status: 'غير معروف',
        details: 'لا يمكن جلب البيانات حالياً. يرجى المحاولة لاحقاً.',
        city: 'غزة'
      }];
      
      setRoadData(defaultData);
      setFilteredRoads(defaultData);
      setLastUpdate(new Date().toLocaleTimeString('ar-PS'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedCity]);

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    
    if (city === 'الكل') {
      setFilteredRoads(roadData);
    } else {
      setFilteredRoads(roadData.filter(road => road.city === city));
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="text-center md:text-right">
            <h1 className="text-2xl md:text-3xl font-bold ">
              <FaRoad className="inline ml-2 text-blue-600 dark:text-blue-400" />
          حالة الطرق
            </h1>

          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={selectedCity}
                onChange={handleCityChange}
                className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 appearance-none transition-colors"
                disabled={loading}
              >
                {cities.map((city, index) => (
                  <option key={`${city}-${index}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={loadData}
              disabled={loading}
              className={`px-4 py-2.5 rounded-lg flex items-center justify-center ${
                loading
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-start">
              <FaInfoCircle className="ml-1 mt-0.5 flex-shrink-0" />
              <span className="mr-2">{error}</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {loading && filteredRoads.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل بيانات الطرق...</p>
              </div>
            ) : filteredRoads.length > 0 ? (
              filteredRoads.map((road, index) => (
                <RoadStatus key={`${road.id || index}-${road.name}`} road={road} />
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <FaInfoCircle className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">لا توجد معابر متاحة</h3>
                <p className="text-gray-600 dark:text-gray-400">لا توجد معابر مسجلة في المدينة المحددة</p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm ">
            <p>بوابة البلد © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}