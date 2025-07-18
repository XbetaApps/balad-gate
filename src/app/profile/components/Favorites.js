"use client";
import { useState, useEffect } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaArchive,
  FaTrash,
  FaBellSlash,
  FaBars,
  FaHistory,
  FaSearch,
  FaUndo,
  FaStore,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../profile-styles.css";

/**
 * FavoritesPage – أقسام المفضلة والمتابعة والأرشيف مع أزرار مباشرة على البطاقة.
 */

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [following, setFollowing] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("favorites");
  const [searchQuery, setSearchQuery] = useState("");

  /* بيانات وهمية */
  useEffect(() => {
    const t = setTimeout(() => {
      setFavorites([
        {
          id: 1,
          type: "product",
          name: "دواء مسكن للألم",
          image: "/product1.jpg",
          price: "150 ج.م",
          rating: 4.5,
          reviews: 25,
          url: "/products/1",
        },
        {
          id: 2,
          type: "product",
          name: "فيتامين سي 1000 مجم",
          image: "/product2.jpg",
          price: "200 ج.م",
          rating: 4.2,
          reviews: 18,
          url: "/products/2",
        },
      ]);
      setFollowing([
        {
          id: 10,
          type: "store",
          name: "صيدلية النيل",
          image: "/store1.jpg",
          rating: 4.8,
          reviews: 120,
          url: "/stores/10",
          lastActivity: "نشر منتج جديد منذ يومين",
        },
      ]);
      setArchived([
        {
          id: 3,
          type: "product",
          name: "كريم ترطيب البشرة",
          image: "/product3.jpg",
          price: "180 ج.م",
          rating: 4.0,
          reviews: 30,
          url: "/products/3",
          archivedDate: "2023-07-01",
        },
      ]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  /* الإجراءات */
  const archiveItem = (item) => {
    const withDate = { ...item, archivedDate: new Date().toISOString() };
    setArchived((prev) => [...prev, withDate]);
    if (item.type === "product") setFavorites((p) => p.filter((i) => i.id !== item.id));
    else setFollowing((p) => p.filter((i) => i.id !== item.id));
  };
  const restoreItem = (item) => {
    if (item.type === "product") setFavorites((p) => [...p, item]);
    else setFollowing((p) => [...p, item]);
    setArchived((p) => p.filter((i) => i.id !== item.id));
  };
  const deleteItem = (item) => {
    setFavorites((p) => p.filter((i) => i.id !== item.id));
    setFollowing((p) => p.filter((i) => i.id !== item.id));
    setArchived((p) => p.filter((i) => i.id !== item.id));
  };
  const unfollowStore = (id) => setFollowing((p) => p.filter((i) => i.id !== id));

  /* فلاتر */
  const list = activeTab === "favorites" ? favorites : activeTab === "following" ? following : archived;
  const items = list.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  /* مكوّن النجوم */
  const Stars = ({ rating }) => (
    <>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-[var(--text-yellow)]">
          {s <= Math.floor(rating) ? <FaStar /> : s === Math.ceil(rating) && rating % 1 !== 0 ? <FaStarHalfAlt /> : <FaStar className="text-[var(--text-secondary)]" />}
        </span>
      ))}
    </>
  );

  /* بطاقة عنصر مع أزرار مباشرة */
  const Card = ({ item }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-4 p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:shadow"
    >
      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--text-primary)] truncate">
          {item.name}
        </h3>
        {item.type === "store" && activeTab === "following" && (
          <p className="text-sm text-[var(--text-secondary)]">{item.lastActivity}</p>
        )}
        {item.archivedDate && activeTab === "archive" && (
          <p className="text-xs text-[var(--text-secondary)]">مؤرشف في: {new Date(item.archivedDate).toLocaleDateString("ar-EG")}</p>
        )}
        <div className="flex items-center mt-1">
          <Stars rating={item.rating} />
          <span className="mr-2 text-xs text-[var(--text-secondary)]">({item.reviews})</span>
        </div>
      </div>
      {/* أزرار العمليات المباشرة */}
      <div className="flex gap-2">
        {activeTab === "favorites" && item.type === "product" && (
          <>
            <button onClick={() => archiveItem(item)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--primary)]" title="أرشفة">
              <FaArchive />
            </button>
            <button onClick={() => deleteItem(item)} className="p-1 text-[var(--danger)] hover:text-[var(--danger)]/80" title="حذف">
              <FaTrash />
            </button>
          </>
        )}
        {activeTab === "following" && (
          <button onClick={() => unfollowStore(item.id)} className="p-1 text-[var(--danger)] hover:text-[var(--danger)]/80" title="إلغاء المتابعة">
            <FaBellSlash />
          </button>
        )}
        {activeTab === "archive" && (
          <>
            <button onClick={() => restoreItem(item)} className="p-1 text-[var(--success)] hover:text-[var(--success)]/80" title="استعادة">
              <FaUndo />
            </button>
            <button onClick={() => deleteItem(item)} className="p-1 text-[var(--danger)] hover:text-[var(--danger)]/80" title="حذف نهائي">
              <FaTrash />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );

  /* واجهة المستخدم */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">المفضلة</h2>
        <button onClick={() => setActiveTab("archive")} className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--primary)]">
          <FaHistory className="text-xl" />
          {!!archived.length && <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{archived.length}</span>}
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "favorites", label: "العناصر المفضلة" },
          { key: "following", label: "المتاجر المتابعة" },
          { key: "archive", label: `الأرشيف (${archived.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-1.5 rounded-full text-sm border ${
            activeTab === t.key ? "bg-[var(--primary)] text-black border-transparent" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--primary)]/10"}`}>{t.label}</button>
        ))}
      </nav>

      {/* Search */}
      <div className="relative mb-6">
        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث..." className="w-full pl-4 pr-10 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]" />
      </div>

      {/* List */}
      <div className="grid gap-4">
        <AnimatePresence initial={false}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <motion.div key={i} className="h-24 bg-gray-200/40 rounded-lg animate-pulse" />)
          ) : items.length ? (
            items.map((item) => <Card key={`${activeTab}-${item.id}`} item={item} />)
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <FaSearch className="text-4xl text-[var(--text-secondary)] mx-auto mb-4" />
              <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">لا توجد نتائج</h3>
              <p className="text-[var(--text-secondary)]">جرّب كلمة بحث أخرى</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
