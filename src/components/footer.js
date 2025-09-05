// components/Footer.js
import {
  Facebook,
  Instagram,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer dir="rtl" className="relative mt-16">
      {/* خلفية لطيفة */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-black" />

      {/* شريط علوي صغير (يمكن حذفه إن رغبت) */}
      <div className="h-1 w-full bg-gradient-to-l from-blue-600 via-cyan-500 to-emerald-500 opacity-80" />

      {/* المحتوى الرئيسي */}
      <div className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {/* البراند + الوصف */}
            <div className="md:col-span-5">
              <div className="flex items-start justify-end">
                <img
                  src="/Logo.png"
                  alt="SLAMEH Logo"
                  className="h-24 w-24 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 text-right">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  SLAMEH
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
                  منصة محلية متكاملة تجمع الأخبار، الطقس، حالة الطرق، المتاجر،
                  العقارات، المطاعم والخدمات الصحية، مع مساعد ذكي يوصلك للمعلومة
                  والخدمة بسرعة وسهولة.
                </p>

                {/* شبكات التواصل */}
                <div className="mt-5 flex items-center justify-end gap-3">
                  <Social
                    href="https://facebook.com"
                    label="فيسبوك"
                    Icon={Facebook}
                  />
                  <Social
                    href="https://instagram.com"
                    label="إنستغرام"
                    Icon={Instagram}
                  />
                  <Social
                    href="https://wa.me/972595693849"
                    label="واتساب"
                    Icon={MessageCircle}
                  />
                </div>
              </div>
            </div>

            {/* روابط سريعة */}
            <div className="md:col-span-3 text-right">
              <Title>روابط سريعة</Title>
              <ul className="space-y-2 text-sm">
                <ItemLink href="/">الرئيسية</ItemLink>
                <ItemLink href="/news">الأخبار</ItemLink>
                <ItemLink href="/weather">الطقس</ItemLink>
                <ItemLink href="/money">العملات</ItemLink>
                <ItemLink href="/cars">حالة الطرق</ItemLink>
                <ItemLink href="/services">خدماتنا</ItemLink>
                <ItemLink href="/contact">من نحن</ItemLink>
              </ul>
            </div>

            {/* أقسام المنصة (ثابتة وصفية) */}
            <div className="md:col-span-2 text-right">
              <Title>أقسام مختصرة</Title>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>متاجر ومطاعم</li>
                <li>عقارات وعروض</li>
                <li>خدمات صحية</li>
                <li>تنبيهات الطقس والطرق</li>
                <li>مساعد ذكي</li>
              </ul>
            </div>

            {/* تواصل معنا */}
            <div className="md:col-span-2 text-right">
              <Title>تواصل معنا</Title>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center justify-end gap-2">
                  <a
                    href="tel:+972595693849"
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    +972 59 569 3849
                  </a>
                  <Phone className="h-4 w-4 opacity-80" />
                </li>
                <li className="flex items-center justify-end gap-2">
                  <a
                    href="tel:+380664898760"
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    +380 66 489 8760
                  </a>
                  <Phone className="h-4 w-4 opacity-80" />
                </li>
                <li className="flex items-center justify-end gap-2">
                  <span className="text-gray-900 dark:text-white">
                    فلسطين – دعم عبر واتساب
                  </span>
                  <MapPin className="h-4 w-4 opacity-80" />
                </li>
                <li className="flex items-center justify-end gap-2">
                  <span className="text-gray-900 dark:text-white">
                    يوميًا 9:00–21:00
                  </span>
                  <Clock className="h-4 w-4 opacity-80" />
                </li>
              </ul>

              {/* زر واتساب */}
              <a
                href="https://wa.me/972595693849"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-green-600/30 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm ring-1 ring-inset ring-green-600/20 transition hover:scale-[1.02] hover:bg-green-50 dark:bg-gray-900 dark:text-green-400 dark:hover:bg-gray-800"
              >
                تواصل عبر واتساب
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* فاصل سفلي */}
      <div className="border-t border-gray-200/70 px-6 py-5 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            © {year} <span className="font-semibold text-gray-700 dark:text-gray-200">SLAMEH</span> — جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2">
            <Badge>واجهة عربية</Badge>
            <Badge>متجاوب</Badge>
            <Badge>وضع داكن</Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ——— عناصر صغيرة لإعادة الاستخدام ——— */
function Title({ children }) {
  return (
    <h3 className="mb-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-l from-blue-50 to-transparent px-3 py-1 text-lg font-semibold text-gray-900 dark:from-blue-900/20 dark:text-white">
      {children}
    </h3>
  );
}

function ItemLink({ href, children }) {
  return (
    <li>
      <a
        href={href}
        className="inline-flex items-center gap-2 text-gray-600 transition hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <span>{children}</span>
        <span className="h-1 w-1 rounded-full bg-current opacity-30" />
      </a>
    </li>
  );
}

function Social({ href, label, Icon }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:scale-[1.05] hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
      {children}
    </span>
  );
}