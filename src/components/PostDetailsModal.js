import { useEffect } from 'react';
import { FaTimes, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaTag, FaInfoCircle } from 'react-icons/fa';

export default function PostDetailsModal({ isOpen, onClose, post }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  // تنسيق التاريخ والوقت
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* الخلفية المعتمة */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* المحتوى */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl text-right overflow-hidden shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* رأس النافذة */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل الإعلان</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* الصورة */}
              <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 h-64 md:h-80">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaInfoCircle className="text-5xl text-gray-400" />
                  </div>
                )}
              </div>

              {/* التفاصيل */}
              <div className="space-y-4">
                {/* العنوان */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h2>
                  <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                    <FaTag className="ml-1" />
                    <span>{post.category_name}</span>
                  </div>
                </div>

                {/* السعر */}
                {post.price && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-300">السعر</div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {parseFloat(post.price).toLocaleString('en-US')} <span className="text-base">₪</span>
                    </div>
                  </div>
                )}

                {/* الموقع */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <FaMapMarkerAlt className="ml-1 text-amber-500" />
                    <span className="font-medium">الموقع:</span>
                    <span className="mr-1">{post.governorate}</span>
                  </div>
                </div>

                {/* التاريخ والوقت */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <FaCalendarAlt className="ml-1" />
                  <span>نشر في: {formatDate(post.created_at)}</span>
                </div>

                {/* الوصف */}
                {post.description && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">تفاصيل الإعلان:</h4>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {post.description}
                    </p>
                  </div>
                )}

                {/* معلومات الاتصال */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">معلومات الاتصال:</h4>
                  <div className="space-y-2">
                    {post.phone && (
                      <a 
                        href={`tel:${post.phone}`}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <FaPhone className="ml-2" />
                        <span>اتصال: {post.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
