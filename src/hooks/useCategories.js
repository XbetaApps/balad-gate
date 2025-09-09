import { useState, useEffect, useCallback } from 'react';

/**
 * Hook مخصص لجلب وإدارة الأقسام من API
 * يدعم جلب الأقسام الرئيسية والفرعية مع إدارة حالات التحميل والأخطاء
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب جميع الأقسام
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في جلب الأقسام');
      }
      
      const data = await response.json();
      let categoriesList = Array.isArray(data) ? data : [];
      
      // Sort categories by sort_order
      categoriesList = categoriesList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      setCategories(categoriesList);
      
      // Separate parent and child categories
      const parents = categoriesList
        .filter(cat => !cat.parent_id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
      const children = categoriesList
        .filter(cat => cat.parent_id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      setParentCategories(parents);
      
      return categoriesList;
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      setCategories([]);
      setParentCategories([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // جلب الأقسام الفرعية لقسم معين
  const fetchSubCategories = useCallback(async (parentId) => {
    try {
      const response = await fetch(`/api/categories?parentId=${parentId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في جلب الأقسام الفرعية');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      return [];
    }
  }, []);

  // جلب الأقسام الرئيسية فقط
  const fetchParentCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?parentId=null');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في جلب الأقسام الرئيسية');
      }
      
      const data = await response.json();
      const parents = Array.isArray(data) 
        ? data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) 
        : [];
      setParentCategories(parents);
      return parents;
    } catch (err) {
      console.error('Error fetching parent categories:', err);
      setParentCategories([]);
      return [];
    }
  }, []);

  // البحث في الأقسام
  const searchCategories = useCallback((query) => {
    if (!query || !query.trim()) {
      return categories;
    }
    
    const searchTerm = query.toLowerCase().trim();
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm) ||
      (category.description && category.description.toLowerCase().includes(searchTerm))
    );
  }, [categories]);

  // الحصول على قسم بالمعرف
  const getCategoryById = useCallback((id) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // الحصول على الأقسام الفرعية لقسم معين
  const getSubCategories = useCallback((parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  }, [categories]);

  // إعادة تحميل البيانات
  const refresh = useCallback(() => {
    return fetchCategories();
  }, [fetchCategories]);

  // تحميل البيانات عند التهيئة
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    // البيانات
    categories,
    parentCategories,
    
    // الحالات
    loading,
    error,
    
    // الدوال
    fetchCategories,
    fetchSubCategories,
    fetchParentCategories,
    searchCategories,
    getCategoryById,
    getSubCategories,
    refresh
  };
}

/**
 * Hook مبسط لجلب الأقسام مع إعدادات مخصصة
 */
export function useCategoriesWithOptions(options = {}) {
  const {
    autoFetch = true,
    parentId = null,
    activeOnly = true
  } = options;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/categories';
      const params = new URLSearchParams();
      
      if (parentId !== null) {
        params.append('parentId', parentId);
      }
      
      if (activeOnly) {
        params.append('activeOnly', 'true');
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في جلب الأقسام');
      }
      
      const data = await response.json();
      const categoriesList = Array.isArray(data) ? data : [];
      
      setCategories(categoriesList);
      return categoriesList;
    } catch (err) {
      console.error('Error fetching categories with options:', err);
      setError(err.message);
      setCategories([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [parentId, activeOnly]);

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [autoFetch, fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    refresh: fetchCategories
  };
}
