'use client';

import React from 'react';
import Link from 'next/link';

export default function ServicesFooter() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">بوابة البلاد</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">جميع الخدمات بين يديك</p>
          </div>
          
          <div className="flex space-x-4 space-x-reverse">
            <Link href="/about" className="text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400 transition-colors">
              من نحن
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400 transition-colors">
              اتصل بنا
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400 transition-colors">
              الخصوصية
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6 text-center md:text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} بوابة البلاد. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
