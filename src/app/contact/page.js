"use client";

import { useRouter } from 'next/navigation';
import { Github } from "lucide-react";

export default function Page() {
  const router = useRouter();

  const handleSupportClick = () => {
    router.push('/profile?section=support');
  };

  return (
    <div className="">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">من نحن</h1>
          <div className="w-20 h-1 bg-amber-500 mx-auto"></div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-10 border border-gray-100 dark:border-gray-700">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
            <p className="tوext-lg mb-6 text-black ">
  Slameh  هي منصة محلية شاملة تهدف إلى تسهيل حياتك اليومية من خلال واجهة بسيطة ومتكاملة.  
  نوفر لك كل ما تحتاجه في مكان واحد — من آخر الأخبار المحلية والعالمية، وحالة الطقس والطرق، إلى المتاجر والخدمات والعقارات والمطاعم والمراكز الصحية وغير ذلك الكثير.  
  والأفضل من ذلك، أننا نوفر لك نظام <span className="font-semibold text-amber-600 ">مساعد ذكي يعمل بالذكاء الاصطناعي</span> (AI Chat)  
  يساعدك في الوصول إلى المعلومات التي تحتاجها بسهولة، ويجيب على استفساراتك فورًا، ويوجهك للخدمة أو القسم المناسب.  
  مهمتنا أن نكون دليلك الذكي في مدينتك، ونوفر لك كل شيء بخطوة واحدة فقط.
</p>            </p>
            
<div className="grid md:grid-cols-2 gap-6 mb-10">
  <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-lg border border-amber-100 dark:border-amber-900/30">
    <h3 className="text-xl font-semibold text-gray-800 dark:text-amber-100 mb-3">عميد سلامة</h3>
    <p className="text-gray-600 dark:text-gray-300">
       عميد علي سلامة، مطوّر ويب من فلسطين وطالب في السنة الخامسة بتخصص هندسة الحاسوب في جامعة النجاح الوطنية. 
      أعمل حاليًا على مشروع تخرجي الذي يتمحور حول تصميم وبناء منصة رقمية سهلة الاستخدام تخدم المجتمع وتلبي احتياجاته اليومية. 
      شغفي يكمن في ابتكار حلول تقنية عملية تُبسط حياة الناس وتُسهم في تطوير أسلوب حياتهم نحو الأفضل.
    </p>
  </div>
  <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-lg border border-amber-100 dark:border-amber-900/30">
    <h3 className="text-xl font-semibold text-gray-800 dark:text-amber-100 mb-3">غيث سلامة </h3>
    <p className="text-gray-600 dark:text-gray-300">
      شريكي في المشروع غيث سلامي، يعمل معي على تطوير وتنفيذ الأفكار، 
      ونسعى معًا لتقديم منصة محلية متكاملة تجمع بين التقنية الحديثة وسهولة الاستخدام، 
      لنلبي احتياجات سكان وزوار مدينتنا بطريقة أكثر ذكاءً وفاعلية.
    </p>
  </div>
</div>


            
<div className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white p-6 rounded-2xl shadow-lg mb-10">
      <h2 className="text-2xl font-bold mb-4 text-center"> عن الموقع</h2>
      <p className="text-white leading-relaxed text-center mb-6">
        تم إنشاء هذا الموقع وبرمجته بشكل كامل من قبل الطالب{" "}
        <span className="font-semibold">عميد سلامة</span> و{" "}
        <span className="font-semibold">غيث سلامة</span>. <br />
        نفتخر بتقديم منصة محلية متكاملة تجمع بين الإبداع والابتكار لخدمة مجتمعنا.
      </p>
      <div className="flex justify-center space-x-6">
        <a
          href="https://github.com/Ameed-salameh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
        >
          <Github className="w-5 h-5" />
          <span>GitHub عميد</span>
        </a>
        <a
          href="https://github.com/XbetaApps"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
        >
          <Github className="w-5 h-5" />
          <span>GitHub غيث</span>
        </a>
      </div>
    </div>

          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">تواصل معنا</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              نحن متواجدون لمساعدتك على مدار الساعة. لا تتردد في التواصل معنا عبر:
            </p>

            <div className="space-y-6 max-w-md mx-auto">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">البريد الإلكتروني</h3>
                  <a href="mailto:support@baladgate.com" className="text-blue-600 dark:text-blue-400 hover:underline">ameed.salame123@gmail.com</a>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">خدمة العملاء</h3>
                  <a href="tel:+970599999999" className="text-blue-600 dark:text-blue-400 hover:underline">0595693849</a>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">الدردشة المباشرة</h3>
                  <button
                    onClick={handleSupportClick}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                  >
                    اضغط للدردشة  
                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">متوفر 24/7</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">تابعنا على وسائل التواصل الاجتماعي</h3>
              <div className="flex justify-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <span className="sr-only">فيسبوك</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <span className="sr-only">إنستغرام</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
