import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bot, X, Send, Sparkles, Cpu, DollarSign, BarChart3,
  Users, LifeBuoy, Trash2, ChevronDown, Loader2, MessageSquare
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * AI Copilot Drawer — Floating AI assistant for admin portal.
 * 
 * Features:
 * - SSE streaming responses
 * - Model provider selection (Azure OpenAI / Gemini / OpenAI)
 * - Quick action buttons for Super Admin (CPU, Cost, Tickets)
 * - Markdown-aware message rendering
 * - Conversation history management
 */
export default function AiCopilot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelProvider, setModelProvider] = useState(null); // null = use default
  const [conversationId, setConversationId] = useState(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const quickActions = isSuperAdmin ? [
    { icon: Cpu, label: 'CPU Usage', prompt: 'Show me the current CPU usage of the production server' },
    { icon: DollarSign, label: 'Azure Cost', prompt: 'What is the current month Azure cloud cost and give me a 30-day forecast?' },
    { icon: LifeBuoy, label: 'Open Tickets', prompt: 'Summarize all open support tickets with their priorities' },
    { icon: Users, label: 'Platform Stats', prompt: 'Give me complete platform metrics — users, content, pending actions' },
  ] : [
    { icon: BarChart3, label: 'Platform Stats', prompt: 'Give me a summary of platform metrics' },
    { icon: LifeBuoy, label: 'Open Tickets', prompt: 'Summarize recent open support tickets' },
  ];

  const modelOptions = [
    { id: null, label: 'Default (from settings)', icon: '⚡' },
    { id: 'azure_openai', label: 'Azure OpenAI', icon: '🔷' },
    { id: 'gemini', label: 'Google Gemini', icon: '✨' },
    { id: 'openai', label: 'OpenAI', icon: '🟢' },
  ];

  const sendMessage = async (text) => {
    if (!text.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Add placeholder for AI response
    const aiMsgId = Date.now();
    setMessages((prev) => [...prev, { role: 'ai', content: '', id: aiMsgId, streaming: true }]);

    const historySnapshot = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: historySnapshot,
          model_provider: modelProvider,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            } catch {}
          } else if (line.startsWith('event: metadata')) {
            // Next data line has metadata
          } else if (line.startsWith('event: done')) {
            // Stream complete
          } else if (line.startsWith('event: error')) {
            // Will be in next data line
          }
        }
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: `❌ Error: ${err.message}`, streaming: false }
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Simple markdown renderer for chat messages
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
      // Italic
      processed = processed.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-400">$1</em>');
      // Inline code
      processed = processed.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-sky-300 text-xs font-mono">$1</code>');
      // Markdown links: [text](url) -> <a href="url" target="_blank" rel="noopener noreferrer">
      processed = processed.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors cursor-pointer bg-sky-500/10 px-1.5 py-0.5 rounded text-xs mx-0.5">$1 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline shrink-0 opacity-75"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>'
      );

      // Bullet points
      if (processed.startsWith('  •') || processed.startsWith('  -') || processed.startsWith('• ') || processed.startsWith('- ')) {
        return <p key={i} className="ml-3 text-sm leading-relaxed text-slate-200" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      // Headers
      if (processed.startsWith('### ')) {
        return <h4 key={i} className="font-bold text-sky-300 text-sm mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.replace('### ', '') }} />;
      }
      if (processed.startsWith('## ') || (processed.startsWith('**') && processed.endsWith('**'))) {
        return <p key={i} className="font-bold text-white mt-2 mb-1 text-sm" dangerouslySetInnerHTML={{ __html: processed.replace('## ', '') }} />;
      }
      return <p key={i} className="text-sm leading-relaxed text-slate-200" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-2xl shadow-violet-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[420px] h-[640px] max-h-[80vh] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-slate-900/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Osarthi AI</h3>
                <p className="text-[10px] text-slate-500">
                  {modelOptions.find((m) => m.id === modelProvider)?.label || 'Default Provider'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Model Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                  title="Switch AI Model"
                >
                  <ChevronDown size={14} />
                </button>
                {showModelPicker && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {modelOptions.map((opt) => (
                      <button
                        key={opt.id ?? 'default'}
                        onClick={() => { setModelProvider(opt.id); setShowModelPicker(false); }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-semibold flex items-center gap-2 hover:bg-white/5 transition-colors cursor-pointer ${
                          modelProvider === opt.id ? 'text-violet-400 bg-violet-500/10' : 'text-slate-300'
                        }`}
                      >
                        <span>{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={startNewChat}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="New Chat"
              >
                <MessageSquare size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles size={32} className="text-violet-400 mx-auto mb-3 opacity-60" />
                <p className="text-sm font-semibold text-slate-300 mb-1">Osarthi AI Assistant</p>
                <p className="text-xs text-slate-500 mb-6">
                  {isSuperAdmin
                    ? 'Ask about platform metrics, Azure costs, server health, or anything!'
                    : 'Ask about platform metrics, tickets, or search the portal.'}
                </p>
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(prompt)}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left hover:bg-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer group"
                    >
                      <Icon size={16} className="text-violet-400 mb-1.5 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-slate-300">{label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                    : 'bg-white/[0.04] border border-white/[0.06] text-slate-200'
                }`}>
                  {msg.role === 'ai' ? renderMarkdown(msg.content) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  {msg.streaming && (
                    <span className="inline-block w-2 h-4 bg-violet-400 rounded-sm animate-pulse ml-0.5" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 bg-slate-900/50 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? 'AI is thinking...' : 'Ask anything...'}
                disabled={isStreaming}
                rows={1}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm resize-none focus:outline-none focus:border-violet-500/50 placeholder:text-slate-600 disabled:opacity-50 max-h-24 overflow-y-auto"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              >
                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
