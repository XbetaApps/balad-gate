"use client";
import React, { useState } from 'react';
import { FaLock } from 'react-icons/fa';

export default function PasswordSection() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // التحقق من صحة كلمات المرور
    if (!passwordData.currentPassword) {
      setError('يجب إدخال كلمة المرور الحالية');
      return;
    }

    if (!passwordData.newPassword) {
      setError('يجب إدخال كلمة المرور الجديدة');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    try {
      setIsUpdating(true);
      // هنا سيتم إضافة استدعاء API لتحديث كلمة المرور
      // await updatePassword(passwordData);
      
      // إعادة تعيين الحقول بعد النجاح
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('تم تحديث كلمة المرور بنجاح');
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">تغيير كلمة المرور</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
            <FaLock className="text-[var(--primary)]" />
            كلمة المرور الحالية
          </label>
          <input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            className="w-full bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            placeholder="أدخل كلمة المرور الحالية"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            كلمة المرور الجديدة
          </label>
          <input
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            className="w-full bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            placeholder="أدخل كلمة المرور الجديدة"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            تأكيد كلمة المرور الجديدة
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            className="w-full bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            placeholder="أعد إدخال كلمة المرور الجديدة"
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className={`w-full px-6 py-3 rounded-lg font-medium text-white ${
              isUpdating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)]'
            } transition-colors`}
          >
            {isUpdating ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </form>
    </div>
  );
}
