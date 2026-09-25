"use client";

import { useState, useEffect } from "react";
import ChatInterface from '@/components/ChatInterface';
import UploadDocument from '@/components/UploadDocument';
import AuthModal from '@/components/AuthModal';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
            LLA <span className="font-medium text-slate-500 dark:text-slate-400">| Legal Advisor</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-6 bg-slate-800 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden sm:inline-block">{user.email}</span>
              <button 
                onClick={() => signOut(auth)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Login
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
                <h2 className="text-xl font-semibold mb-2">Welcome to LLA</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Upload a contract or agreement to get a plain-language explanation and fair legal guidance.
                </p>
                <UploadDocument user={user} />
              </div>
            </div>

            {/* Right Column: Chat */}
            <div className="lg:col-span-8 h-full bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
              <ChatInterface user={user} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-4xl font-bold mb-8 shadow-lg shadow-blue-500/30">
              L
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              Your AI Legal Advisor.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              Understand complex Indian laws and contracts in simple, plain language. 
              Upload documents, check for fairness, and get instant answers backed by actual legal code.
            </p>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all hover:scale-105 hover:shadow-xl shadow-blue-600/20"
            >
              Log in to get started
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
