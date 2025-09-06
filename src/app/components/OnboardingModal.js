"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ===== Helpers ===== */
import { useAuth } from '../auth/AuthProvider';

// دالة مساعدة لقراءة التوكن
function readToken() {
  if (typeof window !== 'undefined') {
    // في المتصفح
    const cookies = document.cookie.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = value;
      return cookies;
    }, {});
    
    return cookies['next-auth.session-token'] || 
           cookies['__Secure-next-auth.session-token'] ||
           cookies['token'] ||
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

/* ===== Component ===== */
export default function OnboardingModal({ onDone, open: isOpen, onClose }) {
  const { user: authUser, getToken, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Sync internal state with props
  useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }
  }, [isOpen]);

  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [followedTags, setFollowedTags] = useState([]);   // [{id,name}]
  const [suggestedTags, setSuggestedTags] = useState([]); // [{id,name}]

  // tags search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const resultsBoxRef = useRef(null);

  // load onboarding state
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 1; // Reduced to 1 retry to prevent loops
    let abortController = new AbortController();
    
    async function load() {
      if (!isMounted) return;
      
      if (!authUser?.id) {
        console.log('OnboardingModal - No authenticated user');
        setInternalOpen(false);
        setLoading(false);
        return;
      }
      
      console.log('OnboardingModal - Loading data for user:', authUser.id);
      setLoading(true);
      
      try {
        const token = await getToken();

        console.log('Fetching onboarding data...', { 
          userId: authUser.id,
          hasToken: !!token
        });
        
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-User-Id': authUser.id
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch("/api/onboarding", {
          method: "GET",
          credentials: 'include',
          signal: abortController.signal,
          headers,
          cache: 'no-store',
        });

        console.log('Onboarding API response status:', res.status);
        
        if (res.status === 401) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Session expired, refreshing... (attempt ${retryCount}/${MAX_RETRIES})`);
            const refreshResult = await checkAuth(true); // Force refresh
            
            if (refreshResult) {
              console.log('Retrying after session refresh...');
              return load();
            }
          }
          
          console.log('Failed to refresh session after', MAX_RETRIES, 'attempts');
          if (isMounted) {
            setInternalOpen(false);
            setLoading(false);
          }
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to load onboarding data:', {
            status: res.status,
            statusText: res.statusText,
            error: errorText
          });
          
          if (isMounted) {
            setInternalOpen(false);
            setLoading(false);
          }
          return;
        }

        const data = await res.json();
        console.log('Onboarding data loaded:', { 
          user: !!data?.user, 
          onboardingDone: data?.user?.onboarding_done,
          followedTags: data?.followedTags?.length || 0,
          suggestedTags: data?.suggestedTags?.length || 0
        });
        
        if (!isMounted) return;

        // Batch state updates
        const isOnboardingDone = data?.user?.onboarding_done === true;
        const shouldOpen = Boolean(data?.user && !isOnboardingDone);
        
        console.log('Setting modal state:', { 
          shouldOpen, 
          hasUser: !!data?.user,
          isOnboardingDone
        });
        
        setUser(data?.user || null);
        setPhone(data?.user?.phone || "");
        setFollowedTags(Array.isArray(data?.followedTags) ? data.followedTags : []);
        setSuggestedTags(Array.isArray(data?.suggestedTags) ? data.suggestedTags : []);
        setInternalOpen(shouldOpen);
        
        if (isOnboardingDone) {
          console.log('Onboarding already completed, closing modal');
          onDone && onDone({ skipped: false, alreadyCompleted: true });
        }
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request was aborted');
        } else {
          console.error('Error in onboarding load:', error);
        }
        if (isMounted) {
          setInternalOpen(false);
          setLoading(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    // Only run this effect when authUser.id changes
    if (authUser?.id) {
      load();
    } else {
      setLoading(false);
      onClose && onClose();
    }
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [authUser?.id, checkAuth, getToken]);

  // Handle initial load and auth state changes
  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      onClose && onClose();
      return;
    }
    
    // If user has completed onboarding, close the modal
    if (authUser.onboarding_done) {
      console.log('User has already completed onboarding');
      setLoading(false);
      onDone && onDone({ skipped: false, alreadyCompleted: true });
      onClose && onClose();
      return;
    }
    
    // Only run the effect when the modal is actually open
    if (internalOpen) {
      console.log('Initializing onboarding modal for user:', authUser.id);
      setLoading(false);
    }
  }, [authUser, internalOpen, onDone, onClose]);

  // search tags
  useEffect(() => {
    let active = true;
    (async () => {
      const q = debouncedQuery.trim();
      if (!q) {
        if (active) setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const token = getToken();
        const res = await fetch(`/api/tags?search=${encodeURIComponent(q)}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (active) {
          if (res.ok) {
            const list = await res.json().catch(() => []);
            setSearchResults(Array.isArray(list) ? list : []);
          } else {
            setSearchResults([]);
          }
        }
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    })();
    return () => { active = false; };
  }, [debouncedQuery]);

  const alreadySelectedIds = useMemo(
    () => new Set(followedTags.map((t) => t.id)),
    [followedTags]
  );

  const addTag = (tagObj) => {
    if (!tagObj || !tagObj.id || !tagObj.name) return;
    if (!alreadySelectedIds.has(tagObj.id)) {
      setFollowedTags((prev) => [...prev, tagObj]);
    }
    setQuery("");
    setSearchResults([]);
  };
  const removeTag = (id) => {
    setFollowedTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSkip = () => {
    // Close modal without touching database
    setInternalOpen(false);
    onDone && onDone({ skipped: true });
    onClose && onClose();
  };

  // Close modal temporarily without persisting anything
  // Permanently mark onboarding as done and never show again
  const handleNeverShow = async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const res = await fetch('/api/onboarding?action=update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skip: true,
          onboarding_done: true,
          onboarding_done_at: new Date().toISOString()
        })
      });
      if (!res.ok) {
        console.error('Failed to update onboarding status:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('handleNeverShow error:', err);
    } finally {
      setInternalOpen(false);
      onDone && onDone({ skipped: true });
      onClose && onClose();
    }
  };

  const handleLater = () => {
    setInternalOpen(false);
    onDone && onDone({ skipped: false, later: true });
    onClose && onClose();
  };

  const handleSave = async () => {
    try {
      const tagNames = followedTags.map((t) => t.name);
      console.log('Saving onboarding data...', { 
        phone: phone?.trim(),
        tags: tagNames 
      });
      
      // التحقق من صحة الجلسة قبل إرسال الطلب
      await checkAuth();
      
      if (!authUser) {
        console.error('User not authenticated');
        return;
      }
      
      const res = await fetch("/api/onboarding", {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest' // إضافة هذا الهيدر
        },
        body: JSON.stringify({
          phone: phone?.trim() || null,
          tags: tagNames,
          _t: Date.now() // منع التخزين المؤقت
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to save onboarding data:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });
        throw new Error(errorData.message || 'فشل في حفظ بيانات الإعداد');
      }

      const result = await res.json();
      console.log('Onboarding saved successfully:', result);
      
      setInternalOpen(false);
      onDone && onDone({ skipped: false, saved: true });
      onClose && onClose();
      window.dispatchEvent(new CustomEvent("onboarding:done", { 
        detail: { 
          skipped: false,
          user: result.user
        } 
      }));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert(error.message || "تعذر حفظ البيانات الآن. حاول مجددًا.");
    }
  };

  if (loading) {
    return null; // Or a loading spinner
  }
  
  if (!internalOpen) {
    return null;
  }
  
  console.log('Rendering OnboardingModal with:', { 
    loading, 
    open: internalOpen, 
    hasUser: !!user,
    onboardingDone: user?.onboarding_done
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease]" />

      {/* card */}
      <div className="relative w-full max-w-3xl rounded-2xl shadow-2xl border border-[var(--border,#eee)] bg-[var(--background,#fff)] dark:bg-gray-900 overflow-hidden animate-[zoomIn_.2s_ease]">
        {/* header */}
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

        {/* content */}
        <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* account info */}
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

            <div className="mt-4">
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
          </section>

          {/* tags */}
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

            {suggestedTags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">مقترحات:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.slice(0, 10).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => addTag(t)}
                      className={
                        (alreadySelectedIds.has(t.id)
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200/70 "
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ") +
                        "px-2 py-1 rounded-full text-xs border transition hover:opacity-90"
                      }
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

        {/* actions */}
        <div className="px-5 sm:px-7 py-4 bg-[var(--background,#fff)] dark:bg-gray-900 border-t border-[var(--border,#eee)] flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center sm:justify-between">
          <button
            onClick={handleSkip}
            className="order-2 sm:order-1 inline-flex items-center justify-center rounded-lg border border-[var(--border,#e5e7eb)] bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            تخطي الآن
          </button>
          <div className="order-1 sm:order-2 flex items-center gap-2">
            <button
              onClick={handleNeverShow}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              لا تظهره أبداً
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              حفظ ومتابعة
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes zoomIn {
          from { transform: scale(.98); opacity: .96 }
          to { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  );
}