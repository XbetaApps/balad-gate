"use client";
import { useState, useEffect } from "react";
import { FaStar, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import "../profile-styles.css";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRemoveFavorite = async (postId) => {
    try {
      // Optimistically update the UI
      setFavorites(prevFavorites => prevFavorites.filter(item => item.itemId !== postId));
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const response = await fetch(`/api/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          item_id: postId, 
          item_type: 'ad' // Changed from 'post' to 'ad' to match backend expectations
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert the optimistic update if the request fails
        fetchFavorites();
        throw new Error(data.message || "فشل حذف المنشور من المفضلة");
      }

      toast.success("تمت إزالة المنشور من المفضلة بنجاح");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error(error.message || "حدث خطأ أثناء إزالة المنشور من المفضلة");
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("يجب تسجيل الدخول أولاً");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل تحميل المفضلة');
      }
      
      const data = await response.json();
      setFavorites(data.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحميل المفضلة');
    } finally {
      setLoading(false);
    }
  };

  // Load favorites on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          toast.error("يجب تسجيل الدخول أولاً");
          return;
        }

        const response = await fetch('/api/favorites', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('فشل تحميل المفضلة');
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setFavorites(Array.isArray(data.data) ? data.data : []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast.error(error.message || 'حدث خطأ أثناء تحميل المفضلة');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search input
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Filter favorites based on search query
  const filteredFavorites = searchQuery
    ? favorites.filter(
        (item) =>
          (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : favorites;

  // Format price with currency
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'غير محدد';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            المفضلة
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            إدارة المحتوى الذي حفظته في المفضلة
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="ابحث في المفضلة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-500"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {filteredFavorites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
          <AnimatePresence>
            {filteredFavorites.map((item) => (
              <motion.div
                key={item.itemId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {item.title || "عنوان غير معروف"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {item.description || "لا يوجد وصف"}
                      </p>
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.price !== null && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {formatPrice(item.price)}
                          </span>
                        )}
                        {item.governorate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {item.governorate}
                          </span>
                        )}
                        {item.categoryName && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {item.categoryName}
                          </span>
                        )}
                      </div>
                      
                      {item.authorName && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          الناشر: {item.authorName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.postCreatedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>

                    <button
                      onClick={() => handleRemoveFavorite(item.itemId)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      title="حذف من المفضلة"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <FaStar className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? "لا توجد نتائج" : "لا توجد عناصر في المفضلة"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "جرب كلمات بحث أخرى"
              : "اضغط على زر النجمة لحفظ العناصر في المفضلة"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
