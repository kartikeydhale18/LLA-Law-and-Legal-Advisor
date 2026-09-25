"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, Trash2 } from 'lucide-react';
import { translations } from '@/lib/i18n';
import { User } from 'firebase/auth';

interface ChatSidebarProps {
  user?: User | null;
  language?: 'EN' | 'HI';
}

export default function ChatSidebar({ user, language = 'EN' }: ChatSidebarProps) {
  const t = translations[language];
  const [sessions, setSessions] = useState([
    { id: '1', title: language === 'HI' ? 'वर्तमान चैट' : 'Current Chat', date: 'Today' }
  ]);

  return (
    <div className="w-full h-full glassmorphism rounded-2xl p-4 shadow-sm flex flex-col gap-4">
      <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all font-medium">
        <Plus className="w-5 h-5" />
        {language === 'HI' ? "नई चैट" : "New Chat"}
      </button>

      <div className="flex-1 overflow-y-auto mt-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
          {language === 'HI' ? "हाल का" : "Recent"}
        </h3>
        
        <div className="flex flex-col gap-1">
          {sessions.map((session) => (
            <button 
              key={session.id}
              className="flex items-center gap-3 w-full p-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-left border border-slate-200 dark:border-slate-700"
            >
              <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="truncate flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {session.id === '1' ? (language === 'HI' ? 'वर्तमान चैट' : 'Current Chat') : session.title}
                </p>
                <p className="text-xs text-slate-500">{session.date}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
