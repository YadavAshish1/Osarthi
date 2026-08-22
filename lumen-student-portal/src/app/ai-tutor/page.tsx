'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Send, Loader2, Plus, MessageSquare,
  BookOpen, HelpCircle, FileText, CheckCircle2, Copy, ChevronDown,
  ArrowLeft, RotateCcw, AlertTriangle, Cpu, Trash2, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ChatMessage {
  id?: number | string;
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date | string;
  streaming?: boolean;
  isError?: boolean;
  retryPrompt?: string;
}

const CHAT_STORAGE_KEY = 'medhashine_ai_tutor_chat_history_v1';

export default function FullAiTutorPage() {
  const { user, openAuth } = useAuth();
  const router = useRouter();

  // Chat State with LocalStorage Sync (popup & page share conversation)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [defaultModelId, setDefaultModelId] = useState<string>('azure_openai');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load chat history from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.map((m: any) => ({ ...m, streaming: false })));
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync chat history to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (messages.length > 0) {
        const cleanMsgs = messages.map((m) => ({ ...m, streaming: false }));
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleanMsgs));
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to sync chat history:', e);
    }
  }, [messages, isLoaded]);

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CHAT_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setMessages(parsed.map((m: any) => ({ ...m, streaming: false })));
            }
          } catch { }
        } else {
          setMessages([]);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch dynamic models list
  const fetchModels = useCallback(async () => {
    try {
      const res = await api.get('/ai/models');
      if (res.data?.providers) {
        setAvailableModels(res.data.providers);
      }
      if (res.data?.default) {
        setDefaultModelId(res.data.default);
      }
    } catch (err) {
      console.warn('Failed to load models list:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchModels();
    }
  }, [user, fetchModels]);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch { }
  };

  const sendMessage = async (textToSend: string, isRetry: boolean = false) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isStreaming) return;

    if (!user) {
      openAuth('login');
      return;
    }

    let historySnapshot = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (isRetry) {
      setMessages((prev) => prev.filter((m) => !m.isError));
    } else {
      const userMsg: ChatMessage = { role: 'user', content: cleanText, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
    }

    setInput('');
    setIsStreaming(true);

    const aiMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'ai', content: '', streaming: true, retryPrompt: cleanText },
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: cleanText,
          history: historySnapshot,
          model_provider: selectedModel,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.token) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId ? { ...m, content: m.content + data.token } : m
                    )
                  );
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e: any) {
                if (e.message && !line.includes('"token"')) {
                  throw e;
                }
              }
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === aiMsgId) {
            const isErr = m.content.startsWith('❌ Agent Error:') || m.content.includes('503 UNAVAILABLE');
            return { ...m, streaming: false, isError: isErr };
          }
          return m;
        })
      );
    } catch (err: any) {
      const errText = err.message || 'Something went wrong while generating the response.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
              ...m,
              content: errText,
              streaming: false,
              isError: true,
              retryPrompt: cleanText,
            }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestedCards = [
    {
      icon: FileText,
      tag: 'Summary',
      title: 'Chapter & Lesson Summary',
      prompt: 'Mujhe is chapter ke sabhi lesson blogs ki complete summary, key definitions, formulas aur core takeaways structured bullet points me provide karo.',
    },
    {
      icon: HelpCircle,
      tag: 'Exam Q&A',
      title: 'Important Question & Answers',
      prompt: 'Is chapter ke 10 most important conceptual aur exam-oriented Question-Answers step-by-step reasoning ke sath likho.',
    },
    {
      icon: BookOpen,
      tag: 'Practice',
      title: 'Interactive MCQ Quiz',
      prompt: 'Is chapter se 5 challenging Multiple Choice Questions (MCQs) banao options aur correct answer explanation ke sath.',
    },
    {
      icon: Sparkles,
      tag: 'Concept',
      title: 'Simplify Tough Concept',
      prompt: 'Is topic ke sabse mushkil concept ko intuitive real-world analogies aur simple diagrams ke explanation ke sath samjhao.',
    },
  ];

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1A1A1A]">$1</strong>');
      processed = processed.replace(/\*([^*]+)\*/g, '<em class="italic text-[#5C5A55]">$1</em>');
      processed = processed.replace(/`([^`]+)`/g, '<code class="bg-[#A84C32]/8 text-[#A84C32] px-1.5 py-0.5 rounded text-xs font-mono border border-[#A84C32]/15">$1</code>');

      // Markdown links: [text](url) -> <a href="url" target="_blank" rel="noopener noreferrer">
      processed = processed.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-bold text-[#A84C32] hover:text-[#8C3A27] hover:underline underline-offset-3 decoration-[#A84C32]/50 transition-colors cursor-pointer bg-[#A84C32]/8 hover:bg-[#A84C32]/15 px-2 py-0.5 rounded-lg text-xs mx-0.5">$1 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline shrink-0 opacity-75"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>'
      );

      if (processed.startsWith('### ')) {
        return <h4 key={i} className="font-bold text-[#1A1A1A] text-base mt-4 mb-1.5 font-serif-body" dangerouslySetInnerHTML={{ __html: processed.replace('### ', '') }} />;
      }
      if (processed.startsWith('## ')) {
        return <h3 key={i} className="font-extrabold text-[#A84C32] text-lg mt-5 mb-2 border-b border-[#E5E1D8] pb-1 font-serif-display" dangerouslySetInnerHTML={{ __html: processed.replace('## ', '') }} />;
      }
      if (processed.startsWith('# ')) {
        return <h2 key={i} className="font-black text-xl text-[#1A1A1A] mt-6 mb-3 font-serif-display" dangerouslySetInnerHTML={{ __html: processed.replace('# ', '') }} />;
      }
      if (processed.startsWith('  •') || processed.startsWith('  -') || processed.startsWith('• ') || processed.startsWith('- ')) {
        return <p key={i} className="ml-4 text-sm text-[#3D3B36] leading-relaxed my-1 font-ui" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (processed.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-3 border-[#A84C32] pl-3 my-2 text-sm italic text-[#5C5A55] bg-[#A84C32]/5 py-1.5 rounded-r-md">
            <span dangerouslySetInnerHTML={{ __html: processed.replace('> ', '') }} />
          </blockquote>
        );
      }
      return <p key={i} className="text-sm text-[#3D3B36] leading-relaxed my-1.5 font-ui" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-[#FAF8F5] text-[#1A1A1A] font-serif-body overflow-hidden">
      {/* ─── MAIN CHAT AREA (FOCUSED & CENTERED) ─── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF8F5] relative">
        {/* Top Bar */}
        <header className="h-13 px-4 sm:px-6 border-b border-[#E5E1D8] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-[#5C5A55] hover:text-[#A84C32] transition-colors font-ui"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>

            <div className="h-4 w-px bg-[#E5E1D8] mx-1" />

            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#A84C32] to-[#C4623E] flex items-center justify-center shadow-sm">
                <GraduationCap size={18} className="text-white" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-2xs">
                  <Sparkles size={8} className="text-amber-950 fill-amber-950" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-[#1A1A1A] text-xs sm:text-sm tracking-tight font-ui">
                  AI Study Copilot
                </h1>
              </div>
            </div>
          </div>

          {/* Controls: Model Selector + Clear Chat */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EDE8] border border-[#E5E1D8] text-xs font-semibold text-[#3D3B36] hover:text-[#1A1A1A] hover:bg-[#E8E4DD] transition-all cursor-pointer font-ui shadow-2xs"
              >
                <Cpu size={13} className="text-[#A84C32]" />
                <span>
                  {(() => {
                    if (!selectedModel) {
                      const defName = availableModels.find((m) => m.id === defaultModelId)?.name ||
                        (defaultModelId === 'azure_openai' ? 'Azure OpenAI' : defaultModelId === 'gemini' ? 'Google Gemini' : 'OpenAI');
                      return `${defName} (Default)`;
                    }
                    const match = availableModels.find((m) => m.id === selectedModel);
                    return match ? match.name : selectedModel;
                  })()}
                </span>
                <ChevronDown size={13} />
              </button>

              {showModelMenu && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E5E1D8] rounded-2xl shadow-xl overflow-hidden z-50 p-1.5">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8A8580] border-b border-[#E5E1D8]/60 mb-1">
                    AI Execution Engine
                  </div>

                  <button
                    onClick={() => {
                      setSelectedModel(null);
                      setShowModelMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex flex-col font-ui mb-1 ${selectedModel === null
                        ? 'bg-[#A84C32]/10 text-[#A84C32] font-bold'
                        : 'text-[#3D3B36] hover:bg-[#F0EDE8]'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Auto-Failover Chain</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-800">
                        Default
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8A8580] mt-0.5">
                      Starts with {defaultModelId === 'azure_openai' ? 'Azure OpenAI' : defaultModelId === 'gemini' ? 'Google Gemini' : 'OpenAI'} & auto-cascades
                    </span>
                  </button>

                  {(availableModels.length > 0
                    ? availableModels
                    : [
                      { id: 'azure_openai', name: 'Azure OpenAI', desc: 'Enterprise cloud LLM' },
                      { id: 'gemini', name: 'Google Gemini (Flash)', desc: 'Fast multimodal assistant' },
                      { id: 'openai', name: 'OpenAI Direct (GPT-4o)', desc: 'Direct OpenAI gateway' },
                    ]
                  ).map((m) => {
                    const isSelected = selectedModel === m.id;
                    const isDefault = defaultModelId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setShowModelMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex flex-col font-ui ${isSelected
                            ? 'bg-[#A84C32]/10 text-[#A84C32] font-bold'
                            : 'text-[#3D3B36] hover:bg-[#F0EDE8]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{m.name}</span>
                          {isDefault && (
                            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                              System Default
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8A8580]">
                          {m.desc || (m.id === 'azure_openai' ? 'Enterprise cloud LLM' : m.id === 'gemini' ? 'Google DeepMind models' : 'Direct API gateway')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* New Chat Button */}
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A84C32] hover:bg-[#8C3A27] text-white text-xs font-bold font-ui transition-all cursor-pointer shadow-xs"
              title="Start a fresh conversation"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* ─── MESSAGES CONTAINER ─── */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-3xl w-full mx-auto"
          style={{ scrollbarColor: 'rgba(168,76,50,0.15) transparent' }}
        >
          {/* Friendly Sign-In Banner inside Agent */}
          {!user && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A] font-ui">Sign in to use AI Tutor</h4>
                  <p className="text-xs text-[#5C5A55] font-ui">Sign in or create a student account to get instant answers, summaries & practice questions.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => openAuth('login')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#A84C32] hover:bg-[#8C3A27] text-white font-ui font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white border border-[#E5E1D8] hover:bg-[#F0EDE8] text-[#1A1A1A] font-ui font-bold text-xs transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* Welcome Screen */}
          {messages.length === 0 && (
            <div className="py-12 sm:py-20 text-center">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#A84C32] to-[#C4623E] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#A84C32]/15">
                <GraduationCap size={32} className="text-white" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm">
                  <Sparkles size={12} className="text-amber-950 fill-amber-950" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mb-2 font-serif-display">
                What would you like to learn today?
              </h2>
              <p className="text-sm text-[#5C5A55] max-w-md mx-auto mb-8 leading-relaxed font-ui">
                Your personal AI Study Copilot powered by Medhashine curriculum blogs, notes, and question banks.
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
                {suggestedCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendMessage(card.prompt)}
                      className="p-4 rounded-2xl bg-white border border-[#E5E1D8] hover:border-[#A84C32]/40 hover:shadow-md transition-all cursor-pointer group text-left flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-[#A84C32] text-xs font-bold font-ui">
                            <Icon size={16} className="group-hover:scale-110 transition-transform" />
                            <span>{card.title}</span>
                          </div>
                          <span className="eyebrow text-[9px] px-1.5 py-0.5 rounded bg-[#F0EDE8] text-[#8A8580]">
                            {card.tag}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C5A55] line-clamp-2 leading-relaxed font-ui">
                          {card.prompt}
                        </p>
                      </div>
                      <div className="text-[11px] font-semibold text-[#A84C32]/70 group-hover:text-[#A84C32] mt-3 flex items-center gap-1 font-ui">
                        <span>Ask this</span>
                        <span>→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {msg.role === 'ai' && (
                <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1 ${msg.isError ? 'bg-amber-600 text-white' : 'bg-gradient-to-br from-[#A84C32] to-[#C4623E] text-white'
                  }`}>
                  {msg.isError ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <>
                      <GraduationCap size={16} className="text-white" />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                    </>
                  )}
                </div>
              )}

              <div
                className={`relative group max-w-[88%] sm:max-w-[80%] rounded-2xl px-5 py-4 ${msg.role === 'user'
                    ? 'bg-[#A84C32] text-white rounded-br-sm shadow-sm'
                    : msg.isError
                      ? 'bg-amber-500/10 border border-amber-500/30 text-[#1A1A1A] rounded-bl-sm shadow-sm'
                      : 'bg-white border border-[#E5E1D8] text-[#1A1A1A] rounded-bl-sm shadow-sm'
                  }`}
              >
                {msg.role === 'ai' ? (
                  <div>
                    {msg.isError ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs font-ui">
                          <AlertTriangle size={14} className="text-amber-700" />
                          <span>Temporary AI Service Issue</span>
                        </div>
                        <p className="text-xs text-amber-900 leading-relaxed font-ui whitespace-pre-wrap">
                          {msg.content.replace(/^❌ (Agent Error:\s*)?/, '') || 'The model encountered high demand or a temporary delay.'}
                        </p>
                        {msg.retryPrompt && (
                          <div className="pt-2 border-t border-amber-500/20">
                            <button
                              onClick={() => sendMessage(msg.retryPrompt!, true)}
                              disabled={isStreaming}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A84C32] text-white text-xs font-bold font-ui hover:bg-[#8C3A27] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <RotateCcw size={13} className={isStreaming ? 'animate-spin' : ''} />
                              <span>Retry Question</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {renderMarkdown(msg.content)}
                        {msg.streaming && (
                          <span className="inline-block w-2 h-4 bg-[#A84C32] rounded-xs animate-pulse ml-1 align-middle" />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-ui">{msg.content}</p>
                )}

                {/* AI Message Footer */}
                {msg.role === 'ai' && !msg.streaming && !msg.isError && msg.content && (
                  <div className="mt-3 pt-2.5 border-t border-[#E5E1D8] flex items-center justify-between text-xs text-[#8A8580] font-ui">
                    <span className="text-[11px]">Verified Curriculum Assistant</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0EDE8] hover:bg-[#E8E4DD] hover:text-[#1A1A1A] transition-colors cursor-pointer text-xs"
                        title="Copy response"
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#F0EDE8] border border-[#E5E1D8] flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-[#A84C32] font-ui">You</span>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── CHAT INPUT BAR ─── */}
        <div className="p-3 sm:p-4 bg-transparent shrink-0 z-20">
          <div className="max-w-3xl mx-auto">
            {!user ? (
              <div 
                onClick={() => openAuth('login')}
                className="flex items-center justify-between rounded-2xl bg-white border border-[#E5E1D8] px-4 py-3 cursor-pointer hover:border-[#A84C32]/40 transition-colors shadow-md shadow-black/5 group"
              >
                <span className="text-sm text-[#8A8580] group-hover:text-[#1A1A1A] transition-colors font-ui">
                  Sign in to use AI Tutor...
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openAuth('login'); }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#A84C32] hover:bg-[#8C3A27] text-white text-xs font-bold font-ui transition-colors cursor-pointer shadow-2xs"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openAuth('register'); }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F0EDE8] hover:bg-[#E8E4DD] text-[#1A1A1A] text-xs font-bold font-ui transition-colors cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative flex items-end rounded-2xl bg-white border border-[#E5E1D8] focus-within:border-[#A84C32] focus-within:ring-2 focus-within:ring-[#A84C32]/10 transition-all p-1.5 shadow-md shadow-black/5">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about any chapter, concept, doubt, or quiz..."
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 bg-transparent border-0 resize-none px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#8A8580] focus:ring-0 focus:outline-none max-h-40 min-h-[44px] font-ui"
                />

                <div className="flex items-center gap-1.5 p-1 shrink-0">
                  {messages.length > 0 && (
                    <button
                      onClick={startNewChat}
                      className="p-2 rounded-xl text-[#8A8580] hover:text-[#A84C32] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
                      title="Clear Chat"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isStreaming}
                    className="w-9 h-9 rounded-xl bg-[#A84C32] hover:bg-[#8C3A27] disabled:opacity-40 disabled:hover:bg-[#A84C32] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    {isStreaming ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={15} className="translate-x-0.5 -translate-y-0.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="text-[11px] text-[#8A8580] px-2 pt-1.5 font-ui text-center sm:text-left">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#F0EDE8] border border-[#E5E1D8] text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-[#F0EDE8] border border-[#E5E1D8] text-[10px] font-mono">Shift+Enter</kbd> for new line</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
