import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Footer } from '../components/layout/Footer';

const enTranslations = {
    title: 'Terms of Service',
    lastUpdated: 'Last updated: Feb 2, 2026',
    back: 'Back to Home',
    intro: 'These Terms of Service (the "Terms") govern your access to and use of the MySollo CRM platform and related services (the "Service"). By using the Service, you agree to these Terms.',
    sections: [
      {
        title: '1. The Service',
        paragraphs: [
          'MySollo provides a cloud-based CRM and business management platform, including customer management, time tracking, tasks, projects, and analytics.',
          'We may modify, update, or discontinue features at any time, and we will strive to provide reasonable notice of material changes.',
        ],
      },
      {
        title: '2. Eligibility and Account Registration',
        paragraphs: [
          'You must be at least 18 years old (or the legal age of majority in your jurisdiction) to use the Service.',
          'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
        ],
      },
      {
        title: '3. Subscription, Fees, and Payments',
        paragraphs: [
          'Some features require a paid subscription. Pricing and billing terms are presented at the time of purchase.',
          'Payments are processed through third-party payment providers. You authorize us to charge the applicable fees and taxes.',
        ],
      },
      {
        title: '4. Acceptable Use',
        paragraphs: [
          'You agree not to misuse the Service, including by interfering with its operation, attempting unauthorized access, or using it for unlawful purposes.',
          'You are responsible for the data you input into the Service and for ensuring you have all necessary rights to use that data.',
        ],
      },
      {
        title: '5. Intellectual Property',
        paragraphs: [
          'The Service, including software, design, and content, is owned by MySollo or its licensors and protected by intellectual property laws.',
          'We grant you a limited, non-exclusive, non-transferable right to use the Service for your internal business purposes.',
        ],
      },
      {
        title: '6. Privacy and Data',
        paragraphs: [
          'Our Privacy Policy explains how we collect and process personal data. By using the Service, you consent to those practices.',
          'You remain the controller of your customer data. We act as a service provider/processor as described in the Privacy Policy.',
        ],
      },
      {
        title: '7. Termination',
        paragraphs: [
          'You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms or the law.',
          'Upon termination, your right to use the Service ceases, and we may delete or anonymize your data in accordance with the Privacy Policy.',
        ],
      },
      {
        title: '8. Disclaimers',
        paragraphs: [
          'The Service is provided "as is" and "as available" without warranties of any kind, to the fullest extent permitted by law.',
          'We do not guarantee uninterrupted or error-free operation, or that the Service will meet all of your requirements.',
        ],
      },
      {
        title: '9. Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by law, MySollo will not be liable for indirect, incidental, special, or consequential damages.',
          'Our total liability for any claim relating to the Service will not exceed the amounts paid by you to MySollo in the 12 months before the event giving rise to the claim.',
        ],
      },
      {
        title: '10. Changes to These Terms',
        paragraphs: [
          'We may update these Terms from time to time. We will post the updated version and update the "Last updated" date.',
        ],
      },
      {
        title: '11. Governing Law and Jurisdiction',
        paragraphs: [
          'These Terms are governed by the laws of the State of Israel, without regard to conflict-of-law principles.',
          'Any disputes arising out of or relating to these Terms will be subject to the exclusive jurisdiction of the competent courts in Tel Aviv-Yafo, Israel.',
        ],
      },
      {
        title: '12. Contact',
        paragraphs: [
          'If you have questions about these Terms, contact us at info@mysollo.co.',
        ],
      },
    ],
};

