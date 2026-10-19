// scripts/seed_arabic_content.mjs — seed Arabic localization content blocks and legal policies
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || (() => { throw new Error('DATABASE_URL is required (rm(2.4-2): no committed fallback)'); })()
});

await client.connect();

try {
  console.log('1. Updating legal_policies table constraint to (slug, lang)...');
  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'legal_policies' AND c.conname = 'legal_policies_pkey'
      ) THEN
        ALTER TABLE legal_policies DROP CONSTRAINT legal_policies_pkey;
        ALTER TABLE legal_policies ADD PRIMARY KEY (slug, lang);
      END IF;
    END $$;
  `);

  console.log('2. Inserting Arabic legal policies...');
  const arPolicies = [
    {
      slug: 'privacy-policy',
      title: 'سياسة الخصوصية',
      body: `من نحن وما تغطيه هذه السياسة: شركة سيمال تكنولوجيز الشرق الأوسط ش.ذ.م.م (بر دبي، ص.ب 49740) هي الجهة المسؤولة عن معالجة البيانات لهذه المنصة.

التوافق مع قانون حماية البيانات الشخصية: تتم معالجة البيانات وفقاً للمرسوم بقانون اتحادي رقم 45 لسنة 2021 في شأن حماية البيانات الشخصية في دولة الإمارات العربية المتحدة. يحق لأصحاب البيانات ممارسة حقوق الوصول والتصحيح والحذف عبر صفحة الاتصال بنا.

التحديثات: يتم الإعلان عن أي تغييرات جوهرية على المنصة قبل 30 يوماً من سريانها.`,
      lang: 'ar',
      version: 1
    },
    {
      slug: 'terms-conditions',
      title: 'الشروط والأحكام',
      body: `استخدام المنصة: تقديم طلبات عروض الأسعار (RFQ)، واستخدام الحسابات وترخيص المحتوى. عروض الأسعار صالحة لمدة 7 أيام ما لم يذكر خلاف ذلك.

التوافق مع القوانين والأنظمة: تخضع جميع المعاملات والاتفاقيات للقوانين السارية في دولة الإمارات العربية المتحدة وإمارة دبي.

تسوية النزاعات: تخضع جميع النزاعات الناشئة عن المعاملات للاختصاص القضائي لمحاكم دبي.`,
      lang: 'ar',
      version: 1
    },
    {
      slug: 'cookie-policy',
      title: 'سياسة ملفات تعريف الارتباط',
      body: `ملفات تعريف الارتباط التي نستخدمها: ملفات تعريف الارتباط الضرورية للجلسة وتسجيل الدخول، وملفات التفضيلات (اللغة والإشعارات)، وملفات التحليلات المشروطة بموافقة المستخدم المسبقة.

إدارة الموافقة: وفقاً للمرسوم بقانون اتحادي رقم 45 لسنة 2021، يمكنك تعديل خيارات الموافقة أو سحبها في أي وقت عبر رابط "إعدادات ملفات تعريف الارتباط" في أسفل الموقع.

مدة الاحتفاظ: يتم حفظ خيارات الموافقة لمدة 12 شهراً قبل طلب التجديد.`,
      lang: 'ar',
      version: 1
    },
    {
      slug: 'return-policy',
      title: 'سياسة الإرجاع والضمان',
      body: `الإرجاع وخدمات RMA: تحمل جميع منتجات العلامات التجارية المعتمدة ضمان الشركة المصنعة الرسمي، وتتم إدارة طلبات الصيانة والإرجاع محلياً عبر مكتب سيمال المعتمد في دبي.

فترة الفحص والقبول: يحق للشركاء فحص الشحنات والإبلاغ عن أي تلف أو نقص خلال 48 ساعة من تاريخ الاستلام.`,
      lang: 'ar',
      version: 1
    },
    {
      slug: 'shipping-policy',
      title: 'سياسة الشحن والتسليم',
      body: `التسليم: شحن خلال نفس اليوم أو يوم العمل التالي داخل دولة الإمارات من مركزنا اللوجستي في المنطقة الحرة بجبل علي (جافزا)؛ وخلال نفس الأسبوع لدول مجلس التعاون الخليجي.

