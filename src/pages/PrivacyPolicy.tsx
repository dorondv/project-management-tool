import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Footer } from '../components/layout/Footer';

const enTranslations = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: April 2026',
  back: 'Back to Home',
  intro:
    'This Privacy Policy explains how MySollo collects, uses, and protects personal information when you use the Service.',
  sections: [
    {
      title: 'Who We Are',
      paragraphs: [
        'MySollo is the service provider and acts as data controller for account and billing data. For customer data you upload, you remain the controller and we act as a service provider/processor. The MySollo website is operated by D.M.C. (the “Site Owner”).',
      ],
    },
    {
      title: 'General',
      paragraphs: [
        'Use of and/or browsing the website and/or purchasing a subscription through the website (the “User”) constitutes consent to this Privacy Policy.',
        'By submitting details on the website, the User declares that the Site Owner may use such details in accordance with this Privacy Policy; that the details are provided with the User’s consent and free will; and that the User is aware there is no legal obligation to provide the information unless it is expressly stated that there is a legal obligation to provide it.',
        'What is stated in this Privacy Policy applies equally regardless of gender.',
      ],
    },
    {
      title: 'Information We Collect',
      paragraphs: [
        'Account data: name, email address, phone number, login credentials, and profile.',
        'Customer data you upload: customer details, contacts, projects, billing data, and notes.',
        'Usage and technical/statistical data collected automatically via tools such as Google Analytics, including: device identifiers, IP address, browser and device type, activity and service usage logs, cookies, and similar technologies (Cookies).',
        'Payment data: billing and transaction details processed by third-party payment providers, including ID number and credit card details that subscribers voluntarily provide through the “secure payment” form.',
      ],
    },
    {
      title: 'Cookies and Similar Tracking Technologies',
      paragraphs: [
        'The site uses Cookies and similar technologies such as Google Analytics for its proper ongoing operation and to collect statistical data about use of the site.',
        'Cookies are small text files stored on your device (computer, smartphone) while browsing the site and are used to identify the user, save preferences, authentication, and improve the browsing experience, as well as to track user behavior for marketing purposes.',
        'You can manage Cookies through your browser settings, including blocking them; note that this may impair site functionality. Refer to your browser’s help file for how to do this.',
      ],
    },
    {
      title: 'How We Use Information',
      paragraphs: [
        'To provide, operate, and improve the Service and support customers.',
        'To manage subscriptions, billing, and security.',
        'To comply with legal obligations under applicable law and enforce the Terms of Service.',
        'To contact you.',
        'To send marketing mail and updates from the Site Owner and/or anyone on its behalf, where you have consented.',
        'Where required for the Site Owner’s ongoing operations, such as requirements of credit card companies, or software/IT/cloud/marketing/mailing/payment service providers, or any other party providing services to the Site Owner.',
        'To verify and improve the experience of using the Service and browsing the site.',
        'For statistical and analytical purposes, including anonymous analysis of user traffic.',
        'To measure the effectiveness of advertising campaigns.',
        'For any other need required for the Site Owner’s internal and/or ongoing management.',
      ],
    },
    {
      title: 'Legal Basis',
      paragraphs: [
        'We process personal information based on the User’s express consent when registering for a trial and/or as a subscriber to perform a contract, compliance with legal requirements and reporting to authorities where required, and legitimate business interests such as security, responding to inquiries, improving services, and fraud prevention.',
      ],
    },
    {
      title: 'Sharing and Disclosure to Third Parties',
      paragraphs: [
        'We may share information where required for the Site Owner’s ongoing operations, such as requirements of credit card companies, or software/IT/cloud/marketing/mailing/payment providers, or any other party providing services to the Site Owner (e.g., hosting, analytics, and payments) acting on our behalf under appropriate safeguards.',
        'We may disclose information if required by law, court order, regulatory demand, or legal proceedings (including claims and/or disputes and/or legal proceedings between the User and the Site Owner and anything implied thereby).',
        'Where there is suspicion that the User has committed an act or omission (including unlawful acts) that may cause harm (including economic harm) to the Site Owner and/or anyone on its behalf.',
        'Sharing of anonymous technical information collected and stored by technology service providers such as Google, in accordance with those providers’ policies.',
        'In all of the above cases, every user of the site waives any claim and/or demand and/or request in this regard against the Site Owner and/or anyone on its behalf.',
      ],
    },
    {
      title: 'Data Retention',
      paragraphs: [
        'We retain information for as long as needed to provide the Service and meet legal obligations.',
        'You may request deletion of an account or data, subject to legal and contractual requirements.',
      ],
    },
    {
      title: 'Information Security',
      paragraphs: [
        'We implement reasonable administrative, technical, and organizational safeguards to reduce the risk of unauthorized access to information.',
        'Nevertheless, no method is 100% secure; we cannot guarantee absolute security of information transmitted over the internet or stored in any electronic system, and the Site Owner does not warrant that its services will be completely immune from unauthorized access to information stored in them.',
        'If you have concerns about certain information, please avoid transmitting it over the internet.',
        'Nevertheless, the Site Owner shall bear no liability, direct and/or indirect, in cases of unauthorized access by others and/or resulting from acts and/or omissions beyond its control. The User shall not raise any claim and/or demand and/or request against the Site Owner and/or anyone on its behalf in the event of such intrusion into its systems, including the website.',
      ],
    },
    {
      title: 'International Transfers',
      paragraphs: [
        'Information may be stored or processed in Israel or in other countries where our service providers operate.',
        'When transferring information, we take reasonable safeguards as required by law.',
      ],
    },
    {
      title: 'Your Rights Under Israeli Privacy Laws',
      paragraphs: [
        'The right to review information the Site Owner holds about you (to the extent it holds any).',
        'The right to correct inaccurate or incomplete information.',
        'The right to delete information (subject to legal and contractual limitations).',
        'The right to restrict and/or object to processing of your personal information.',
        'The right to withdraw consent previously given (where consent was given).',
        'To exercise these rights, contact us at info@mysollo.co.',
      ],
    },
    {
      title: 'Changes to This Privacy Policy',
      paragraphs: [
        'We may update and/or change this Policy from time to time. We will publish updates and update the “Last updated” date. Changes take effect as of the last update date of the document, and continued use and/or browsing of the site after such changes constitutes the User’s consent to the revised policy.',
      ],
    },
    {
      title: 'Governing Law and Jurisdiction',
      paragraphs: [
        'This Policy is governed by the laws of the State of Israel.',
        'Any dispute relating to this Policy shall be subject to the exclusive jurisdiction of the competent courts in Tel Aviv-Yafo.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: [
        'For questions and/or contact regarding this Privacy Policy, email us at info@mysollo.co.',
      ],
    },
  ],
};

