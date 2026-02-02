import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Footer } from '../components/layout/Footer';

const translations = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: Feb 2, 2026',
    back: 'Back to Home',
    intro: 'This Privacy Policy explains how MySollo collects, uses, and protects personal information when you use the Service. We comply with the Israeli Privacy Protection Law, 5741-1981, and the Privacy Protection Regulations (Information Security), 2017.',
    sections: [
      {
        title: '1. Who We Are',
        paragraphs: [
          'MySollo is the provider of the Service and acts as the data controller for account and billing data. For customer data you upload, you remain the data controller, and we act as a service provider/processor.',
        ],
      },
      {
        title: '2. Information We Collect',
        paragraphs: [
          'Account data: name, email address, login credentials, and profile details.',
          'Customer data you upload: client names, contact details, project and billing data, and notes.',
          'Usage data: device identifiers, IP address, browser type, log data, and activity within the Service.',
          'Payment data: billing information and transaction details handled by payment providers.',
        ],
      },
      {
        title: '3. How We Use Information',
        paragraphs: [
          'To provide, operate, and improve the Service and customer support.',
          'To manage subscriptions, billing, and security.',
          'To comply with legal obligations and enforce our Terms of Service.',
        ],
      },
      {
        title: '4. Legal Basis',
        paragraphs: [
          'We process personal data to perform our contract with you, to comply with legal obligations, and for legitimate business interests such as security and fraud prevention.',
        ],
      },
      {
        title: '5. Sharing and Disclosure',
        paragraphs: [
          'We may share data with service providers (e.g., hosting, analytics, payments) who process data on our behalf under appropriate safeguards.',
          'We may disclose data if required by law, court order, or regulatory request.',
        ],
      },
      {
        title: '6. Data Retention',
        paragraphs: [
          'We retain data for as long as needed to provide the Service and comply with legal obligations.',
          'You may request deletion of your account or data, subject to legal and contractual requirements.',
        ],
      },
      {
        title: '7. Security',
        paragraphs: [
          'We implement reasonable administrative, technical, and organizational measures to protect data, in line with the Israeli Privacy Protection Regulations (Information Security), 2017.',
          'No method of transmission or storage is 100% secure; we cannot guarantee absolute security.',
        ],
      },
      {
        title: '8. International Transfers',
        paragraphs: [
          'Data may be processed or stored in Israel or other countries where our service providers operate.',
          'When transferring data, we use reasonable safeguards as required by applicable law.',
        ],
      },
      {
        title: '9. Your Rights',
        paragraphs: [
          'You may request access to, correction of, or deletion of your personal data, as provided under Israeli law.',
          'To exercise your rights, contact us at info@mysollo.co.',
        ],
      },
      {
        title: '10. Changes to This Policy',
        paragraphs: [
          'We may update this Privacy Policy periodically. We will post updates and revise the "Last updated" date.',
        ],
      },
      {
        title: '11. Governing Law and Jurisdiction',
        paragraphs: [
          'This Privacy Policy is governed by the laws of the State of Israel.',
          'Any disputes related to this Privacy Policy will be subject to the exclusive jurisdiction of the competent courts in Tel Aviv-Yafo, Israel.',
        ],
      },
      {
        title: '12. Contact',
        paragraphs: [
          'If you have questions about this Privacy Policy, contact us at info@mysollo.co.',
        ],
      },
    ],
  },
  he: {
    title: 'מדיניות פרטיות',
    lastUpdated: 'עודכן לאחרונה: 2 בפברואר 2026',
    back: 'חזרה לעמוד הבית',
    intro: 'מדיניות פרטיות זו מסבירה כיצד MySollo אוספת, משתמשת ומגינה על מידע אישי בעת השימוש בשירות. אנו פועלים בהתאם לחוק הגנת הפרטיות, התשמ״א-1981, ולתקנות הגנת הפרטיות (אבטחת מידע), תשע״ז-2017.',
    sections: [
      {
        title: '1. מי אנחנו',
        paragraphs: [
          'MySollo היא ספקית השירות ופועלת כבקרת נתונים עבור נתוני חשבון וחיוב. ביחס לנתוני לקוחות שאתה מעלה, אתה נותר הבקר ואנו פועלים כספק שירות/מעבד.',
        ],
      },
      {
        title: '2. מידע שאנו אוספים',
        paragraphs: [
          'נתוני חשבון: שם, כתובת אימייל, פרטי התחברות ופרופיל.',
          'נתוני לקוחות שאתה מעלה: פרטי לקוחות, אנשי קשר, פרויקטים, נתוני חיוב והערות.',
          'נתוני שימוש: מזהי מכשיר, כתובת IP, סוג דפדפן, יומני פעילות ושימוש בשירות.',
          'נתוני תשלום: פרטי חיוב ועסקאות המעובדים על ידי ספקי תשלום.',
        ],
      },
      {
        title: '3. כיצד אנו משתמשים במידע',
        paragraphs: [
          'לספק, להפעיל ולשפר את השירות ולתמוך בלקוחות.',
          'לנהל מנויים, חיובים ואבטחה.',
          'לעמוד בחובות חוקיות ולאכוף את תנאי השירות.',
        ],
      },
      {
        title: '4. בסיס משפטי',
        paragraphs: [
          'אנו מעבדים מידע אישי לשם ביצוע חוזה, עמידה בדרישות חוקיות ואינטרסים עסקיים לגיטימיים כגון אבטחה ומניעת הונאה.',
        ],
      },
      {
        title: '5. שיתוף וגילוי',
        paragraphs: [
          'אנו עשויים לשתף מידע עם ספקי שירות (כגון אירוח, אנליטיקה ותשלומים) הפועלים מטעמנו תחת אמצעי הגנה מתאימים.',
          'אנו עשויים לגלות מידע אם נידרש לכך על פי דין, צו בית משפט או דרישת רגולטור.',
        ],
      },
      {
        title: '6. שמירת נתונים',
        paragraphs: [
          'אנו שומרים מידע כל עוד נדרש לצורך מתן השירות ועמידה בחובות חוקיות.',
          'באפשרותך לבקש מחיקה של חשבון או נתונים, בכפוף לדרישות חוקיות וחוזיות.',
        ],
      },
      {
        title: '7. אבטחת מידע',
        paragraphs: [
          'אנו מיישמים אמצעי הגנה סבירים, מנהליים, טכניים וארגוניים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), תשע״ז-2017.',
          'אין שיטה בטוחה במאה אחוז; איננו יכולים להבטיח אבטחה מוחלטת.',
        ],
      },
      {
        title: '8. העברות בינלאומיות',
        paragraphs: [
          'מידע עשוי להישמר או להיות מעובד בישראל או במדינות אחרות בהן פועלים ספקי השירות שלנו.',
          'בעת העברת מידע אנו נוקטים באמצעי הגנה סבירים כנדרש על פי דין.',
        ],
      },
      {
        title: '9. זכויותיך',
        paragraphs: [
          'באפשרותך לבקש גישה, תיקון או מחיקה של מידע אישי בהתאם לחוק הישראלי.',
          'למימוש הזכויות, פנה אלינו בכתובת info@mysollo.co.',
        ],
      },
      {
        title: '10. שינויים במדיניות',
        paragraphs: [
          'אנו עשויים לעדכן מדיניות זו מעת לעת. נפרסם את העדכונים ונעדכן את תאריך "עודכן לאחרונה".',
        ],
      },
      {
        title: '11. דין וסמכות שיפוט',
        paragraphs: [
          'מדיניות זו כפופה לדיני מדינת ישראל.',
          'כל מחלוקת הקשורה למדיניות זו תהיה בסמכות השיפוט הבלעדית של בתי המשפט המוסמכים בתל אביב-יפו.',
        ],
      },
      {
        title: '12. יצירת קשר',
        paragraphs: [
          'לשאלות בנושא מדיניות פרטיות זו ניתן לפנות אלינו בדוא"ל info@mysollo.co.',
        ],
      },
    ],
  },
};

export default function PrivacyPolicy() {
  const { state } = useApp();
  const locale = state.locale || 'en';
  const isRTL = locale === 'he';
  const t = translations[locale as 'en' | 'he'];

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
