import React, { useEffect, useRef } from 'react'
import { ExternalLink, FileText, X } from 'lucide-react'

/**
 * CitationCard — Inline expandable accordion showing raw document excerpt.
 * Appears below the citation badge row with a smooth slide-down animation.
 */
export default function CitationCard({ citation, onClose }) {
  const cardRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Scroll the card into view
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  return (
    <div
      ref={cardRef}
      className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40
        backdrop-blur-sm overflow-hidden animate-scale-in shadow-glow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
        border-b border-indigo-500/20 bg-indigo-500/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/25 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-200 truncate max-w-[220px]">
              {citation.source}
            </p>
            <p className="text-[10px] text-indigo-400/70">Page {citation.page}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md
            bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Page {citation.page}
          </span>
          <button
            onClick={onClose}
            className="ml-1 p-1 rounded-md text-indigo-400/70 hover:text-indigo-200
              hover:bg-indigo-500/20 transition-all duration-150"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Excerpt body */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
          Retrieved excerpt
        </p>
        <blockquote className="text-xs text-slate-400 leading-relaxed
          border-l-2 border-indigo-500/50 pl-3 italic">
          {citation.text}
          {citation.text.length >= 500 && (
            <span className="not-italic text-slate-600"> …</span>
          )}
        </blockquote>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-indigo-500/15 bg-black/20">
        <ExternalLink className="w-3 h-3 text-slate-600 flex-none" />
        <span className="text-[10px] text-slate-600 font-medium truncate">{citation.source}</span>
        <span className="text-[10px] text-slate-700 ml-auto">· pg {citation.page}</span>
      </div>
    </div>
  )
}
