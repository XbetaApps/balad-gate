"use client";

import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  const handleSupportClick = () => {
    router.push('/profile?section=support');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">من نحن</h1>
      
      <div className="max-w-4xl mx-auto">
      <p className="text-lg mb-6 ">
  بوابة البلد هي منصة محلية شاملة تهدف إلى تسهيل حياتك اليومية من خلال واجهة بسيطة ومتكاملة.  
  نوفر لك كل ما تحتاجه في مكان واحد — من آخر الأخبار المحلية والعالمية، وحالة الطقس والطرق، إلى المتاجر والخدمات والعقارات والمطاعم والمراكز الصحية وغير ذلك الكثير.  
  والأفضل من ذلك، أننا نوفر لك نظام <span className="font-semibold text-amber-600 dark:text-amber-400">مساعد ذكي يعمل بالذكاء الاصطناعي</span> (AI Chat)  
  يساعدك في الوصول إلى المعلومات التي تحتاجها بسهولة، ويجيب على استفساراتك فورًا، ويوجهك للخدمة أو القسم المناسب.  
  مهمتنا أن نكون دليلك الذكي في مدينتك، ونوفر لك كل شيء بخطوة واحدة فقط.
</p>


        <div className="bg-[var(--card)]/60 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">التواصل معنا</h2>
          <p className="mb-4">
            نحن متواجدون لمساعدتك 24/7. يمكنك التواصل معنا من خلال:
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
  <svg
    className="w-5 h-5 "
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
</span>

              <div>
                <button
                  onClick={handleSupportClick}
                  className="text-blue-500 hover:text-blue-700 cursor-pointer"
                >
                  <span className="font-medium">التحدث مع المشرف</span>
                </button>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  اضغط هنا للتواصل مع مشرف الموقع أو المشرف الشخصي
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}