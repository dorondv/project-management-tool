import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, Users, BarChart3, CheckCircle, Home, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import toast from 'react-hot-toast';

const translations = {
  en: {
    welcome: 'Welcome to SOLLO',
    subtitle: 'The smart way to manage your time, clients, tasks, and even accounting in one place. Start working smarter, not harder.',
    startTrial: 'Start 7-Day Free Trial',
    existingCustomer: 'Login for existing customers',
    seeHowItWorks: 'See how it works',
    allInOne: 'Everything you need in one place',
    smartTimeTracking: 'Smart Time Tracking',
    smartTimeTrackingDesc: 'Track every minute, for every client, in every project. Accurate and simple tracking that saves you time and helps you manage it smarter',
    clientManagement: 'Client Management',
    clientManagementDesc: 'Discover your most profitable clients using a smart rating system and grow your business intelligently',
    taskManagement: 'Task Management',
    taskManagementDesc: 'Manage your tasks simply and efficiently while accurately and effectively measuring your work time on each task',
    whySollo: 'Why SOLLO?',
    convenience: 'Convenience - Everything in one place',
    convenienceDesc: 'Manage all your business tasks in one place instead of multiple separate tools',
    saveCosts: 'Save on costs',
    saveCostsDesc: 'Instead of paying for multiple tools, pay for one. Get more, pay less',
    efficiency: 'Efficiency - Work smarter and more efficiently',
    efficiencyDesc: 'Manage your time better, invest in the right places and grow correctly',
    videoNote: 'You can replace the video with your own marketing video from YouTube or Vimeo.',
    logout: 'Logout',
  },
  he: {
    welcome: 'ברוכים הבאים ל- SOLLO',
    subtitle: 'הדרך החכמה לנהל את הזמן, הלקוחות והמשימות שלכם ואפילו את הנהלת החשבונות במקום אחד. התחילו לעבוד חכם יותר, לא קשה יותר.',
    startTrial: 'התחל 7 ימי ניסיון חינם',
    existingCustomer: 'כניסה ללקוחות קיימים',
    seeHowItWorks: 'ראו איך זה עובד',
    allInOne: 'כל מה שאתם צריכים במקום אחד',
    smartTimeTracking: 'מעקב זמן חכם',
    smartTimeTrackingDesc: 'מדדו כל דקה, לכל לקוח, בכל פרויקט. מעקב מדויק ופשוט שחוסך לכם זמן ומאפשר לכם לנהל אותו חכם יותר',
    clientManagement: 'ניהול לקוחות',
    clientManagementDesc: 'גלו מיהם הלקוחות הריווחיים ביותר שלכם באמצעות שיטת דירוג חכמה והצמיחו את העסק בחכמה',
    taskManagement: 'ניהול משימות',
    taskManagementDesc: 'נהלו את המשימות שלכם בפשטות ויעילות תוך מדידה מדויקת ואפקטיבית של זמן העבודה שלכם על כל משימה',
    whySollo: 'למה SOLLO?',
    convenience: 'נוחות - הכל במקום אחד',
    convenienceDesc: 'נהלו את כל מטלות העסק שלכם במקום אחד במקום במספר כלים נפרדים',
    saveCosts: 'חסכו בעלויות',
    saveCostsDesc: 'במקום לשלם על מספר כלים, שלמו על כלי אחד. קבלו יותר, שלמו פחות',
    efficiency: 'יעילות- עבדו חכם ויעיל יותר',
    efficiencyDesc: 'נהלו את הזמן שלכם טוב יותר, תשקיעו במקומות שצריך ותצמחו נכון',
    videoNote: 'ניתן להחליף את הסרטון לסרטון שיווקי משלכם מ-YouTube או Vimeo.',
    logout: 'התנתקות',
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const locale = state.locale || 'en';
  const isRTL = locale === 'he';
  const t = translations[locale as 'en' | 'he'];

  const handleStartTrial = () => {
    navigate('/pricing');
  };

  const handleLogin = () => {
    // If user is already logged in, go to dashboard
    // Otherwise, this would redirect to login (handled by App.tsx)
    if (state.user) {
      navigate('/');
    }
  };

  const handleHomeClick = () => {
    if (state.user) {
      // If user is logged in, go to dashboard (or landing if no subscription)
      navigate('/');
    } else {
      // If not logged in, stay on landing or go to auth
      navigate('/');
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success(locale === 'he' ? 'התנתקת בהצלחה' : 'Logged out successfully');
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Home Button */}
      <button
        onClick={handleHomeClick}
        className={`fixed ${isRTL ? 'top-6 right-6' : 'top-6 left-6'} z-50 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700`}
        aria-label="Home"
      >
        <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Logout Button - Only show if user is logged in */}
      {state.user && (
        <button
          onClick={handleLogout}
          className={`fixed ${isRTL ? 'top-6 left-6' : 'top-6 right-6'} z-50 p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700 group`}
          aria-label={t.logout}
          title={t.logout}
        >
          <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
        </button>
      )}

      <div className="container mx-auto px-6 py-12 text-center">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/assets/png/sollo Inverted Color Transparent bg.svg"
              alt="SOLLO Logo"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== `${window.location.origin}/assets/png/solo logo wide.png`) {
                  target.src = '/assets/png/solo logo wide.png';
                }
              }}
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
            {t.welcome}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </motion.header>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center justify-center gap-4 mb-16"
        >
          <div className="text-center">
            <Button
              onClick={handleStartTrial}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg text-lg px-8 py-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              {t.startTrial}
            </Button>
            <div className="mt-4">
              <button 
                onClick={handleLogin}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-pink-600 underline"
              >
                {t.existingCustomer}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Video Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-20 text-center"
        >
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            {t.seeHowItWorks}
          </h2>
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-2xl overflow-hidden ring-4 ring-pink-500/50">
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/Gg_g-m3vOCY"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">{t.videoNote}</p>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{t.allInOne}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-lg backdrop-blur-sm border border-pink-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Timer className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">{t.smartTimeTracking}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t.smartTimeTrackingDesc}</p>
            </div>
            
            <div className="p-8 bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-lg backdrop-blur-sm border border-pink-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">{t.clientManagement}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t.clientManagementDesc}</p>
            </div>
            
            <div className="p-8 bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-lg backdrop-blur-sm border border-pink-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">{t.taskManagement}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t.taskManagementDesc}</p>
            </div>
          </div>
        </motion.section>

        {/* Why SOLLO Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">{t.whySollo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${isRTL ? 'gap-3' : 'gap-3'}`}>
                <CheckCircle className={`w-6 h-6 mt-1 flex-shrink-0 ${isRTL ? 'order-2' : ''}`} />
                <div className={isRTL ? 'text-right flex-1' : 'text-left flex-1'}>
                  <h4 className="font-semibold mb-1">{t.convenience}</h4>
                  <p className="text-pink-100">{t.convenienceDesc}</p>
                </div>
              </div>
              <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${isRTL ? 'gap-3' : 'gap-3'}`}>
                <CheckCircle className={`w-6 h-6 mt-1 flex-shrink-0 ${isRTL ? 'order-2' : ''}`} />
                <div className={isRTL ? 'text-right flex-1' : 'text-left flex-1'}>
                  <h4 className="font-semibold mb-1">{t.saveCosts}</h4>
                  <p className="text-pink-100">{t.saveCostsDesc}</p>
                </div>
              </div>
              <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${isRTL ? 'gap-3' : 'gap-3'}`}>
                <CheckCircle className={`w-6 h-6 mt-1 flex-shrink-0 ${isRTL ? 'order-2' : ''}`} />
                <div className={isRTL ? 'text-right flex-1' : 'text-left flex-1'}>
                  <h4 className="font-semibold mb-1">{t.efficiency}</h4>
                  <p className="text-pink-100">{t.efficiencyDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

