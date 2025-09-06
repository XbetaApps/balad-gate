# تكامل الأقسام مع API

## نظرة عامة
تم تحديث صفحة الخدمات لاستخدام الأقسام من API بدلاً من البيانات الجاهزة، مع الحفاظ على نفس التصميم والفكرة.

## التغييرات المنجزة

### 1. إنشاء Hook مخصص للأقسام
- **الملف**: `src/hooks/useCategories.js`
- **الوظائف**:
  - `useCategories()`: Hook شامل لإدارة الأقسام
  - `useCategoriesWithOptions()`: Hook مبسط مع خيارات مخصصة
- **الميزات**:
  - جلب الأقسام الرئيسية والفرعية
  - البحث في الأقسام
  - إدارة حالات التحميل والأخطاء
  - دعم الفلترة حسب الحالة

### 2. تحديث صفحة الخدمات
- **الملف**: `src/app/services/page.js`
- **التغييرات**:
  - استبدال البيانات الجاهزة (`SERVICE_CATEGORIES`) بالأقسام من API
  - تحديث مكون `PostCard` لاستخدام الأيقونات والألوان من الإعدادات الجديدة
  - تحديث مكون `ServicePosts` لاستخدام أسماء الأقسام من API
  - إضافة حالات تحميل وأخطاء للأقسام

### 3. إعدادات الأيقونات والألوان
- **الأيقونات**: `SERVICE_ICONS` - ربط أسماء الأقسام بالأيقونات المناسبة
- **الألوان**: `SERVICE_COLORS` - ربط أسماء الأقسام بالألوان المناسبة
- **أيقونات الأقسام الرئيسية**: `CATEGORY_ICONS` - أيقونات للأقسام الرئيسية

### 4. الميزات الجديدة
- **تحميل ديناميكي**: الأقسام تُحمل من API عند بدء تشغيل الصفحة
- **Quick-Add ديناميكي**: قائمة الإضافة السريعة تتحدث بناءً على الأقسام المتاحة
- **حالات التحميل**: عرض مؤشر تحميل أثناء جلب البيانات
- **معالجة الأخطاء**: عرض رسائل خطأ واضحة مع إمكانية إعادة المحاولة

## كيفية العمل

### 1. تحميل الأقسام
```javascript
const { categories, parentCategories, loading, error } = useCategories();
```

### 2. تحويل البيانات للعرض
```javascript
const serviceCategories = useMemo(() => {
  return parentCategories.map(parent => {
    const subCategories = categories.filter(cat => cat.parent_id === parent.id);
    return {
      id: parent.id,
      title: parent.name,
      icon: React.createElement(CATEGORY_ICONS[parent.name] || FaBoxes, { className: "text-xl" }),
      services: subCategories.map(sub => ({
        id: sub.id,
        title: sub.name,
        icon: React.createElement(SERVICE_ICONS[sub.name] || FaStore, { className: "text-2xl" }),
        color: SERVICE_COLORS[sub.name] || "bg-blue-500"
      }))
    };
  });
}, [parentCategories, categories]);
```

### 3. عرض المنشورات
```javascript
<ServicePosts
  categoryName={s.title}
  governorate={selectedGov}
  search={searchQuery}
  isAuthenticated={isAuthenticated}
/>
```

## API المستخدم

### جلب جميع الأقسام
```
GET /api/categories
```

### جلب الأقسام الرئيسية
```
GET /api/categories?parentId=null
```

### جلب الأقسام الفرعية
```
GET /api/categories?parentId={parentId}
```

## المزايا

1. **مرونة**: يمكن إضافة/تعديل/حذف الأقسام من لوحة الإدارة
2. **ديناميكية**: التصميم يتكيف مع الأقسام المتاحة
3. **أداء**: تحميل محسن مع حالات تحميل واضحة
4. **موثوقية**: معالجة شاملة للأخطاء
5. **سهولة الصيانة**: فصل منطق البيانات عن العرض

## التوافق

- ✅ الحفاظ على نفس التصميم الأصلي
- ✅ دعم الوضع المظلم والفاتح
- ✅ دعم الأجهزة المحمولة
- ✅ دعم البحث والفلترة
- ✅ دعم إضافة المنشورات

## الاختبار

تم اختبار:
- ✅ تحميل الأقسام من API
- ✅ عرض الأقسام في الواجهة
- ✅ البحث والفلترة
- ✅ إضافة المنشورات
- ✅ حالات التحميل والأخطاء