تتبع الشحنات: يتم إصدار أرقام تتبع معتمدة لكل بوليصة شحن، مع دعم الشحن المباشر والمستودعات الجمركية.`,
      lang: 'ar',
      version: 1
    },
    {
      slug: 'refund-policy',
      title: 'سياسة الاسترداد',
      body: `الاسترداد المالي: تتم معالجة عمليات استرداد المبالغ المدفوعة مسبقاً خلال 10 أيام عمل إلى وسيلة الدفع الأصلية بعد الموافقة النهائية على طلب الإرجاع (RMA).`,
      lang: 'ar',
      version: 1
    },
    {
      slug: 'accessibility-statement',
      title: 'بيان إمكانية الوصول الرقمي',
      body: `التزامنا بإمكانية الوصول: نلتزم بتطبيق معايير WCAG 2.2 بالمستوى AA، بما في ذلك تباين الألوان المعتمد، والتنقل الكامل عبر لوحة المفاتيح، والدعم الكامل للنصوص من اليمين إلى اليسار (RTL) للغة العربية. نرحب بأي ملاحظات عبر صفحة الاتصال.`,
      lang: 'ar',
      version: 1
    }
  ];

  for (const p of arPolicies) {
    await client.query(`
      INSERT INTO legal_policies (slug, title, body, lang, version)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (slug, lang) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body
    `, [p.slug, p.title, p.body, p.lang, p.version]);
  }

  console.log('3. Inserting Arabic content blocks...');
  const arBlocks = [
    {
      entity: 'site',
      entity_id: 'home',
      lang: 'ar',
      payload: {
        badge: 'موزّع معتمد · الإمارات · الخليج · أفريقيا · آسيا الوسطى',
        title: 'شريك توزيع التكنولوجيا في الشرق الأوسط — ونبني البرمجيات أيضاً',
        lead: 'أكثر من {years} عاماً في توزيع منتجات Crucial وHikvision وTeamGroup وUGREEN وعلامات عالمية أصيلة — مع خدمات تقنية وبرمجيات مؤسسية بالتعاون مع شريكنا Unisoft Systems.',
        trustPoints: ['منتجات أصلية بضمان محلي', 'لوجستيات سريعة من جبل علي', 'جاهزية الفوترة الإلكترونية Peppol']
      }
    },
    {
      entity: 'site',
      entity_id: 'about',
      lang: 'ar',
      payload: {
        title: 'عن شركة سيمال للتقنيات',
        lead: 'شركة مستقلة رائدة في توزيع تقنية المعلومات وحلول المؤسسات بدبي منذ عام {since}.',
        mission: 'تمكين قنوات التوزيع والشركات في الشرق الأوسط بأحدث التقنيات المعتمدة والحلول البرمجية عالية الكفاءة.',
        vision: 'أن نكون المنصة الأكثر موثوقية وابتكاراً في التوزيع التقني والتحول الرقمي بالمنطقة.'
      }
    },
    {
      entity: 'site',
      entity_id: 'contact',
      lang: 'ar',
      payload: {
        title: 'اتصل بنا',
        lead: 'أربعة مواقع وفريق عمل متكامل. المبيعات والدعم الفني والحسابات في خدمتكم مباشرة.',
        hoursNote: 'أوقات العمل: الأحد إلى الخميس من 09:00 إلى 18:00 بتوقيت الإمارات.'
      }
    },
    {
      entity: 'site',
      entity_id: 'solutions5',
      lang: 'ar',
      payload: {
        title: 'حلول تقنية المعلومات — خمس ممارسات رائدة',
        items: [
          { targetId: 'amc', title: 'عقود الصيانة السنوية (AMC)', desc: 'استقرار وكفاءة البنية التحتية التقنية على مدار الساعة.' },
          { targetId: 'av', title: 'حلول الصوتيات والمرئيات وغرف الاجتماعات', desc: 'أحدث تقنيات المؤتمرات الذكية لتعزيز التعاون والإنتاجية.' },
          { targetId: 'cloud-security', title: 'أمن السحابة وحماية البيانات', desc: 'تأمين البيانات والأنظمة السحابية بأعلى المعايير.' },
          { targetId: 'data-recovery', title: 'استعادة البيانات وحلول التخزين', desc: 'حماية أصول البيانات المؤسسية واستعادتها بأمان.' },
          { targetId: 'firewall', title: 'جدران الحماية وشبكات الأمان', desc: 'تأمين محيط الشبكة المؤسسية ضد التهديدات والهجمات السيبرانية.' }
        ]
      }
    },
    {
      entity: 'software_product',
      entity_id: 'unipos',
      lang: 'ar',
      payload: {
        id: 'unipos',
        grp: 'erp',
        icon: '🛒',
        name: 'UniPOS — نظام نقاط البيع المتكامل',
        star: true,
        desc: 'حل متكامل لإدارة نقاط البيع لقطاعات التجزئة والأزياء وخدمات الأغذية والمشروبات.',
        feats: ['دعم الفروع المتعددة', 'إدارة المخزون في الوقت الفعلي', 'معالجة الدفع السريعة'],
        target: 'متاجر التجزئة وسلاسل المطاعم والخدمات'
      }
    },
    {
      entity: 'software_product',
      entity_id: 'univat',
      lang: 'ar',
      payload: {
        id: 'univat',
        grp: 'erp',
        icon: '🧾',
        name: 'UniVAT — نظام إدارة ضريبة القيمة المضافة المعتمد',
        star: true,
        desc: 'أتمتة الامتثال الضريبي مع الربط الحكومي المباشر، وجاهزية الفوترة الإلكترونية Peppol في الإمارات لعام 2027.',
        feats: ['امتثال ضريبي متكامل', 'أتمتة الإقرارات الضريبية', 'جاهزية الفوترة الإلكترونية Peppol'],
        target: 'الشركات الخاضعة لضريبة القيمة المضافة والمؤسسات الإقليمية'
      }
    },
    {
      entity: 'software_product',
      entity_id: 'distribution-erp',
      lang: 'ar',
      payload: {
        id: 'distribution-erp',
        grp: 'erp',
        icon: '📦',
        name: 'Distribution ERP — نظام إدارة التوزيع وسلاسل الإمداد',
        star: true,
        desc: 'نظام متكامل لإدارة عمليات التوزيع وسلاسل الإمداد والمخازن مدعوم بالذكاء الاصطناعي.',
        feats: ['إدارة سلاسل الإمداد', 'مراقبة المخزون الفوري', 'معالجة الطلبات الآلية'],
        target: 'شركات التوزيع ومراكز اللوجستيات'
      }
    },
    {
      entity: 'it_solution',
      entity_id: 'amc',
      lang: 'ar',
      payload: {
        id: 'amc',
        icon: '📅',
        t: 'عقود الصيانة السنوية (AMC)',
        d: 'صيانة وقائية وعلاجية مستمرة للبنية التحتية التقنية للشركات.',
        what: 'عقود صيانة شاملة تغطي الخوادم، والشبكات، ومحطات العمل مع التزام باتفاقيات مستوى الخدمة (SLA).'
      }
    },
    {
      entity: 'it_solution',
      entity_id: 'cloud-security',
      lang: 'ar',
      payload: {
        id: 'cloud-security',
        icon: '☁️',
        t: 'أمن السحابة وحماية الأنظمة',
        d: 'حلول متقدمة لحماية البيانات والبيئات السحابية الهجينة.',
        what: 'حماية وتأمين البيئات السحابية مع الامتثال لضوابط الهيئة الوطنية للأمن السيبراني وقوانين الخصوصية.'
      }
    },
    {
      entity: 'it_solution',
      entity_id: 'firewall',
      lang: 'ar',
      payload: {
        id: 'firewall',
        icon: '🛡️',
        t: 'حلول جدران الحماية وشبكات الأمان',
        d: 'أنظمة جدران حماية من الجيل التالي لحماية محيط الشبكات.',
        what: 'أجهزة وأنظمة حماية متقدمة من أبرز الشركات العالمية لصد الهجمات والاختراقات.'
      }
    },
    {
      entity: 'it_solution',
      entity_id: 'data-recovery',
      lang: 'ar',
      payload: {
        id: 'data-recovery',
        icon: '💾',
        t: 'استعادة البيانات وحلول التخزين الاحتياطي',
        d: 'حلول استعادة البيانات والتخزين المؤسسي الموثوق.',
        what: 'خدمات متخصصة لاسترجاع البيانات المفقودة وإعداد خطط التعافي من الكوارث وحفظ النسخ الاحتياطية.'
      }
    },
    {
      entity: 'it_solution',
      entity_id: 'av',
      lang: 'ar',
      payload: {
        id: 'av',
        icon: '🎥',
        t: 'حلول الصوتيات والمرئيات وغرف الاجتماعات',
        d: 'تجهيز قاعات المؤتمرات وغرف الاجتماعات الذكية.',
        what: 'شاشات تفاعلية، وكاميرات مؤتمرات ذكية، وأنظمة صوت متطورة متوافقة مع Teams وZoom.'
      }
    }
  ];

  for (const b of arBlocks) {
    await client.query(`
      INSERT INTO content_blocks (entity, entity_id, lang, payload)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (entity, entity_id, lang) DO UPDATE SET payload = EXCLUDED.payload
    `, [b.entity, b.entity_id, b.lang, JSON.stringify(b.payload)]);
  }

  const [resCb, resPol] = await Promise.all([
    client.query("SELECT count(*) FROM content_blocks WHERE lang = 'ar'"),
    client.query("SELECT count(*) FROM legal_policies WHERE lang = 'ar'")
  ]);
  console.log(`Arabic content blocks: ${resCb.rows[0].count}`);
  console.log(`Arabic legal policies: ${resPol.rows[0].count}`);
  console.log('Seeding Arabic content completed successfully!');
} catch (err) {
  console.error('Error seeding Arabic content:', err);
  process.exit(1);
} finally {
  await client.end();
}
