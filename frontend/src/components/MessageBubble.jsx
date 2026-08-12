import React, { useState } from 'react'
import { Bot, Check, Copy, FileText, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CitationCard from './CitationCard.jsx'

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
      // fallback
    }
  }

  // Generate timestamp just once based on message if missing
  const timeString = message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="flex items-end gap-2.5 max-w-[75%]">
          <div className="flex flex-col items-end">
            <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-medium leading-relaxed shadow-brand">
              {message.content}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 mr-1 font-mono">{timeString}</span>
          </div>
          <div className="flex-none w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        </div>
      </div>
    )
  }

  // Assistant bubble
  return (
    <div className="flex items-start gap-3 animate-slide-up max-w-4xl">
      <div className="flex-none w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow-sm flex-shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="glass-card p-5">
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
          
          {/* Citations block */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" /> Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((cit, idx) => (
                  <button
                    key={`${cit.source}-${cit.page}-${idx}`}
                    onClick={() => setActiveCitation(cit)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 text-[11px] text-indigo-200 transition-all duration-200 font-medium"
                  >
                    <span className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[150px]">{cit.source}</span>
                    <span className="opacity-60 text-[10px]">p.{cit.page}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeCitation && (
            <CitationCard
              citation={activeCitation}
              onClose={() => setActiveCitation(null)}
            />
          )}
        </div>
        
        {/* Under-bubble metadata: timestamp & copy */}
        <div className="flex items-center gap-3 mt-1.5 ml-2">
          <span className="text-[10px] text-slate-500 font-mono">{timeString}</span>
          {!message.isError && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
