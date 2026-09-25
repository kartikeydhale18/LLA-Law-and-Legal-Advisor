"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Globe } from "lucide-react";
import ChatInterface from '@/components/ChatInterface';
import UploadDocument from '@/components/UploadDocument';
import AuthModal from '@/components/AuthModal';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { translations } from '@/lib/i18n';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [language, setLanguage] = useState<'EN'|'HI'>('EN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const t = translations[language];

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 font-[family-name:var(--font-sans)] flex flex-col">
      {/* Header */}
      <header className="w-full glassmorphism sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">L</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            LLA <span className="font-medium text-slate-500 dark:text-slate-400">| {t.title}</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Settings / Preferences */}
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 flex items-center gap-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Change Language"
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs font-medium uppercase hidden sm:block">{language}</span>
              </button>
              
              {/* Language Dropdown */}
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                  <button 
                    onClick={() => { setLanguage('EN'); setShowLangMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${language === 'EN' ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => { setLanguage('HI'); setShowLangMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${language === 'HI' ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    Hindi (हिंदी)
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="w-20 h-6 bg-slate-800 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:inline-block">{user.email}</span>
              <button 
                onClick={() => signOut(auth)}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t.logIn}
            </button>
          )}
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : user ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
            {/* Left Column: Context / Upload */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="glassmorphism p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold mb-2">{t.welcome}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {t.uploadDesc}
                </p>
                <UploadDocument user={user} language={language} />
              </div>
            </div>

            {/* Right Column: Chat */}
            <div className="lg:col-span-8 h-full bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
              <ChatInterface user={user} language={language} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-4xl font-bold mb-8 shadow-lg shadow-blue-500/30">
              L
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              {t.landingTitle}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              {t.landingDesc}
            </p>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all hover:scale-105 hover:shadow-xl shadow-blue-600/20"
            >
              {t.landingBtn}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
