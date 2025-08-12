"use client";
import React, { useState } from 'react';
import { FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function AccountInfo({ userData }) {
  const [editData, setEditData] = useState({
    phone: '',
    city: ''
  });
  
  const [isEditing, setIsEditing] = useState({
    phone: false,
    city: false
  });

  const handleEditClick = (field) => {
    setEditData(prev => ({
      ...prev,
      [field]: userData[field] || ''
    }));
    
    setIsEditing(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleSaveClick = (field) => {
    // إغلاق وضع التعديل
    setIsEditing(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handleCancelEdit = (field) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handleInputChange = (e, field) => {
    setEditData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">معلومات الحساب</h2>
      
      <div className="space-y-4">
        {/* رقم الهاتف */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <FaPhone className="text-[var(--primary)]" />
            <span>رقم الهاتف</span>
          </div>
          {!isEditing.phone ? (
            <div className="flex items-center justify-between bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text-primary)]">{userData.phone || 'لم يتم إضافة رقم هاتف'}</span>
              <button 
                onClick={() => handleEditClick('phone')}
                className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
              >
                تعديل
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={editData.phone}
                onChange={(e) => handleInputChange(e, 'phone')}
                className="flex-1 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                placeholder="أدخل رقم الجوال"
              />
              <button 
                onClick={() => handleSaveClick('phone')}
                className="px-4 bg-[var(--primary)] text-black rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
              >
                حفظ
              </button>
              <button 
                onClick={() => handleCancelEdit('phone')}
                className="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>

        {/* المدينة */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <FaMapMarkerAlt className="text-[var(--primary)]" />
            <span>المدينة</span>
          </div>
          {!isEditing.city ? (
            <div className="flex items-center justify-between bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text-primary)]">{userData.city || 'لم يتم إضافة مدينة'}</span>
              <button 
                onClick={() => handleEditClick('city')}
                className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
              >
                تعديل
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={editData.city}
                onChange={(e) => handleInputChange(e, 'city')}
                className="flex-1 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                placeholder="أدخل المدينة"
              />
              <button 
                onClick={() => handleSaveClick('city')}
                className="px-4 bg-[var(--primary)] text-black rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
              >
                حفظ
              </button>
              <button 
                onClick={() => handleCancelEdit('city')}
                className="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
