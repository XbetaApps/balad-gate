"use client";
import { useState, useEffect } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaArchive,
  FaTrash,
  FaBellSlash,
  FaHistory,
  FaSearch,
  FaUndo,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../profile-styles.css";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [following, setFollowing] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("favorites");
  const [searchQuery, setSearchQuery] = useState("");

  const normalizeFollowing = (payload) => {
    const arr =
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload?.following) && payload.following) ||
      (Array.isArray(payload?.stores) && payload.stores) ||
      (Array.isArray(payload) && payload) ||
      [];

    return arr.map((f) => {
      const store = f.store ?? f;
      return {
        id: store.id ?? store.store_id ?? f.store_id ?? f.id,
        name: store.name ?? store.store_name ?? "",
        image: store.image ?? store.file_path ?? null,
        rating: store.rating ?? store.avg_rating ?? 0,
        reviews: store.reviews ?? store.reviews_count ?? 0,
        lastActivity:
          store.lastActivity ??
          f.lastActivity ??
          f.created_at ??
          store.created_at ??
          null,
        type: "store",
      };
    });
  };

  useEffect(() => {
    let isMounted = true;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds
    let retryCount = 0;
    let retryTimeout;

    // Custom fetch wrapper to prevent console errors
    const safeFetch = async (url, options = {}) => {
      try {
        const response = await fetch(url, options);
        // For 500 errors, return null to trigger the catch block
        if (response.status >= 500) return null;
        return response;
      } catch (error) {
        return null;
      }
    };

    const fetchWithRetry = async (url, options = {}, retries = 0) => {
      const response = await safeFetch(url, options);
      
      // If safeFetch returned null, it's either a 500 error or network error
      if (!response) {
        if (retries < MAX_RETRIES) {
          const delay = RETRY_DELAY * (retries + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries + 1);
        }
        return { data: [] }; // Return empty data after max retries
      }
      
      // Handle non-200 responses
      if (!response.ok) {
        return { data: [] };
      }
      
      try {
        return await response.json();
      } catch (error) {
        return { data: [] }; // Return empty data if JSON parsing fails
      }
    };

    const fetchData = async (attempt = 1) => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }

        const headers = { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };

        // Fetch data with individual error handling for each request
        const [favData, archivedData, followingData] = await Promise.all([
          fetchWithRetry("/api/favorites?type=all", { headers }).catch(error => {
            console.error("Error fetching favorites:", error);
            return { data: [] }; // Return empty array on error
          }),
          fetchWithRetry("/api/favorites?type=all&archived=true", { headers }).catch(error => {
            console.error("Error fetching archived items:", error);
            return { data: [] }; // Return empty array on error
          }),
          fetchWithRetry("/api/user/following", { headers }).catch(error => {
            console.error("Error fetching following list:", error);
            return { data: [] }; // Return empty array on error
          })
        ]);

        if (!isMounted) return;

        setFavorites(favData.data || []);
        setArchived(archivedData.data || []);
        setFollowing(normalizeFollowing(followingData));
        
      } catch (error) {
        console.error("Error in fetchData (attempt " + attempt + "):", error);
        
        if (attempt < MAX_RETRIES) {
          retryCount++;
          retryTimeout = setTimeout(() => fetchData(attempt + 1), RETRY_DELAY);
          return;
        }
        
        // If all retries failed, set empty states
        if (isMounted) {
          setFavorites([]);
          setArchived([]);
          setFollowing([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const makeApiRequest = async (url, options) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "An API error occurred");
    return data;
  };

  const archiveItem = async (item) => {
    try {
      await makeApiRequest(`/api/favorites/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
      });
      setFavorites((prev) => prev.filter((f) => f.id !== item.id));
      setArchived((prev) => [item, ...prev]);
    } catch (error) {
      console.error("Error archiving item:", error);
      alert(error.message);
    }
  };

  const restoreItem = async (item) => {
    try {
      await makeApiRequest(`/api/favorites/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: false }),
      });
      setArchived((prev) => prev.filter((a) => a.id !== item.id));
      setFavorites((prev) => [item, ...prev]);
    } catch (error) {
      console.error("Error restoring item:", error);
      alert(error.message);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العنصر نهائياً؟")) return;
    try {
      await makeApiRequest(`/api/favorites/${item.id}`, { method: 'DELETE' });
      setArchived((prev) => prev.filter((a) => a.id !== item.id));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(error.message);
    }
  };

  const unfollowStore = async (storeId) => {
    if (!window.confirm("هل أنت متأكد من إلغاء متابعة هذا المتجر؟")) return;
    try {
      await makeApiRequest(`/api/user/following/${storeId}`, { method: 'DELETE' });
      setFollowing((prev) => prev.filter((store) => store.id !== storeId));
    } catch (error) {
      console.error("Error unfollowing store:", error);
      alert(error.message);
    }
  };

  const items =
    activeTab === "favorites"
      ? favorites
      : activeTab === "following"
      ? following
      : archived;

  const filteredItems = (items || []).filter((item) => {
    const query = searchQuery.toLowerCase();
    const name = (item.name || item.title || "").toLowerCase();
    return name.includes(query);
  });

  const Stars = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => <FaStar key={i} />)}
        {halfStar && <FaStarHalfAlt />}
      </div>
    );
  };

  const Card = ({ item }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4 p-3 bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-sm"
    >
      <img
        src={item.image || "/placeholder.png"}
        alt={item.name || item.title}
        className="w-16 h-16 object-cover rounded-md"
      />
      <div className="flex-1">
        <h3 className="font-semibold text-[var(--text-primary)]">
          {item.name || item.title}
        </h3>
        {item.type === "store" && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Stars rating={item.rating} />
            <span>({item.reviews} مراجعات)</span>
          </div>
        )}
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {item.type === "store" ? "متجر" : "إعلان"} • آخر نشاط:{" "}
          {item.lastActivity
            ? new Date(item.lastActivity).toLocaleDateString("ar-EG")
            : "غير معروف"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {activeTab === "favorites" && (
          <button
            onClick={() => archiveItem(item)}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--primary)]"
            title="أرشفة"
          >
            <FaArchive />
          </button>
        )}
        {activeTab === "following" && (
          <button
            onClick={() => unfollowStore(item.id)}
            className="p-1 text-[var(--danger)] hover:text-[var(--danger)]/80"
            title="إلغاء المتابعة"
          >
            <FaBellSlash />
          </button>
        )}
        {activeTab === "archive" && (
          <>
            <button
              onClick={() => restoreItem(item)}
              className="p-1 text-[var(--success)] hover:text-[var(--success)]/80"
              title="استعادة"
            >
              <FaUndo />
            </button>
            <button
              onClick={() => deleteItem(item)}
              className="p-1 text-[var(--danger)] hover:text-[var(--danger)]/80"
              title="حذف نهائي"
            >
              <FaTrash />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          المفضلة
        </h2>
        <button
          onClick={() => setActiveTab("archive")}
          className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--primary)]"
        >
          <FaHistory className="text-xl" />
          {!!archived.length && (
            <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {archived.length}
            </span>
          )}
        </button>
      </div>

      <nav className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "favorites", label: "العناصر المفضلة" },
          { key: "following", label: "المتاجر المتابعة" },
          { key: "archive", label: `الأرشيف (${archived.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              activeTab === t.key
                ? "bg-[var(--primary)] text-black border-transparent"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--primary)]/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="relative mb-6">
        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث..."
          className="w-full pl-4 pr-10 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]"
        />
      </div>

      <div className="grid gap-4">
        <AnimatePresence initial={false}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-24 bg-gray-200/40 rounded-lg animate-pulse"
              />
            ))
          ) : filteredItems.length ? (
            filteredItems.map((item) => (
              <Card key={`${activeTab}-${item.id}`} item={item} />
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-[var(--card)] rounded-lg border border-[var(--border)]"
            >
              <FaSearch className="text-4xl text-[var(--text-secondary)] mx-auto mb-4" />
              <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">
                لا توجد نتائج
              </h3>
              <p className="text-[var(--text-secondary)]">
                جرّب كلمة بحث أخرى
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
