import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, ExternalLink, FileText, X } from 'lucide-react'

/**
 * CitationCard — Interactive expandable inspector card showing raw document excerpt,
 * source metadata, and quick excerpt copy button.
 */
export default function CitationCard({ citation, index, onClose }) {
  const [copied, setCopied] = useState(false)
  const cardRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Scroll the card into view smoothly
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const handleCopyExcerpt = async () => {
    try {
      await navigator.clipboard.writeText(citation.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div
      ref={cardRef}
      className="mt-3 rounded-2xl border border-brand-500/30 bg-surface-2/95
        backdrop-blur-xl overflow-hidden animate-scale-in shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-none font-bold text-xs">
            {typeof index === 'number' ? index + 1 : '1'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {citation.source}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">Page {citation.page}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-none">
          <button
            onClick={handleCopyExcerpt}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            title="Copy excerpt text"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Close Excerpt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Excerpt body */}
      <div className="p-4">
        <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-2">
          Retrieved Ground Truth Excerpt
        </p>
        <blockquote className="text-xs text-slate-300 leading-relaxed border-l-2 border-brand-500 pl-3 italic bg-white/[0.01] py-1 rounded-r-lg">
          "{citation.text}"
        </blockquote>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-black/20 text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-brand-400" /> {citation.source}
        </span>
        <span>Page {citation.page}</span>
      </div>
    </div>
  )
}
