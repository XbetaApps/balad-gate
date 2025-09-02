// components/Footer.js
import { Facebook, Instagram, Phone, Mail, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-10 mt-16">
      <div className=" px-6 grid md:grid-cols-5 gap-8">
        {/* القسم الأول - الشعار */}
        <div className="flex justify-end">
          <img 
            src="/Logo.png" 
            alt="Salameh Logo" 
            className="h-64 w-64 object-contain"
          />
        </div>

        {/* القسم الثاني - اسم الموقع ووصف قصير */}
        <div className="flex flex-col text-right">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Slameh
          </h1>
          <p className="text-m text-gray-600 dark:text-gray-400">
            منصة محلية متكاملة تسهّل حياتك اليومية عبر واجهة بسيطة تجمع الأخبار، الطقس، حالة الطرق، المتاجر، العقارات، المطاعم والخدمات الصحية، مع مساعد ذكي بالذكاء الاصطناعي يوصلك للمعلومة والخدمة بسرعة وسهولة.
          </p>
        </div>

        {/* القسم الثالث - روابط سريعة */}
        <div className="text-right">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            روابط سريعة
          </h2>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-blue-600 dark:hover:text-blue-400">الرئيسية</a></li>
            <li><a href="/news" className="hover:text-blue-600 dark:hover:text-blue-400">الأخبار</a></li>
            <li><a href="/weather" className="hover:text-blue-600 dark:hover:text-blue-400">الطقس</a></li>
            <li><a href="/money" className="hover:text-blue-600 dark:hover:text-blue-400">العملات</a></li>
            <li><a href="/cars" className="hover:text-blue-600 dark:hover:text-blue-400">حالة الطرق</a></li>
            <li><a href="/services" className="hover:text-blue-600 dark:hover:text-blue-400">خدماتنا</a></li>
            <li><a href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">من نحن</a></li>
          </ul>
        </div>
       

        {/* القسم الثالث - بيانات التواصل */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            تواصل معنا
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone size={18} /> +972595693849
            </li>
            <li className="flex items-center gap-2">
              <Phone size={18} /> +380664898760
            </li>
            
          </ul>
        </div>

        {/* القسم الرابع - شبكات التواصل */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            تابعنا
          </h2>
          <div className="flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition"
            >
              <Facebook size={20} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-pink-500 dark:hover:bg-pink-500 hover:text-white transition"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://wa.me/972599000000"
              target="_blank"
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-green-500 dark:hover:bg-green-500 hover:text-white transition"
            >
              <MessageCircle size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* الخط السفلي */}
      <div className="border-t border-gray-300 dark:border-gray-700 mt-10 pt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Slameh
      </div>
    </footer>
  );
}
