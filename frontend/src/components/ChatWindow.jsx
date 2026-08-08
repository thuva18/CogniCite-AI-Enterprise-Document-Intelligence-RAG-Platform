import React, { useEffect, useRef, useState } from 'react'
import { Bot, FileText, Send, Sparkles, Zap, Shield, BarChart3, HelpCircle } from 'lucide-react'
import { sendChatMessage } from '../api.js'
import MessageBubble from './MessageBubble.jsx'

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Key Financial Highlights', prompt: 'Summarize the key financial highlights and revenue figures from the documents.' },
  { icon: '🏗️', label: 'Architecture & Tech Spec', prompt: 'Explain the technical architecture, vector store setup, and system components.' },
  { icon: '🔒', label: 'Security & Compliance Guidelines', prompt: 'What are the data privacy, security, and compliance protocols specified?' },
  { icon: '📋', label: 'Executive Summary', prompt: 'Provide a concise executive summary with key recommendations from the documents.' },
]

/**
 * ChatWindow — Main conversational interface with rich welcome state,
 * quick-prompt chips, and auto-scrolling message thread.
 */
export default function ChatWindow({ documents }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const hasDocuments = documents.length > 0

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    if (!hasDocuments) {
      setError('Please upload or select a sample PDF document first.')
      setTimeout(() => setError(''), 4000)
      return
    }

    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const data = await sendChatMessage(msg)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, citations: data.citations || [] },
      ])
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || 'Something went wrong. Please try again.'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ **Error:** ${detail}`, citations: [], isError: true },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 relative bg-surface-1">
      {/* Ambient top glow */}
      <div className="glow-bg absolute inset-x-0 top-0 h-64 pointer-events-none -z-10 opacity-70" />

      {/* ── Messages Thread ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <WelcomeState hasDocuments={hasDocuments} onQuickPrompt={sendMessage} />
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
        )}

        {/* Loading typing indicator */}
        {loading && (
          <div className="flex items-center gap-3 text-indigo-400 text-xs font-medium animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <span>CogniCite AI is retrieving vectors & generating response…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Prompt Chips Above Input (when documents exist & messages exist) ── */}
      {hasDocuments && messages.length > 0 && (
        <div className="px-4 md:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/[0.04] bg-white/[0.01]">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.prompt)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/10 text-xs text-slate-300 hover:text-indigo-200 flex-none transition-all duration-200"
            >
              <span>{p.icon}</span>
              <span className="font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="p-4 md:px-8 border-t border-white/10 bg-surface-2/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-2 p-2 px-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 animate-fade-in">
              {error}
            </div>
          )}

          <div className="relative flex items-center">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder={
                hasDocuments
                  ? 'Ask any question about your indexed PDF documents… (Press Enter to send)'
                  : 'Please upload a PDF or click a Quick Test Sample on the left sidebar to start…'
              }
              className="w-full bg-white/[0.04] border border-white/15 focus:border-indigo-500/60
                rounded-2xl pl-4 pr-12 py-3.5 text-sm text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all duration-200"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="absolute right-2.5 p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600
                text-white hover:from-indigo-400 hover:to-violet-500 transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-sm flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-2 font-mono">
            Powered by Gemini Flash (Latest) · MongoDB Atlas Vector Search (768d)
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Welcome State ──────────────────────────────────────────────────────── */
function WelcomeState({ hasDocuments, onQuickPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in px-4">
      {/* Glow Avatar Header */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-indigo-700 flex items-center justify-center shadow-brand-lg">
          <Sparkles className="w-10 h-10 text-white animate-pulse-slow" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 blur-2xl -z-10" />
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 mb-2 tracking-tight">
        {hasDocuments ? 'Knowledge Base Indexed & Ready' : 'Welcome to CogniCite AI'}
      </h2>
      <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
        {hasDocuments
          ? 'Ask any question across your uploaded documents or choose a recommended analysis prompt below.'
          : 'Upload a PDF using the left sidebar — or click any of the 1-Click Sample Test Documents to experience sub-second RAG retrieval.'}
      </p>

      {/* Feature Capabilities grid when empty */}
      {!hasDocuments && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl w-full mb-6">
          {[
            { icon: BarChart3, label: 'Financial Analytics', desc: 'Revenue, EBITDA & YoY' },
            { icon: Zap, label: 'System Architecture', desc: 'RAG Stack & Benchmarks' },
            { icon: Shield, label: 'Security & Privacy', desc: 'AES-256 & Compliance' },
            { icon: Sparkles, label: 'Gemini Flash', desc: 'Sub-second LLM answers' },
          ].map((f, idx) => {
            const Icon = f.icon
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/40 text-left transition-all duration-300 group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2.5 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">{f.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Prompts Grid when docs are loaded */}
      {hasDocuments && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => onQuickPrompt(p.prompt)}
              className="flex items-start gap-3 p-4 text-left rounded-2xl
                bg-white/[0.03] border border-white/[0.08] text-slate-300
                hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:text-white
                transition-all duration-200 active:scale-[0.98] group shadow-sm"
            >
              <span className="text-xl flex-none group-hover:scale-110 transition-transform">
                {p.icon}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-200">
                  {p.label}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.prompt}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
