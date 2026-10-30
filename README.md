# رخاء — نظام إدارة العمالة

مشروع مفتوح: أي حد معاه الرابط يقدر يشوف ويعدّل (من غير أدمن). البيانات والصور والشات على Supabase.

```
index.html                  الصفحة الرئيسية (بتحمّل الملفات بالترتيب)
404.html                    صفحة الخطأ (GitHub Pages بيستخدمها تلقائي، و Hostinger عن طريق .htaccess)
manifest.json               إعدادات تثبيت التطبيق
.htaccess                   كاش وإعدادات الاستضافة

config/
  config.js                 ← حط هنا Supabase url و key (والخيار login)

database/
  supabase-setup.sql        ← شغّله مرة واحدة في Supabase > SQL Editor

assets/
  css/app.css               التصميم
  img/icon.svg              الأيقونة

src/
  core/app.js               الجداول، الحسابات، الواجهة الأساسية
  sync/supabase.js          المزامنة مع Supabase (بيانات + صور + شات)
  features/
    files.js                استيراد Excel + نسخة احتياطية
    export.js               تصدير تقارير Excel
    extras.js               لوحة التحكم والتنبيهات
    attachments.js          صور البطاقات والمستندات
    filemanager.js          مدير الملفات المستوردة
    chat.js                 الشات
  vendor/exceljs.min.js     مكتبة Excel
  main.js                   تشغيل التطبيق (آخر ملف)
```

## التشغيل
1. أنشئ مشروع Supabase وشغّل `database/supabase-setup.sql`.
2. حط `url` و `key` (anon) في `config/config.js`.
3. ارفع كل الفولدر على أي استضافة ستاتيك (مش محتاج PHP).
4. أول جهاز يفتح الموقع بيرفع بياناته الحالية للسيرفر، والباقي بيسحب منه.

## تنبيه
الوضع المفتوح معناه إن أي حد يعرف الرابط (والـ anon key الظاهر في الكود) يقدر يقرا ويعدّل ويحذف كل البيانات، ومنها الأرقام القومية وصور البطاقات. لو حبيت تقفله: `login: true` في config.js وغيّر السياسات حسب آخر سطرين في ملف الـ SQL.

## النشر
المشروع ستاتيك بالكامل (HTML/JS/CSS) ومش محتاج PHP، فبيشتغل على أي استضافة.

**GitHub Pages:** ارفع محتويات الفولدر في الـ root بتاع الريبو (مش جوه فولدر إضافي) ← Settings ‹ Pages ‹ Deploy from a branch ‹ main / root. ملف `.nojekyll` موجود. الريبو العام معناه إن الكود وكل ما فيه ظاهر لأي حد، فمتحطش service_role key أبداً (الـ anon بس).

**Hostinger:** ارفع محتويات الفولدر على `public_html` (File Manager أو FTP). ملف `.htaccess` بيشتغل هناك. الملفات 644 والفولدرات 755.

لما تعدّل أي ملف في `src/` أو `config/`، زوّد رقم `?v=` في `index.html` عشان المتصفحات تحمّل الجديد (GitHub Pages بيكاشي الملفات حوالي 10 دقايق، ولا يقرأ `.htaccess`).
