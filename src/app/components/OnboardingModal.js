"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

/* ===== Helpers ===== */
function readToken() {
  if (typeof window !== "undefined") {
    const cookies = document.cookie
      .split(";")
      .reduce((acc, cookie) => {
        const [name, value] = cookie.split("=").map((c) => c.trim());
        if (name) acc[name] = value;
        return acc;
      }, {});
    return cookies["next-auth.session-token"] ||
      cookies["__Secure-next-auth.session-token"] ||
      cookies["token"] ||
      null;
  }
  return null;
}

function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function Chip({ label, onDelete }) {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-xs">
      {label}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-amber-700 dark:text-amber-300 hover:opacity-80"
          aria-label={`حذف ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

const postJSON = async (url, data, token, userId) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (userId) headers["X-User-Id"] = userId;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  let payload = null;
  try { 
    payload = await res.json(); 
  } catch (e) { 
    console.error('Error parsing JSON response:', e);
    payload = { message: 'Invalid JSON response from server' };
  }

  if (!res.ok) {
    console.error('API Error:', {
      url,
      status: res.status,
      statusText: res.statusText,
      payload
    });
    
    let errorMessage = payload?.message || `HTTP ${res.status} ${res.statusText}`;
    if (res.status === 500) {
      errorMessage = 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.';
    }
    
    const err = new Error(errorMessage);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
};

/* ===== Component ===== */
export default function OnboardingModal({ open, onDone, onClose }) {
  const { user: authUser, getToken, checkAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(!!open);

  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [followedTags, setFollowedTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  
  // قائمة المحافظات الفلسطينية
  const cities = [
    'جنين',
    'طوباس',
    'طولكرم',
    'نابلس',
    'قلقيلية',
    'سلفيت',
    'رام الله والبيرة',
    'أريحا والأغوار',
    'القدس',
    'بيت لحم',
    'الخليل',
    'غزة',
    'دير البلح',
    'خان يونس',
    'رفح'
  ];

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const resultsBoxRef = useRef(null);

  useEffect(() => { setIsOpen(!!open); }, [open]);

  // تحميل بيانات المودال
  useEffect(() => {
    let isMounted = true;
    let timer;

    const load = async () => {
      if (!authUser) { if (isMounted) setLoading(false); return; }
      if (isMounted) setLoading(true);

      try {
        const res = await fetch("/api/onboarding", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "X-User-Id": authUser?.id || "",
          },
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (isMounted) {
          if (!res.ok) throw new Error(data?.message || "فشل تحميل البيانات");
          setUser(data?.user || null);
          setPhone(data?.user?.phone || "");
          setCity(data?.user?.city || "");
          setFollowedTags(Array.isArray(data?.followedTags) ? data.followedTags : []);
          setSuggestedTags(Array.isArray(data?.suggestedTags) ? data.suggestedTags : []);
        }
      } catch (err) {
        console.error("Error loading onboarding:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    timer = setTimeout(load, 250);
    return () => { isMounted = false; if (timer) clearTimeout(timer); };
  }, [authUser]);

  // البحث عن التاغات (اختياري لو عندك /api/tags)
  useEffect(() => {
    let active = true;
    (async () => {
      const q = debouncedQuery.trim();
      if (!q) { if (active) setSearchResults([]); return; }
      setSearching(true);
      try {
        const token = getToken?.() || readToken();
        const res = await fetch(`/api/tags?search=${encodeURIComponent(q)}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "X-User-Id": authUser?.id || "",
          },
        });
        if (!active) return;
        if (res.ok) {
          const list = await res.json().catch(() => []);
          setSearchResults(Array.isArray(list) ? list : []);
        } else {
          setSearchResults([]);
        }
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    })();

    return () => { active = false; };
  }, [debouncedQuery, getToken, authUser?.id]);

  const alreadySelectedIds = useMemo(
    () => new Set(followedTags.map((t) => t.id)), [followedTags]
  );

  const addTag = (tagObj) => {
    if (!tagObj || !tagObj.id || !tagObj.name) return;
    if (!alreadySelectedIds.has(tagObj.id)) {
      setFollowedTags((prev) => [...prev, tagObj]);
    }
    setQuery(""); setSearchResults([]);
  };

  const removeTag = (id) => {
    setFollowedTags((prev) => prev.filter((t) => t.id !== id));
  };

  const updateOnboardingStatus = async (data) => {
    const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
    const userId = (authUser && authUser.id) || (user && user.id) || null;
    try {
      return await postJSON("/api/onboarding?action=update-status", data, token, userId);
    } catch (e) {
      console.warn("update-status failed, trying update-profile:", e?.message || e);
      return await postJSON("/api/onboarding?action=update-profile", data, token, userId);
    }
  };

  const handleDontShowAgain = async () => {
    try {
      await checkAuth?.();
      if (!authUser) throw new Error("يجب تسجيل الدخول أولاً");
      const payload = {
        onboarding_done: true,
        onboarding_done_at: new Date().toISOString(),
      };
      const result = await updateOnboardingStatus(payload);

      if (onDone) {
        await onDone({
          skipped: false,
          saved: true,
          user: result?.user || user || authUser,
        });
      }
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
      alert(error.message || "فشل تحديث حالة الإعداد");
    }
  };

  const handleSkip = async (e) => {
    try {
      e?.preventDefault?.(); e?.stopPropagation?.();
      if (onDone) await onDone({ skipped: true, saved: false, user: authUser });
      if (typeof onClose === "function") onClose();
    } catch (error) {
      console.error("Error in skip:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.(); 
    e?.stopPropagation?.();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!city) {
        throw new Error("الرجاء اختيار المدينة/المحافظة");
      }
      
      const tagNames = followedTags.map((t) => t.name);
      const requestBody = {
        phone: phone?.trim() || null,
        city: city || null,
        tags: tagNames,
        onboarding_done: true,
        onboarding_done_at: new Date().toISOString(),
      };

      await checkAuth?.();
      if (!authUser) throw new Error("يجب تسجيل الدخول أولاً");

      const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
      const userId = authUser.id;

      console.log("Saving onboarding data:", { 
        requestBody,
        hasToken: !!token,
        userId 
      });

      const result = await postJSON(
        "/api/onboarding?action=update-profile", 
        requestBody, 
        token, 
        userId
      );

      console.log("Onboarding saved successfully:", result);

      if (onDone) {
        await onDone({ skipped: false, saved: true, user: result.user || authUser });
      }
      if (onClose) onClose();
    } catch (error) {
      console.error("Error in handleSave:", {
        error,
        message: error.message,
        status: error.status,
        payload: error.payload
      });
      
      // More user-friendly error messages
      let errorMessage = error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      
      if (error.status === 401) {
        errorMessage = "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.";
      } else if (error.status === 403) {
        errorMessage = "غير مصرح لك بهذا الإجراء.";
      } else if (error.status === 404) {
        errorMessage = "لم يتم العثور على البيانات المطلوبة.";
      } else if (error.status >= 500) {
        errorMessage = "حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease]" />
      <div className="relative w-full max-w-3xl rounded-2xl shadow-2xl border border-[var(--border,#eee)] bg-[var(--background,#fff)] dark:bg-gray-900 overflow-hidden animate-[zoomIn_.2s_ease]">
        <div className="bg-gradient-to-l from-amber-200 via-amber-100 to-white dark:from-amber-900/30 dark:via-amber-900/20 dark:to-gray-900 p-6 sm:p-7 border-b border-[var(--border,#eee)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <span className="text-xl sm:text-2xl font-bold">🌟</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-amber-200 tracking-tight">
                أهلاً بك في منصّة بلد گيت!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
                خطوة سريعة نهيّئ بها حسابك — يمكنك تخطيها الآن أو إكمالها خلال ثوانٍ.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-xl border border-[var(--border,#eee)] bg-white/70 dark:bg-gray-800/50 p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">معلومات حسابك</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">الاسم</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{user?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">البريد</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 dir-ltr">{user?.email || "—"}</span>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">رقم الجوال (اختياري)</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">يسهّل التواصل حول طلباتك وتحديثات المنشورات.</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">المدينة/المحافظة (اختياري)</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">اختر المدينة/المحافظة</option>
                  {cities.map((cityName, index) => (
                    <option key={index} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">لتحسين تجربتك وعرض المحتوى المناسب لمدينتك</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border,#eee)] bg-white/70 dark:bg-gray-800/50 p-4 sm:p-5 shadow-sm relative">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">اختر تاغات تهمّك (اختياري)</h3>

            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث باسم التاغ…"
                className="w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {(searchResults.length > 0 || searching) && query.trim() && (
                <div
                  ref={resultsBoxRef}
                  className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--border,#e5e7eb)] bg-white dark:bg-gray-800 shadow-lg max-h-56 overflow-auto"
                >
                  {searching ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">جارٍ البحث…</div>
                  ) : (
                    searchResults.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => addTag(t)}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-3">
              {followedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {followedTags.map((t) => (
                    <Chip key={t.id} label={t.name} onDelete={() => removeTag(t.id)} />
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-gray-500 dark:text-gray-400">لم تختر أي تاغ بعد.</p>
              )}
            </div>
          </section>
        </div>

        <div className="px-5 sm:px-7 py-4 bg-[var(--background,#fff)] dark:bg-gray-900 border-t border-[var(--border,#eee)] flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center sm:justify-between">
          <button
            onClick={handleDontShowAgain}
            className="order-2 sm:order-1 inline-flex items-center justify-center rounded-lg border border-[var(--border,#e5e7eb)] bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            لا تظهره مرة أخرى
          </button>
          <div className="order-1 sm:order-2 flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              لاحقًا
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              حفظ والمتابعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
