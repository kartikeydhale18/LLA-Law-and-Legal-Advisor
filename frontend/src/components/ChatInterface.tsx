"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Info, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';

import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: any;
}

interface ChatProps {
  user?: User | null;
}

export default function ChatInterface({ user }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am LLA, your legal advisor. How can I help you understand Indian law or a contract today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history: Message[] = [];
      snapshot.forEach((doc) => {
        history.push(doc.data() as Message);
      });
      if (history.length > 0) {
        setMessages(history);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const clearChat = async () => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/messages`));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(docSnap.ref);
    });
    setMessages([{
      role: 'assistant',
      content: 'Hello! I am LLA, your legal advisor. How can I help you understand Indian law or a contract today?'
    }]);
  };

  const saveMessage = async (msg: Message) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/messages`), {
      ...msg,
      createdAt: serverTimestamp()
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    if (!user) {
      setMessages(prev => [...prev, userMessage]);
    } else {
      await saveMessage(userMessage);
    }
    
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const namespace = user ? user.uid : "test_user_123";
      
      const response = await axios.post(`${apiUrl}/api/chat`, {
        query: userMessage.content,
        use_rag: true,
        namespace: namespace
      });
      
      const aiMessage: Message = { role: 'assistant', content: response.data.answer };
      if (!user) {
        setMessages(prev => [...prev, aiMessage]);
      } else {
        await saveMessage(aiMessage);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error.response?.data?.detail 
        ? `Error: ${error.response.data.detail}` 
        : 'I encountered an error connecting to the server. Please try again later.';
      const errMessage: Message = { role: 'assistant', content: errorMsg };
      if (!user) {
        setMessages(prev => [...prev, errMessage]);
      } else {
        await saveMessage(errMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 gap-4">
      {/* Disclaimer and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="glassmorphism p-3 rounded-lg flex items-start gap-3 text-sm text-amber-700 dark:text-amber-300 flex-1">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Disclaimer:</strong> LLA is an AI assistant to help you understand legal concepts. 
            It is <strong>not a substitute for a licensed advocate</strong>. 
            For high-risk or complex legal matters, please consult a professional lawyer.
          </p>
        </div>
        {user && (
          <button 
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 glassmorphism rounded-2xl p-4 overflow-y-auto flex flex-col gap-4 shadow-sm min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex w-full",
            msg.role === 'user' ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-br-sm" 
                : "glassmorphism rounded-bl-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glassmorphism p-4 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.3s]" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.5s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about a contract or Indian law..."
          className="w-full glassmorphism rounded-full px-6 py-4 pr-16 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          aria-label="Chat input"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="w-5 h-5 ml-1 mb-1 transform translate-y-0.5 -translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