const translations = {
  en: enTranslations,
  he: {
    title: 'מדיניות פרטיות',
    lastUpdated: 'עודכן לאחרונה: באפריל 2026',
    back: 'חזרה לעמוד הבית',
    intro:
      'מדיניות פרטיות זו מסבירה כיצד MySollo אוספת, משתמשת ומגינה על מידע אישי בעת השימוש בשירות.',
    sections: [
      {
        title: 'מי אנחנו',
        paragraphs: [
          'MySollo היא ספקית השירות ופועלת כבקרת נתונים עבור נתוני חשבון וחיוב. ביחס לנתוני לקוחות שאתה מעלה, אתה נותר הבקר ואנו פועלים כספק שירות/מעבד. אתר MySollo מופעל על ידי די.אם.סי (להלן: "בעל האתר").',
        ],
      },
      {
        title: 'כללי',
        paragraphs: [
          'שימוש ו/או גלישה באתר ו/או רכישת מנוי באמצעות האתר (להלן:"המשתמש"), מהווים הסכמה למדיניות פרטיות זו.',
          'במסירת פרטים באתר, המשתמש מצהיר כי בעל האתר יהיה רשאי לעשות שימוש בפרטים הנ"ל בהתאם למדיניות הפרטיות, וכי הפרטים הנ"ל נמסרים בהסכמת המשתמש ומרצונו החופשי וכי הוא מודע שלא קיימת חובה חוקית למסירת המידע, אלא אם יצוין במפורש שקיימת חובה חוקית למסירת המידע.',
          'המפורט במדיניות פרטיות זו מתייחס לשני המינים בצורה שווה.',
        ],
      },
      {
        title: 'מידע שאנו אוספים',
        paragraphs: [
          'נתוני חשבון: שם, כתובת אימייל, מספר טלפון, פרטי התחברות ופרופיל.',
          'נתוני לקוחות שאתה מעלה: פרטי לקוחות, אנשי קשר, פרויקטים, נתוני חיוב והערות.',
          'נתוני שימוש ומידע טכני וסטטיסטי הנאסף אוטומטית באמצעות כלים כגון Google Analytics כגון: מזהי מכשיר, כתובת IP, סוג דפדפן ומכשיר, יומני פעילות ושימוש בשירות, עוגיות ומזהים טכנולוגיים (Cookies).',
          'נתוני תשלום: פרטי חיוב ועסקאות המעובדים על ידי ספקי תשלום צד שלישי, לרבות מספר ת.ז. ופרטי כרטיס אשראי שהמנויים מוסרים מרצונם החופשי דרך טופס "תשלום מאובטח".',
        ],
      },
      {
        title: 'Cookies וטכנולוגיות מעקב דומות',
        paragraphs: [
          'האתר עושה שימוש בקובצי Cookies ובטכנולוגיות מעקב דומות כגון Google Analytics לצורך תפעולו השוטף והתקין ולצורך איסוף נתונים סטטיסטיים אודות השימוש באתר.',
          'Cookies הם קבצי טקסט קטנים שנשמרים במכשיר (מחשב, סמארטפון) בזמן גלישה באתר ומשמשים לזיהוי המשתמש, לשמירת העדפות, לאימות ולשיפור חוויית הגלישה כמו גם למעקב אחר התנהגות המשתמש לצורך שיווק.',
          'ניתן לנהל את השימוש ב-Cookies דרך הגדרות הדפדפן, כולל חסימתם, אם כי תשומת לב, שהדבר עלול לפגוע בפונקציונליות של האתר. לשם כך יש להיוועץ בקובץ העזרה של הדפדפן.',
        ],
      },
      {
        title: 'כיצד אנו משתמשים במידע',
        paragraphs: [
          'לספק, להפעיל ולשפר את השירות ולתמוך בלקוחות.',
          'לנהל מנויים, חיובים ואבטחה.',
          'לעמוד בחובות חוקיות על פי הוראות כל דין ולאכוף את תנאי השירות.',
          'לצורך יצירת קשר.',
          'לצורך שליחת דואר שיווקי ועדכונים מבעל האתר ו/או מי מטעמו, ככל והמשתמש אישר זאת.',
          'כאשר העניין נדרש לצורך הפעילות השוטפת של בעל האתר כגון דרישת חברות האשראי, דרישת ספקי שירות תוכנה/מחשוב/ענן/שיווק/דיוור/תשלום ו/או כל גוף אחר המספק שירותים לבעל האתר.',
          'אימות ושיפור חווית השימוש בשירות והגלישה באתר.',
          'מטרות סטטיסטיות ואנליטיות לצורכי ניתוח אנונימי של תנועת המשתמשים.',
          'מדידת יעילות מסעות פרסום.',
          'לכל צורך אחר הנדרש לניהולו הפנימי ו/או השוטף של בעל האתר.',
        ],
      },
      {
        title: 'בסיס משפטי',
        paragraphs: [
          'אנו מעבדים מידע אישי שניתן בהסכמה מפורשת של המשתמש בעת הרשמה כמשתמש לתקופת ניסיון ו/או כמנוי לשם ביצוע חוזה, עמידה בדרישות חוקיות ודיווח לרשויות, במידה ונדרש ואינטרסים עסקיים לגיטימיים כגון אבטחה, מתן מענה לפניות, שיפור השירותים ומניעת הונאה.',
        ],
      },
      {
        title: 'שיתוף וגילוי מידע עם צדדים שלישיים',
        paragraphs: [
          'אנו עשויים לשתף מידע כאשר העניין נדרש לצורך הפעילות השוטפת של בעל האתר כגון דרישת חברות האשראי, דרישת ספקי שירות תוכנה/מחשוב/ענן/שיווק/דיוור/ספקי תשלום ו/או כל גוף אחר המספק שירותים לבעל האתר (כגון אירוח, אנליטיקה ותשלומים) הפועלים מטעמנו תחת אמצעי הגנה מתאימים.',
          'אנו עשויים לגלות מידע אם נידרש לכך על פי דין, צו בית משפט או דרישת רגולטור או הליכים משפטיים (לרבות תביעות ו/או טענות ו/או הליכים משפטיים בין המשתמש לבין בעל האתר ובכל עניין המשתמע מכך).',
          'במקרה בו התעורר החשד כי המשתמש ביצע מעשה ו/או מחדל (לרבות שאינם חוקיים) העלולים לגרום נזק (לרבות נזק כלכלי) לבעל האתר ו/או למי מטעמו.',
          'שיתוף מידע טכני אנונימי הנאסף ונשמר ע"י ספקי השירותים הטכנולוגיים כגון Google בהתאם למדיניות הספקים הנ"ל.',
          'בכל המקרים שהוזכרו לעיל, כל המשתמש באתר מוותר על כל טענה ו/או תביעה ו/או דרישה בעניין כלפי בעל האתר ו/או מי מטעמו.',
        ],
      },
      {
        title: 'שמירת נתונים',
        paragraphs: [
          'אנו שומרים מידע כל עוד נדרש לצורך מתן השירות ועמידה בחובות חוקיות.',
          'באפשרותך לבקש מחיקה של חשבון או נתונים, בכפוף לדרישות חוקיות וחוזיות.',
        ],
      },
      {
        title: 'אבטחת מידע',
        paragraphs: [
          'אנו מיישמים אמצעי הגנה מנהליים, טכניים וארגוניים סבירים. כדי לצמצם את הסיכון לחדירה בלתי מורשית למידע.',
          'על אף האמור, יודגש כי אין שיטה בטוחה במאה אחוז; איננו יכולים להבטיח אבטחה מוחלטת של מידע המועבר באינטרנט או מאוחסן בכל מערכת אלקטרונית ועל כן בעל האתר אינו מתחייב ששירותיו יהיו חסינים באופן מוחלט מפני גישה בלתי-מורשית למידע המאוחסן בהם.',
          'אם יש לך כמשתמש חששות בנוגע למידע מסוים, אנא הימנע מלהעביר מידע זה באמצעות האינטרנט.',
          'על אף האמור, בעל האתר לא ישא בכל אחריות, ישירה ו/או עקיפה במקרים של חדירה בלתי מורשת של אחרים ו/או כתוצאה ממעשים ו/או מחדלים שאינם בשליטתו. המשתמש לא יעלה כל טענה ו/או תביעה ו/או דרישה כלפי בעל האתר ו/או מי מטעמו במקרה של חדירות כאמור למערכותיו ובכלל זה לאתר.',
        ],
      },
      {
        title: 'העברות בינלאומיות',
        paragraphs: [
          'מידע עשוי להישמר או להיות מעובד בישראל או במדינות אחרות בהן פועלים ספקי השירות שלנו.',
          'בעת העברת מידע אנו נוקטים באמצעי הגנה סבירים כנדרש על פי דין.',
        ],
      },
      {
        title: 'זכויותיך בהתאם לחוקי הגנת הפרטיות בישראל',
        paragraphs: [
          'הזכות לעיין במידע שבעל האתר מחזיק אודותיך (ככל שמחזיק).',
          'הזכות לתקן מידע שגוי או לא מדויק.',
          'הזכות למחוק את המידע (בכפוף למגבלות חוקיות וחוזיות).',
          'הזכות להגביל ו/או להתנגד לעיבוד המידע האישי של המשתמש.',
          'הזכות לבטל הסכמה שניתנה בעבר (ככל שניתנה).',
          'למימוש הזכויות, פנה אלינו בכתובת info@mysollo.co.',
        ],
      },
      {
        title: 'שינויים במדיניות הפרטיות',
        paragraphs: [
          'אנו עשויים לעדכן ו/או לשנות מדיניות זו מעת לעת. נפרסם את העדכונים ונעדכן את תאריך "עודכן לאחרונה". השינויים במדיניות הפרטיות יכנסו לתוקף בתאריך העדכון האחרון של המסמך והמשך השימוש ו/או הגלישה באתר לאחר השינויים הנ"ל יהווה הסכמה של המשתמש למדיניות המתוקנת.',
        ],
      },
      {
        title: 'דין וסמכות שיפוט',
        paragraphs: [
          'מדיניות זו כפופה לדיני מדינת ישראל.',
          'כל מחלוקת הקשורה למדיניות זו תהיה בסמכות השיפוט הבלעדית של בתי המשפט המוסמכים בתל אביב-יפו.',
        ],
      },
      {
        title: 'יצירת קשר',
        paragraphs: [
          'לשאלות ו/או ליצירת קשר בנושא מדיניות פרטיות זו ניתן לפנות אלינו בדוא"ל info@mysollo.co.',
        ],
      },
    ],
  },
};
translations.es = enTranslations;
translations.de = enTranslations;
translations['pt'] = enTranslations;

export default function PrivacyPolicy() {
  const { state } = useApp();
  const locale = state.locale || 'en';
  const isRTL = locale === 'he';
  const t = translations[locale] || translations.en;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
          <Link
            to="/"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t.back}
          </Link>
        </div>
        <h1 className={`text-3xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.title}
        </h1>
        <p className={`mt-2 text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.lastUpdated}
        </p>
        <p className={`mt-6 text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.intro}
        </p>

        <div className="mt-8 space-y-6">
          {t.sections.map((section) => (
            <section key={section.title}>
              <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                {section.title}
              </h2>
              <div className="mt-2 space-y-2">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className={`text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Footer />
      </div>
    </div>
  );
}
