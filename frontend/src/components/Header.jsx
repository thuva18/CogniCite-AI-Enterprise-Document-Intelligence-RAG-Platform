import React, { useEffect, useState } from 'react'
import { Activity, Brain, FileText, Zap } from 'lucide-react'
import { fetchHealth } from '../api.js'

/**
 * Header — Global status bar with animated wordmark, API health indicator,
 * and active document count badge.
 */
export default function Header({ documentCount }) {
  const [health, setHealth] = useState({ status: 'checking', mongodb: 'unknown', active_documents: 0 })
  const [pulse, setPulse] = useState(false)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    let timerId
    const check = async () => {
      try {
        setRetrying(false)
        const data = await fetchHealth()
        setHealth(data)
        timerId = setTimeout(check, 5000)
      } catch {
        // fetchHealth already retried 3x with 8s gaps — backend truly unreachable
        setRetrying(false)
        setHealth({ status: 'error', mongodb: 'unreachable', active_documents: 0 })
        // Retry the whole health cycle every 30s in case Render wakes up later
        timerId = setTimeout(check, 30000)
      }
      setRetrying(false)
    }

    // Show "Waking up" state while the first check runs
    setRetrying(true)
    check()
    return () => clearTimeout(timerId)
  }, [])

  // Pulse animation whenever doc count changes
  useEffect(() => {
    if (documentCount > 0) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 1200)
      return () => clearTimeout(t)
    }
  }, [documentCount])

  const isHealthy = health.status === 'healthy'
  const isChecking = health.status === 'checking' || retrying
  const statusColor = isHealthy ? 'text-emerald-400' : isChecking ? 'text-amber-400' : 'text-red-400'
  const dotColor   = isHealthy ? 'bg-emerald-400' : isChecking ? 'bg-amber-400' : 'bg-red-400'

  return (
    <header className="relative z-20 flex-none h-16 border-b border-white/[0.06] bg-surface-1/80 backdrop-blur-xl">
      {/* Subtle glow top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="flex items-center justify-between h-full px-6">
        {/* ── Wordmark ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 shadow-glow-sm">
            <Brain className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-surface-1 animate-pulse-slow" />
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold gradient-text tracking-tight">CogniCite AI</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Enterprise RAG</p>
          </div>
        </div>

        {/* ── Status pills ── */}
        <div className="flex items-center gap-3">
          {/* Document count badge */}
          {documentCount > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-500
              ${pulse
                ? 'bg-indigo-500/25 border-indigo-500/60 shadow-glow-sm'
                : 'bg-indigo-500/10 border-indigo-500/25'}`}>
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">
                {documentCount} {documentCount === 1 ? 'doc' : 'docs'} active
              </span>
            </div>
          )}

          {/* AI Model badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/25">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-medium text-violet-300">Gemini Flash (Latest)</span>
          </div>

          {/* MongoDB health */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">
            <span className={`w-2 h-2 rounded-full ${dotColor} ${isHealthy ? 'animate-pulse-slow' : ''}`} />
            <Activity className={`w-3.5 h-3.5 ${statusColor}`} />
            <span className={`text-xs font-medium hidden sm:inline ${statusColor}`}>
              {isHealthy ? 'Connected' : isChecking ? 'Waking up…' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
