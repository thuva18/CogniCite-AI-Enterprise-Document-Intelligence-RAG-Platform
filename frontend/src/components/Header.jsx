import React, { useEffect, useState, useRef } from 'react'
import {
  Activity,
  Cpu,
  Database,
  Download,
  FileText,
  HelpCircle,
  Layers,
  Menu,
  Sparkles,
  Trash2,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { fetchHealth } from '../api.js'

/**
 * Header — Enterprise navigation bar with real-time health telemetry popover,
 * active knowledge base counters, chat export tools, and responsive mobile drawer toggle.
 */
export default function Header({
  documentCount,
  onToggleSidebar,
  messages = [],
  onClearChat,
  onOpenInspector
}) {
  const [health, setHealth] = useState({ status: 'checking', mongodb: 'unknown', active_documents: 0 })
  const [retrying, setRetrying] = useState(false)
  const [showHealthPopover, setShowHealthPopover] = useState(false)
  const popoverRef = useRef(null)

  useEffect(() => {
    let timerId
    const check = async () => {
      try {
        setRetrying(false)
        const data = await fetchHealth()
        setHealth(data)
        timerId = setTimeout(check, 8000)
      } catch {
        setRetrying(false)
        setHealth({ status: 'error', mongodb: 'unreachable', active_documents: 0 })
        timerId = setTimeout(check, 25000)
      }
    }

    setRetrying(true)
    check()
    return () => clearTimeout(timerId)
  }, [])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowHealthPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Export conversation as Markdown
  const handleExportMarkdown = () => {
    if (!messages || messages.length === 0) return
    const lines = [
      `# CogniCite AI — Conversation Export`,
      `*Generated on ${new Date().toLocaleString()}*`,
      ``,
      `---`,
      ``
    ]

    messages.forEach((m) => {
      const role = m.role === 'user' ? '### 👤 User' : '### 🤖 CogniCite Assistant'
      lines.push(`${role} (${m.timestamp || ''})`)
      lines.push(``)
      lines.push(m.content)
      lines.push(``)
      if (m.citations && m.citations.length > 0) {
        lines.push(`**Sources & Citations:**`)
        m.citations.forEach((c, idx) => {
          lines.push(`- [${idx + 1}] **${c.source}** (Page ${c.page}): "${c.text.slice(0, 140)}..."`)
        })
        lines.push(``)
      }
      lines.push(`---`)
      lines.push(``)
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cognicite-chat-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isHealthy = health.status === 'healthy'
  const isChecking = health.status === 'checking' || retrying
  const statusColor = isHealthy ? 'text-emerald-400' : isChecking ? 'text-amber-400' : 'text-rose-400'
  const dotColor = isHealthy ? 'bg-emerald-400' : isChecking ? 'bg-amber-400' : 'bg-rose-400'
  const badgeBg = isHealthy ? 'bg-emerald-500/10 border-emerald-500/20' : isChecking ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20'

  return (
    <header className="relative z-30 flex-none h-14 border-b border-white/[0.08] bg-surface-1/90 backdrop-blur-xl">
      {/* Subtle top ambient hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: Mobile menu toggle + Brand wordmark */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle Document Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 shadow-glow-sm">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-surface-1 animate-pulse-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">CogniCite</span>
                <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  AI
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5 hidden sm:block">
                Enterprise RAG Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Telemetry & Status Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active docs counter badge */}
          {documentCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-medium">
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>{documentCount} {documentCount === 1 ? 'doc' : 'docs'} indexed</span>
            </div>
          )}

          {/* Export Chat Button (when messages exist) */}
          {messages.length > 0 && (
            <button
              onClick={handleExportMarkdown}
              className="btn-ghost !px-2.5 !py-1 text-xs hidden sm:inline-flex items-center gap-1.5"
              title="Export Conversation as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          )}

          {/* Model indicator pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-brand-400" />
            <span>Gemini Flash</span>
            <span className="text-[10px] text-slate-400 font-mono">768d</span>
          </div>

          {/* Backend Status with Interactive Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setShowHealthPopover(!showHealthPopover)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all duration-150 ${badgeBg}`}
              title="Click to view backend telemetry status"
            >
              <span className={`w-2 h-2 rounded-full ${dotColor} ${isHealthy ? 'animate-pulse-slow' : ''}`} />
              <span className={statusColor}>
                {isHealthy ? 'Connected' : isChecking ? 'Waking up…' : 'Offline'}
              </span>
            </button>

            {/* Health Telemetry Popover Card */}
            {showHealthPopover && (
              <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-surface-2/95 border border-white/[0.12] shadow-2xl backdrop-blur-xl animate-scale-in z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-brand-400" /> System Telemetry
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeBg} ${statusColor}`}>
                    {health.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-400" /> MongoDB Atlas
                    </span>
                    <span className={`font-medium ${health.mongodb === 'connected' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {health.mongodb}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-brand-400" /> Vector Index
                    </span>
                    <span className="text-slate-200 font-mono">
                      {health.active_documents || 0} chunks (768d)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-violet-400" /> LLM Pipeline
                    </span>
                    <span className="text-slate-200 font-medium">
                      gemini-flash-latest
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">
                  Atlas vector search and Gemini embeddings are continuously synchronized via REST pacing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
