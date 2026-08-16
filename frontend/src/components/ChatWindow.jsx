import React, { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  Bot,
  CornerDownLeft,
  FileText,
  Layers,
  Send,
  Shield,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { sendChatMessage } from '../api.js'
import MessageBubble from './MessageBubble.jsx'

const QUICK_PROMPTS = [
  {
    icon: BarChart3,
    iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    title: 'Financial Breakdown',
    desc: 'Revenue, EBITDA & YoY Growth',
    prompt: 'Provide a structured summary of key financial figures, revenue, EBITDA, and YoY growth mentioned across the uploaded documents.',
  },
  {
    icon: Zap,
    iconColor: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    title: 'System Architecture',
    desc: 'Stack, Vector Search & Retrieval',
    prompt: 'Explain the technical architecture, vector store configuration, chunking strategy, and retrieval flow described in the documents.',
  },
  {
    icon: Shield,
    iconColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    title: 'Security & Compliance',
    desc: 'Data Privacy & Encryption Specs',
    prompt: 'What are the encryption standards, access controls, and compliance frameworks specified in the documentation?',
  },
  {
    icon: Sparkles,
    iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    title: 'Executive Summary',
    desc: 'Key Takeaways & Action Items',
    prompt: 'Generate an executive summary with bulleted key takeaways, strategic priorities, and immediate action items.',
  },
]

export default function ChatWindow({
  documents = [],
  messages = [],
  setMessages,
  onClearChat,
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const hasDocuments = documents.length > 0

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Handle textarea auto-resize
  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    if (!hasDocuments) {
      setError('Please upload or select a sample PDF document on the left sidebar to start.')
      setTimeout(() => setError(''), 4500)
      return
    }

    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    setError('')

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    const userMsg = { role: 'user', content: msg, timestamp }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setLoading(true)

    try {
      const data = await sendChatMessage(msg, newHistory)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Failed to generate response. Please check your backend connection.'
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Retrieval Error:** ${detail}`,
          citations: [],
          isError: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 relative bg-surface-0">
      {/* Ambient top lighting */}
      <div className="absolute inset-x-0 top-0 h-64 bg-glow-radial pointer-events-none -z-10" />

      {/* ── Chat Messages Scroll Area ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <WelcomeState
            hasDocuments={hasDocuments}
            documents={documents}
            onQuickPrompt={sendMessage}
          />
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
        )}

        {/* Loading / Generating Thinking State */}
        {loading && (
          <div className="flex items-start gap-3 animate-slide-up max-w-4xl">
            <div className="flex-none w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center shadow-glow-sm flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="glass-card px-4 py-3.5 bg-surface-2/80 border border-white/[0.08] flex items-center gap-3">
              <span className="text-xs font-medium text-slate-300">
                Retrieving vector context & synthesizing answer…
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-[typingBounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.32s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-[typingBounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.16s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-[typingBounce_1.4s_infinite_ease-in-out_both]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Prompt Suggestion Chips (when conversation is active) ── */}
      {hasDocuments && messages.length > 0 && (
        <div className="px-4 sm:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/[0.04] bg-surface-1/40">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex-none mr-1">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((p) => {
            const Icon = p.icon
            return (
              <button
                key={p.title}
                onClick={() => sendMessage(p.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-brand-500/40 hover:bg-brand-500/10 text-xs text-slate-300 hover:text-white flex-none transition-all duration-150 disabled:opacity-40"
              >
                <Icon className="w-3 h-3 text-brand-400" />
                <span>{p.title}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Input / Composer Bar ── */}
      <div className="p-4 sm:px-8 border-t border-white/[0.08] bg-surface-1/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-2 p-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 animate-fade-in flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-rose-400 hover:text-white ml-2 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="relative flex items-end rounded-2xl bg-white/[0.03] border border-white/[0.1] focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder={
                hasDocuments
                  ? 'Ask any question across your indexed documents… (Shift+Enter for newline)'
                  : 'Upload a PDF or select a quick test sample on the left to start…'
              }
              className="w-full bg-transparent px-4 py-3.5 pr-20 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none overflow-hidden"
              style={{ minHeight: '48px', maxHeight: '140px' }}
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              {input.length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline mr-1">
                  {input.length} chars
                </span>
              )}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-brand hover:from-brand-500 hover:to-accent-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center h-8 w-8"
                title="Send query (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-mono px-1">
            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-300">↵ Enter</kbd> to query
            </span>
            <span className="mx-auto sm:mx-0">
              MongoDB Atlas 768d Dense Vectors · Gemini Flash
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Welcome State ──────────────────────────────────────────────────────── */
function WelcomeState({ hasDocuments, documents = [], onQuickPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center animate-fade-in px-4 max-w-3xl mx-auto">
      {/* Animated Brand Avatar Header */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 flex items-center justify-center shadow-glow-md">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -inset-2 rounded-2xl bg-brand-500/20 blur-xl -z-10" />
      </div>

      <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">
        {hasDocuments
          ? 'Knowledge Base Indexed & Ready for Inquiries'
          : 'CogniCite AI — Enterprise Document Intelligence'}
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed mb-8">
        {hasDocuments
          ? `Query across ${documents.length} loaded document(s) with sub-second vector retrieval and grounded citations.`
          : 'Ingest enterprise PDFs, extract semantic text hierarchies, and execute retrieval-augmented generation with verifiable ground truth.'}
      </p>

      {/* When NO documents are loaded: Capabilities grid */}
      {!hasDocuments && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full mb-6">
          {[
            { icon: BarChart3, label: 'Financial Analytics', desc: 'Revenue, YoY & EBITDA' },
            { icon: Zap, label: 'System Specs', desc: 'RAG Stack & Metrics' },
            { icon: Shield, label: 'Security & Privacy', desc: 'AES-256 & SOC-2' },
            { icon: Sparkles, label: 'Grounded Citations', desc: 'Page-level truth trace' },
          ].map((f, idx) => {
            const Icon = f.icon
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-2 text-brand-400 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                  {f.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{f.desc}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* When documents ARE loaded: Suggested Prompt Cards */}
      {hasDocuments && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {QUICK_PROMPTS.map((p) => {
            const Icon = p.icon
            return (
              <button
                key={p.title}
                onClick={() => onQuickPrompt(p.prompt)}
                className="flex items-start gap-3 p-3.5 text-left rounded-2xl
                  bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40
                  hover:bg-brand-500/10 text-slate-300 hover:text-white
                  transition-all active:scale-[0.99] group shadow-sm"
              >
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-none group-hover:scale-105 transition-transform ${p.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-brand-300">
                    {p.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {p.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
