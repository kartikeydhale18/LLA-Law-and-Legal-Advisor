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
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Context / Upload */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="glassmorphism p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Welcome to LLA</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Upload a contract or agreement to get a plain-language explanation and fair legal guidance.
            </p>
            {user ? (
              <UploadDocument />
            ) : (
              <div className="p-4 border border-dashed border-slate-700 rounded-xl text-center bg-slate-800/30">
                <p className="text-slate-400 text-sm mb-3">Log in to analyze documents.</p>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="w-full lg:w-2/3 h-[calc(100vh-140px)]">
          <ChatInterface />
        </div>

      </main>
    </div>
  );
}
