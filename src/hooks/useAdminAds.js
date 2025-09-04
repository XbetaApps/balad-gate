import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getAds, createAd, updateAd, deleteAd } from '@/lib/api/admin/ads';

export default function useAdminAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const itemsPerPage = 10;

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm })
      }).toString();
      
      const data = await getAds(query);
      setAds(data.ads);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error(error.message || 'حدث خطأ أثناء جلب الإعلانات');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAds();
  };

  const handleCreate = async (adData) => {
    try {
      setIsSaving(true);
      await createAd(adData);
      toast.success('تم إنشاء الإعلان بنجاح');
      setShowForm(false);
      fetchAds();
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الإعلان');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (adData) => {
    try {
      setIsSaving(true);
      await updateAd(selectedAd.id, adData);
      toast.success('تم تحديث الإعلان بنجاح');
      setShowForm(false);
      setSelectedAd(null);
      fetchAds();
    } catch (error) {
      console.error('Error updating ad:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث الإعلان');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    try {
      await deleteAd(id);
      toast.success('تم حذف الإعلان بنجاح');
      
      // If we're on the last page with one item, go back a page
      if (ads.length === 1 && currentPage > 1) {
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else {
        fetchAds();
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error(error.message || 'حدث خطأ أثناء حذف الإعلان');
    }
  };

  const handleEditClick = (ad) => {
    setSelectedAd(ad);
    setShowForm(true);
  };

  const handleFormSubmit = (formData) => {
    if (selectedAd) {
      return handleUpdate(formData);
    }
    return handleCreate(formData);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedAd(null);
  };

  return {
    ads,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    isSaving,
    showForm,
    selectedAd,
    handleSearch,
    handleDelete,
    handleEditClick,
    handleFormSubmit,
    handleCloseForm,
    setShowForm
  };
}
