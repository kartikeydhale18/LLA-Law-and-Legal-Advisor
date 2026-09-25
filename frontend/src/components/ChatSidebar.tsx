"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, Trash2 } from 'lucide-react';
import { translations } from '@/lib/i18n';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  user?: User | null;
  language?: 'EN' | 'HI';
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({ user, language = 'EN', currentChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
  const t = translations[language];
  const [sessions, setSessions] = useState([
    { id: 'default', title: language === 'HI' ? 'वर्तमान चैट' : 'Current Chat', date: 'Today' }
  ]);

  // If currentChatId is not in the list, add it visually
  useEffect(() => {
    if (!sessions.find(s => s.id === currentChatId)) {
      setSessions([{ id: currentChatId, title: language === 'HI' ? 'नई चैट' : 'New Chat', date: 'Today' }, ...sessions]);
    }
  }, [currentChatId, sessions, language]);

  return (
    <div className="w-full h-full glassmorphism rounded-2xl p-4 shadow-sm flex flex-col gap-4">
      <button 
        onClick={onNewChat}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all font-medium"
      >
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
              onClick={() => onSelectChat(session.id)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-left border",
                currentChatId === session.id 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" 
                  : "bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              )}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="truncate flex-1">
                <p className="text-sm font-medium truncate">
                  {session.id === 'default' ? (language === 'HI' ? 'वर्तमान चैट' : 'Current Chat') : session.title}
                </p>
                <p className="text-xs opacity-70">{session.date}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
