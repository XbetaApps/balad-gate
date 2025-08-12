-- إدراج إعلانات وهمية (اختيارية إذا لم تكن موجودة)
INSERT INTO ads (id, title, description, price, user_id, created_at)
VALUES 
  (1001, 'دواء مسكن للألم', 'دواء مسكن قوي وفعال', 150.00, 1, NOW()),
  (1002, 'فيتامين سي 1000 مجم', 'مكمل غذائي مهم للمناعة', 200.00, 1, NOW()),
  (1003, 'كريم ترطيب البشرة', 'كريم مرطب يومي للبشرة الجافة', 180.00, 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج متاجر وهمية (اختياري إذا لم تكن موجودة)
INSERT INTO stores (id, name, description, user_id, created_at)
VALUES 
  (101, 'صيدلية النيل', 'صيدلية متكاملة بجميع الأدوية', 1, NOW()),
  (102, 'مستلزمات طبية', 'جميع المستلزمات الطبية', 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج عروض وهمية (اختياري إذا لم تكن موجودة)
INSERT INTO offers (id, title, description, discount, store_id, created_at)
VALUES 
  (201, 'خصم 20% على الفيتامينات', 'عرض خاص على جميع المكملات الغذائية', 20, 101, NOW()),
  (202, 'عروض العناية بالبشرة', 'خصومات تصل إلى 30% على مستحضرات التجميل', 30, 102, NOW())
ON CONFLICT (id) DO NOTHING;

-- إدراج بيانات وهمية في جدول المفضلة
-- تأكد من استبدال user_id بأرقام المستخدمين الحقيقيين في قاعدة البيانات الخاصة بك

-- إضافة إعلانات إلى المفضلة
INSERT INTO favorites (user_id, item_id, item_type, created_at)
VALUES 
  (1, 1001, 'ad', NOW() - INTERVAL '5 days'),
  (1, 1002, 'ad', NOW() - INTERVAL '3 days'),
  (2, 1003, 'ad', NOW() - INTERVAL '1 day'),
  (1, 201, 'offer', NOW() - INTERVAL '2 days'),
  (2, 202, 'offer', NOW() - INTERVAL '4 days'),
  (1, 101, 'store', NOW() - INTERVAL '6 days'),
  (2, 102, 'store', NOW() - INTERVAL '2 days');

-- إضافة بعض العناصر المؤرشفة
UPDATE favorites 
SET archived_at = NOW() - INTERVAL '1 day'
WHERE item_id IN (1003, 202);

-- إضافة متابعات للمتاجر
INSERT INTO following (user_id, store_id, created_at)
VALUES 
  (1, 101, NOW() - INTERVAL '5 days'),
  (2, 102, NOW() - INTERVAL '3 days');
