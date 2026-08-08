import React, { useState } from 'react'
import { Bot, Check, Copy, FileText, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CitationCard from './CitationCard.jsx'

/**
 * MessageBubble — Renders a single chat message.
 * - User messages: indigo right-aligned pill
 * - Assistant messages: glassmorphism card with markdown, copy button, and citation badges
 */
export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const [activeCitation, setActiveCitation] = useState(null)
  const isUser = message.role === 'user'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback — silently ignore
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="flex items-end gap-2.5 max-w-[75%]">
          <div className="px-4 py-3 rounded-2xl rounded-br-sm
            bg-gradient-to-br from-brand-500 to-violet-600
            text-white text-sm font-medium leading-relaxed shadow-brand">
            {message.content}
          </div>
          <div className="flex-none w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/30
            flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-brand-400" />
          </div>
        </div>
      </div>
    )
  }

  // ── Assistant bubble ──
  return (
    <div className="flex items-start gap-3 animate-slide-up max-w-4xl">
      {/* Bot avatar */}
      <div className="flex-none w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500
        flex items-center justify-center shadow-glow-sm flex-shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* Card */}
      <div className="flex-1 glass-card p-5 min-w-0">
        {/* Markdown content */}
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* ── Citations ── */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCitation(activeCitation === i ? null : i)}
                  className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    border transition-all duration-200 active:scale-95
                    ${activeCitation === i
                      ? 'bg-indigo-500/25 border-indigo-500/60 text-indigo-200 shadow-glow-sm'
                      : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50'
                    }`}
                >
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[160px] truncate">{citation.source}</span>
                  <span className="text-indigo-400/70 font-normal">p.{citation.page}</span>
                </button>
              ))}
            </div>

            {/* Inline expanded citation */}
            {activeCitation !== null && message.citations[activeCitation] && (
              <CitationCard
                citation={message.citations[activeCitation]}
                onClose={() => setActiveCitation(null)}
              />
            )}
          </div>
        )}

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end mt-3 pt-2">
          <button
            onClick={copyToClipboard}
            id={`copy-btn-${Math.random().toString(36).slice(2,7)}`}
            title="Copy to clipboard"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
              border transition-all duration-200 active:scale-95
              ${copied
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-white/[0.04] border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
              }`}
          >
            {copied ? (
              <><Check className="w-3 h-3" /><span>Copied!</span></>
            ) : (
              <><Copy className="w-3 h-3" /><span>Copy</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