const translations = {
  en: enTranslations,
  he: {
    title: 'תנאי שירות',
    lastUpdated: 'עודכן לאחרונה: 2 בפברואר 2026',
    back: 'חזרה לעמוד הבית',
    intro: 'תנאי שירות אלה ("התנאים") מסדירים את הגישה והשימוש שלך בפלטפורמת ה-CRM של MySollo ובשירותים הנלווים ("השירות"). באמצעות השימוש בשירות אתה מסכים לתנאים אלה.',
    sections: [
      {
        title: '1. השירות',
        paragraphs: [
          'MySollo מספקת פלטפורמת CRM וניהול עסקי מבוססת ענן, כולל ניהול לקוחות, מעקב זמן, משימות, פרויקטים ואנליטיקה.',
          'אנו רשאים לעדכן, לשנות או להפסיק תכונות מעת לעת, ונעשה מאמץ סביר להודיע על שינויים מהותיים.',
        ],
      },
      {
        title: '2. זכאות ופתיחת חשבון',
        paragraphs: [
          'עליך להיות בן 18 לפחות (או בגיל הבגירות המשפטית במדינתך) כדי להשתמש בשירות.',
          'אתה אחראי לשמירת סודיות פרטי הגישה לחשבון ולכל פעילות המתבצעת בחשבון שלך.',
        ],
      },
      {
        title: '3. מנוי, תשלומים וחיובים',
        paragraphs: [
          'חלק מהתכונות דורשות מנוי בתשלום. מחירים ותנאי חיוב מוצגים בעת הרכישה.',
          'התשלומים מתבצעים באמצעות ספקי תשלום צד שלישי. אתה מאשר לנו לחייב את הסכומים החלים ומסים רלוונטיים.',
        ],
      },
      {
        title: '4. שימוש מותר',
        paragraphs: [
          'אתה מתחייב לא לעשות שימוש לרעה בשירות, לרבות הפרעה לפעולתו, ניסיון לגישה בלתי מורשית או שימוש לצרכים בלתי חוקיים.',
          'אתה אחראי לנתונים שאתה מזין לשירות ולוודא שיש לך את כל הזכויות הנדרשות לשימוש בנתונים אלה.',
        ],
      },
      {
        title: '5. קניין רוחני',
        paragraphs: [
          'השירות, לרבות תוכנה, עיצוב ותכנים, הוא בבעלות MySollo או מעניקי רישיון שלה ומוגן בדיני קניין רוחני.',
          'אנו מעניקים לך רישיון מוגבל, לא בלעדי ולא ניתן להעברה, להשתמש בשירות לצרכיך העסקיים הפנימיים.',
        ],
      },
      {
        title: '6. פרטיות ונתונים',
        paragraphs: [
          'מדיניות הפרטיות שלנו מסבירה כיצד אנו אוספים ומעבדים מידע אישי. בשימושך בשירות אתה מסכים לפרקטיקות אלה.',
          'אתה נותר הבקר של נתוני הלקוחות שלך. אנו פועלים כספק שירות/מעבד בהתאם למדיניות הפרטיות.',
        ],
      },
      {
        title: '7. סיום',
        paragraphs: [
          'באפשרותך להפסיק להשתמש בשירות בכל עת. אנו רשאים להשעות או לסיים גישה במקרה של הפרת תנאים או חוק.',
          'עם סיום, זכותך להשתמש בשירות תיפסק, ונוכל למחוק או לאנונימיזציה של הנתונים בהתאם למדיניות הפרטיות.',
        ],
      },
      {
        title: '8. הצהרות אחריות',
        paragraphs: [
          'השירות מסופק "כמות שהוא" ו"כפוף לזמינות" ללא אחריות מכל סוג, במידה המותרת על פי דין.',
          'איננו מתחייבים לפעילות רציפה או נטולת שגיאות, או לכך שהשירות יענה על כל דרישותיך.',
        ],
      },
      {
        title: '9. הגבלת אחריות',
        paragraphs: [
          'במידה המרבית המותרת על פי דין, MySollo לא תישא באחריות לנזקים עקיפים, מקריים, מיוחדים או תוצאתיים.',
          'האחריות הכוללת שלנו לכל תביעה הקשורה לשירות לא תעלה על הסכומים ששילמת ל-MySollo ב-12 החודשים שקדמו לאירוע נשוא התביעה.',
        ],
      },
      {
        title: '10. שינויים בתנאים',
        paragraphs: [
          'אנו עשויים לעדכן תנאים אלה מעת לעת. נפרסם את הגרסה המעודכנת ונעדכן את תאריך "עודכן לאחרונה".',
        ],
      },
      {
        title: '11. דין וסמכות שיפוט',
        paragraphs: [
          'תנאים אלה כפופים לדיני מדינת ישראל, ללא תחולה לעקרונות ברירת דין.',
          'כל מחלוקת הנובעת מתנאים אלה או קשורה אליהם תהיה בסמכות השיפוט הבלעדית של בתי המשפט המוסמכים בתל אביב-יפו.',
        ],
      },
      {
        title: '12. יצירת קשר',
        paragraphs: [
          'לשאלות לגבי תנאים אלה, ניתן לפנות אלינו בדוא"ל info@mysollo.co.',
        ],
      },
    ],
  },
  es: enTranslations,
  de: enTranslations,
  pt: enTranslations,
};

export default function TermsOfService() {
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
