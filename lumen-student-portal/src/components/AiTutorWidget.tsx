'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles, X, Send, Loader2, Bot, Trash2, Maximize2, Minimize2,
  ExternalLink, BookOpen, HelpCircle, FileText, CheckCircle2, Copy,
  ArrowUp, RotateCcw, AlertTriangle
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function AiTutorWidget() {
  const { user, openAuth } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  // If already on the full dedicated /ai-tutor page, do not render floating widget
  if (pathname?.startsWith('/ai-tutor')) {
    return null;
  }

  const getPageContext = () => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname;
    if (path.startsWith('/blog/') || path.startsWith('/blogs/')) {
      const heading = document.querySelector('h1')?.textContent?.trim() || '';
      // Also extract class or subject badge if present
      const metaText = document.querySelector('p.eyebrow, div.eyebrow, header p')?.textContent?.trim() || '';
      return `[Context: Student is currently actively reading the Medhashine blog/lesson titled: "${heading}" ${metaText ? `(${metaText})` : ''} at URL path: "${path}". When the student says "main jo insight open kiya hun", "is blog ki", "ye lesson", "iski summary", they are referring specifically to "${heading}".]`;
    }
    return '';
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (text: string, isRetry: boolean = false) => {
    const cleanText = text.trim();
    if (!cleanText || isStreaming) return;

    if (!user) {
      openAuth('login');
      return;
    }

    if (isRetry) {
      setMessages((prev) => prev.filter((m) => !m.isError));
    } else {
      const userMsg = { role: 'user', content: cleanText, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
    }

    setInput('');
    setIsStreaming(true);

    const aiMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { role: 'ai', content: '', id: aiMsgId, streaming: true, retryPrompt: cleanText },
    ]);

    try {
      const activePageContext = getPageContext();
      const isReferringToActivePage = messages.length === 0 || /open|insight|blog|lesson|chapter|article|ye|is|iski|iska|padh|reading|summary|q&a|question|explain|batao/i.test(cleanText);
      const contextPrefix = isReferringToActivePage && activePageContext ? activePageContext : '';
      const fullMessage = contextPrefix ? `${contextPrefix}\n\n${cleanText}` : cleanText;
      const historySnapshot = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullMessage,
          history: historySnapshot,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(err.message || 'Rate limit reached. Please wait a bit before sending more messages.');
        }
        throw new Error(err.message || `Server response error (${response.status})`);
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
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: err.message || 'Temporary service issue occurred.',
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

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickPrompts = [
    { icon: FileText, label: '📖 Chapter Summary', text: 'Mujhe is chapter ke sabhi lesson blogs ki complete summary, key definitions aur formulas structured format me de do.' },
    { icon: HelpCircle, label: '❓ Question & Answers', text: 'Is chapter ke 10 important conceptual aur exam-oriented Question-Answers step-by-step reasoning ke sath do.' },
    { icon: BookOpen, label: '🎯 Practice MCQs', text: 'Is topic se 5 multiple choice practice questions banao options aur correct answer explanation ke sath.' },
    { icon: Sparkles, label: '💡 Simplify Concept', text: 'Is lesson ke main concepts ko simple real-world analogies aur diagrams ke explanation ke sath samjhao.' },
  ];

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold & Italic
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1A1A1A]">$1</strong>');
      processed = processed.replace(/\*([^*]+)\*/g, '<em class="italic text-[#5C5A55]">$1</em>');

      // Inline code
      processed = processed.replace(/`([^`]+)`/g, '<code class="bg-[#A84C32]/8 text-[#A84C32] px-1 py-0.5 rounded text-xs font-mono border border-[#A84C32]/15">$1</code>');
      
      // Markdown links: [text](url) -> <a href="url" target="_blank" rel="noopener noreferrer">
      processed = processed.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-bold text-[#A84C32] hover:text-[#8C3A27] hover:underline underline-offset-2 decoration-[#A84C32]/50 transition-colors cursor-pointer bg-[#A84C32]/8 hover:bg-[#A84C32]/15 px-1.5 py-0.5 rounded text-xs mx-0.5">$1 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline shrink-0 opacity-75"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>'
      );

      if (processed.startsWith('### ')) {
        return <h4 key={i} className="font-bold text-[#1A1A1A] text-sm mt-3 mb-1 font-serif-body" dangerouslySetInnerHTML={{ __html: processed.replace('### ', '') }} />;
      }
      if (processed.startsWith('## ')) {
        return <h3 key={i} className="font-bold text-[#A84C32] text-base mt-3 mb-1 font-serif-display" dangerouslySetInnerHTML={{ __html: processed.replace('## ', '') }} />;
      }
      if (processed.startsWith('  •') || processed.startsWith('  -') || processed.startsWith('• ') || processed.startsWith('- ')) {
        return <p key={i} className="ml-3 text-xs sm:text-sm text-[#3D3B36] leading-relaxed my-0.5 font-ui" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      return <p key={i} className="text-xs sm:text-sm text-[#3D3B36] leading-relaxed my-1 font-ui" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-[9990] flex items-center gap-2.5 px-4 py-3 sm:py-3.5 rounded-full bg-[#A84C32] text-white shadow-lg shadow-[#A84C32]/20 hover:bg-[#8C3A27] hover:scale-105 active:scale-95 transition-all cursor-pointer font-ui group border border-[#C4623E]"
          title="Open AI Study Tutor"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight">Ask AI Tutor</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`fixed z-[9999] transition-all duration-300 ease-out flex flex-col overflow-hidden bg-[#FAF8F5] text-[#1A1A1A] shadow-2xl shadow-black/15 border border-[#E5E1D8] rounded-t-3xl sm:rounded-3xl
            inset-x-0 bottom-0 top-12 sm:top-auto sm:inset-x-auto sm:bottom-6 sm:right-6
            ${isExpanded 
              ? 'sm:w-[720px] sm:h-[82vh] sm:max-h-[850px]' 
              : 'sm:w-[420px] sm:h-[600px] sm:max-h-[80vh]'
            }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-white border-b border-[#E5E1D8] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#A84C32] to-[#C4623E] flex items-center justify-center shadow-sm">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[#1A1A1A] text-sm font-ui">Medhashine AI Tutor</h3>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[#A84C32]/10 text-[#A84C32] border border-[#A84C32]/20 font-ui">
                    RAG
                  </span>
                </div>
                <p className="text-[10px] text-[#8A8580] font-ui">Curriculum-Aware Copilot</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {/* Full Page Link */}
              <Link
                href="/ai-tutor"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#8A8580] hover:text-[#A84C32] hover:bg-[#F0EDE8] transition-colors"
                title="Open Full Page"
              >
                <ExternalLink size={15} />
              </Link>

              {/* Expand / Shrink (Desktop Only) */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-[#8A8580] hover:text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
                title={isExpanded ? "Collapse view" : "Expand view"}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              {/* New Chat */}
              <button
                onClick={startNewChat}
                className="p-1.5 rounded-lg text-[#8A8580] hover:text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
                title="Clear Chat"
              >
                <Trash2 size={15} />
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#8A8580] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages View */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-[#FAF8F5]">
            {messages.length === 0 && (
              <div className="py-6 px-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#A84C32]/10 border border-[#A84C32]/15 flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={24} className="text-[#A84C32] animate-pulse" />
                </div>
                <h4 className="font-bold text-[#1A1A1A] text-base mb-1 font-serif-body">
                  How can I help you study today?
                </h4>
                <p className="text-xs text-[#8A8580] max-w-sm mx-auto mb-5 leading-relaxed font-ui">
                  Ask me for chapter summaries, practice questions, formula breakdowns, or doubt clearing!
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {quickPrompts.map(({ icon: Icon, label, text }, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(text)}
                      className="p-3 rounded-xl bg-white border border-[#E5E1D8] hover:border-[#A84C32]/40 hover:shadow-sm transition-all cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-2 text-[#A84C32] text-xs font-semibold mb-1 font-ui">
                        <Icon size={14} className="group-hover:scale-110 transition-transform" />
                        <span>{label}</span>
                      </div>
                      <p className="text-[11px] text-[#8A8580] line-clamp-2 leading-relaxed font-ui">
                        {text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`relative group max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
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
                            <AlertTriangle size={13} className="text-amber-700" />
                            <span>Service Busy / Temporary Delay</span>
                          </div>
                          <p className="text-xs text-amber-900 leading-relaxed font-ui">
                            {msg.content.replace(/^❌ (Agent Error:\s*)?/, '') || 'Model is experiencing high demand. Please retry.'}
                          </p>
                          {msg.retryPrompt && (
                            <div className="pt-2 border-t border-amber-500/20">
                              <button
                                onClick={() => sendMessage(msg.retryPrompt, true)}
                                disabled={isStreaming}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A84C32] text-white text-xs font-bold font-ui hover:bg-[#8C3A27] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <RotateCcw size={12} className={isStreaming ? 'animate-spin' : ''} />
                                <span>Retry</span>
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
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-ui">{msg.content}</p>
                  )}

                  {/* Copy & Retry Button on AI response */}
                  {msg.role === 'ai' && !msg.streaming && !msg.isError && msg.content && (
                    <div className="mt-2 pt-2 border-t border-[#E5E1D8] flex items-center justify-between text-[10px] text-[#8A8580] font-ui">
                      <span>Medhashine Study Tutor</span>
                      <div className="flex items-center gap-1.5">
                        {msg.retryPrompt && (
                          <button
                            onClick={() => sendMessage(msg.retryPrompt, true)}
                            disabled={isStreaming}
                            className="flex items-center gap-1 text-[#8A8580] hover:text-[#A84C32] transition-colors cursor-pointer"
                            title="Regenerate answer"
                          >
                            <RotateCcw size={11} />
                            <span>Retry</span>
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id || idx)}
                          className="flex items-center gap-1 text-[#8A8580] hover:text-[#A84C32] transition-colors cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedId === (msg.id || idx) ? (
                            <>
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Footer */}
          <div className="px-3 pb-3 pt-2 bg-gradient-to-t from-[#FAF8F5] to-transparent shrink-0">
            <div className="flex items-end gap-2 bg-white border border-[#E5E1D8] rounded-2xl px-3 py-2 focus-within:border-[#A84C32]/50 focus-within:shadow-md focus-within:shadow-[#A84C32]/5 transition-all shadow-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? "Generating answer..." : "Ask your doubt... (Enter to send)"}
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent border-0 text-[#1A1A1A] placeholder:text-[#B5B0A8] text-xs sm:text-sm resize-none focus:outline-hidden max-h-24 px-1 py-1 font-ui"
                style={{ minHeight: '32px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="w-8 h-8 rounded-xl bg-[#A84C32] text-white flex items-center justify-center hover:bg-[#8C3A27] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              >
                {isStreaming ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : (
                  <ArrowUp size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
