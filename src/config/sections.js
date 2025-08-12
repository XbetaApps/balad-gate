/**
 * تكوين الأقسام المتاحة في التطبيق
 * يمكن تخصيص الأقسام المعطلة من خلال متغير البيئة NEXT_PUBLIC_DISABLED_SECTIONS
 * مثال: NEXT_PUBLIC_DISABLED_SECTIONS='trending,popular'
 */

// الأقسام المتاحة في التطبيق
const ALL_SECTIONS = {
  featured: {
    id: 'featured',
    name: 'مميز',
    component: 'FeaturedSection',
    enabled: true,
    priority: 1
  },
  trending: {
    id: 'trending',
    name: 'شائع',
    component: 'TrendingSection',
    enabled: true,
    priority: 2
  },
  recent: {
    id: 'recent',
    name: 'الأحدث',
    component: 'RecentSection',
    enabled: true,
    priority: 3
  },
  popular: {
    id: 'popular',
    name: 'الأكثر شعبية',
    component: 'PopularSection',
    enabled: true,
    priority: 4
  },
  categories: {
    id: 'categories',
    name: 'التصنيفات',
    component: 'CategoriesSection',
    enabled: true,
    priority: 5
  }
};

// الحصول على الأقسام المفعّلة مع مراعاة الإعدادات
function getEnabledSections() {
  try {
    // الحصول على الأقسام المعطلة من متغير البيئة
    const disabledSections = process.env.NEXT_PUBLIC_DISABLED_SECTIONS 
      ? process.env.NEXT_PUBLIC_DISABLED_SECTIONS.split(',').map(s => s.trim())
      : [];

    // تصفية الأقسام المعطلة
    const enabledSections = Object.values(ALL_SECTIONS)
      .filter(section => !disabledSections.includes(section.id) && section.enabled !== false)
      .sort((a, b) => a.priority - b.priority);

    return enabledSections;
  } catch (error) {
    console.error('Error in getEnabledSections:', error);
    // العودة إلى الأقسام الافتراضية في حالة حدوث خطأ
    return Object.values(ALL_SECTIONS)
      .filter(section => section.enabled !== false)
      .sort((a, b) => a.priority - b.priority);
  }
}

// تصدير الدالة والمكونات
module.exports = {
  getEnabledSections,
  ALL_SECTIONS
};
