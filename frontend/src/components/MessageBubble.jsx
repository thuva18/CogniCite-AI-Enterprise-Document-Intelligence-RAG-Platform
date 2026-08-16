import React, { useState } from 'react'
import {
  Bot,
  Check,
  Copy,
  FileText,
  ThumbsDown,
  ThumbsUp,
  User,
  ExternalLink
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CitationCard from './CitationCard.jsx'

/**
 * Custom Code Block with language tag and copy button
 */
function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const codeContent = String(children).replace(/\n$/, '')

  if (inline || !match) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#070b14] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-slate-400 font-mono">
        <span className="uppercase font-semibold text-brand-400">{match[1]}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="!m-0 !p-4 !bg-transparent overflow-x-auto text-xs font-mono">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(null) // 'like' | 'dislike' | null
  const [activeCitationIdx, setActiveCitationIdx] = useState(null)
  const isUser = message.role === 'user'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const timeString =
    message.timestamp ||
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="flex flex-col items-end">
            <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-br from-brand-600 to-accent-600 text-white text-sm font-medium leading-relaxed shadow-brand">
              {message.content}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 mr-1 font-mono">
              {timeString}
            </span>
          </div>
          <div className="flex-none w-7 h-7 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-brand-300" />
          </div>
        </div>
      </div>
    )
  }

  // Assistant response bubble
  return (
    <div className="flex items-start gap-3 animate-slide-up max-w-4xl">
      <div className="flex-none w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center shadow-glow-sm flex-shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="glass-card p-4 sm:p-6 bg-surface-2/70 border border-white/[0.08]">
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Citations & Source Intelligence */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-white/[0.08]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-brand-400" /> Ground Truth Sources ({message.citations.length})
                </span>
                <span className="text-[10px] text-slate-400 italic">Click citation to inspect excerpt</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {message.citations.map((cit, idx) => {
                  const isActive = activeCitationIdx === idx
                  return (
                    <button
                      key={`${cit.source}-${cit.page}-${idx}`}
                      onClick={() =>
                        setActiveCitationIdx(isActive ? null : idx)
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150
                        ${
                          isActive
                            ? 'bg-brand-500 text-white shadow-glow-sm scale-[1.02]'
                            : 'bg-white/[0.03] border border-white/[0.08] hover:border-brand-500/40 hover:bg-brand-500/10 text-slate-300 hover:text-brand-200'
                        }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-500/20 text-brand-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">
                        {cit.source}
                      </span>
                      <span className="text-[10px] opacity-60">p.{cit.page}</span>
                    </button>
                  )
                })}
              </div>

              {/* Active Citation Card Excerpt View */}
              {activeCitationIdx !== null && message.citations[activeCitationIdx] && (
                <CitationCard
                  citation={message.citations[activeCitationIdx]}
                  index={activeCitationIdx}
                  onClose={() => setActiveCitationIdx(null)}
                />
              )}
            </div>
          )}
        </div>

        {/* Under-bubble action bar */}
        <div className="flex items-center gap-4 mt-2 ml-1 text-slate-400">
          <span className="text-[10px] font-mono">{timeString}</span>

          {!message.isError && (
            <>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-[11px] hover:text-slate-200 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setFeedback(feedback === 'like' ? null : 'like')
                  }
                  className={`p-1 rounded-md hover:bg-white/[0.06] transition-colors ${
                    feedback === 'like'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'hover:text-slate-200'
                  }`}
                  title="Helpful response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    setFeedback(feedback === 'dislike' ? null : 'dislike')
                  }
                  className={`p-1 rounded-md hover:bg-white/[0.06] transition-colors ${
                    feedback === 'dislike'
                      ? 'text-rose-400 bg-rose-500/10'
                      : 'hover:text-slate-200'
                  }`}
                  title="Unhelpful response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
