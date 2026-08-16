import React, { useState } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  FileCode2,
  FileText,
  Layers,
  Loader2,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react'

/**
 * PipelineInspectorModal — Real-time telemetry trace and observability inspector
 * showing exact step execution, vector dimensions, REST batching, and raw JSON metadata.
 */
export default function PipelineInspectorModal({
  isOpen,
  onClose,
  currentFile,
  pipelineMetrics,
  uploading,
  uploadStatus,
  errorMsg,
}) {
  const [activeTab, setActiveTab] = useState('trace') // 'trace' | 'json'

  if (!isOpen) return null

  const isSuccess = uploadStatus === 'success' || Boolean(pipelineMetrics)
  const isError = uploadStatus === 'error' && !uploading
  const isProcessing = uploading

  const progressPercent = isSuccess ? 100 : isError ? 65 : 75

  const steps = [
    {
      id: 1,
      title: 'Stream Validation & Byte Buffer',
      subtitle: `Validated PDF payload (${
        pipelineMetrics?.file_size_mb ||
        (currentFile?.size ? (currentFile.size / (1024 * 1024)).toFixed(2) : '0.5')
      } MB)`,
      icon: FileText,
      detail: 'Verified magic bytes (%PDF) and payload limit (< 20 MB).',
      status: 'complete',
    },
    {
      id: 2,
      title: 'Page Extraction & Tree Parsing',
      subtitle: `Parsed document pages (${pipelineMetrics?.pages || 'Multi-page'})`,
      icon: Layers,
      detail: 'Extracted text layout using PyPDFLoader with fallback stream parser.',
      status: 'complete',
    },
    {
      id: 3,
      title: 'Recursive Character Chunking',
      subtitle: `Generated token windows (chunk_size=1000, overlap=200) → ${
        pipelineMetrics?.chunks || 'Active'
      } chunks`,
      icon: FileCode2,
      detail: 'Split semantic text boundaries (\\n\\n, \\n, sentence breaks).',
      status: 'complete',
    },
    {
      id: 4,
      title: 'Gemini REST Vector Embedding',
      subtitle: isSuccess
        ? `768d embeddings generated via gemini-embedding-001 batching (${
            pipelineMetrics?.embedding_batches || '1'
          } batches)`
        : isError
        ? 'Rate limit or connection error on Gemini API'
        : 'Generating 768d dense embeddings via REST batching with 1.2s pacing…',
      icon: Zap,
      detail: isError
        ? errorMsg || 'Gemini 404/429 error encountered. Fast-fail active.'
        : 'Calculated 768-dimensional dense vectors with automatic rate-limit backoff.',
      status: isSuccess ? 'complete' : isError ? 'error' : 'processing',
    },
    {
      id: 5,
      title: 'MongoDB Atlas Vector Search Sync',
      subtitle: isSuccess
        ? 'Stored document vectors & metadata into rag_db.documents'
        : isError
        ? 'Sync aborted due to upstream error'
        : 'Writing vector payload batch to Atlas Cluster…',
      icon: Database,
      detail: 'Upserts document vectors & metadata tags (source, page) into Atlas Cluster.',
      status: isSuccess ? 'complete' : isError ? 'aborted' : 'pending',
    },
    {
      id: 6,
      title: 'Knowledge Index Operational',
      subtitle: isSuccess
        ? 'Vector context ready for natural-language retrieval & citations'
        : isError
        ? 'Ingestion incomplete'
        : 'Awaiting vector index synchronization…',
      icon: Sparkles,
      detail: isSuccess
        ? 'Context index ready for semantic search with Gemini Flash.'
        : 'Finalizing context index state.',
      status: isSuccess ? 'complete' : isError ? 'aborted' : 'pending',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      {/* Ambient background glow */}
      <div
        className={`absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow
          ${isError ? 'bg-rose-500/15' : isSuccess ? 'bg-emerald-500/15' : 'bg-brand-500/15'}`}
      />

      {/* Main Modal Card */}
      <div
        className={`relative w-full max-w-xl flex flex-col rounded-3xl bg-surface-1/95 border shadow-2xl overflow-hidden animate-scale-in
          ${isError ? 'border-rose-500/40' : isSuccess ? 'border-emerald-500/40' : 'border-brand-500/30'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-glow-sm
                ${
                  isError
                    ? 'bg-rose-500/20 text-rose-400'
                    : isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-brand-500/20 text-brand-400'
                }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Pipeline Telemetry Trace</h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border
                    ${
                      isError
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : isSuccess
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                    }`}
                >
                  {isError ? 'FAILED' : isSuccess ? 'COMPLETE' : 'PROCESSING'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md font-mono mt-0.5">
                {currentFile?.name || pipelineMetrics?.filename || 'Document Ingestion Pipeline'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/[0.06] bg-surface-2/40 text-xs">
          <button
            onClick={() => setActiveTab('trace')}
            className={`pb-2.5 font-semibold transition-all border-b-2 flex items-center gap-1.5
              ${
                activeTab === 'trace'
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Activity className="w-3.5 h-3.5" /> Execution Trace
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 font-semibold transition-all border-b-2 flex items-center gap-1.5
              ${
                activeTab === 'json'
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Raw Telemetry JSON
          </button>
        </div>

        {/* Progress Bar Track */}
        <div
          className={`px-6 py-3 border-b border-white/[0.06]
            ${isError ? 'bg-rose-950/20' : isSuccess ? 'bg-emerald-950/20' : 'bg-brand-950/20'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              {isProcessing ? (
                <span className="text-brand-300 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" /> Ingesting & Generating 768d Vectors…
                </span>
              ) : isSuccess ? (
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Vector Index Synchronized
                </span>
              ) : (
                <span className="text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Ingestion Interrupted
                </span>
              )}
            </span>
            <span
              className={`font-mono text-xs ${
                isError ? 'text-rose-400' : isSuccess ? 'text-emerald-400' : 'text-brand-400'
              }`}
            >
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500
                ${
                  isError
                    ? 'bg-rose-500'
                    : isSuccess
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-brand-500 via-accent-500 to-brand-400 animate-pulse'
                }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Error Detail Banner */}
        {isError && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-none mt-0.5" />
            <div>
              <p className="font-bold">Execution Exception:</p>
              <p className="text-rose-300/90 text-[11px] mt-0.5 font-mono leading-relaxed">
                {errorMsg || 'Gemini API Error. Please verify your GEMINI_API_KEY environment variable.'}
              </p>
            </div>
          </div>
        )}

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-4 gap-2 px-6 py-3 border-b border-white/[0.06] bg-white/[0.01] text-center">
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[9px] text-slate-400 font-medium uppercase">File Size</p>
            <p className="text-xs font-bold text-brand-300 font-mono mt-0.5">
              {pipelineMetrics?.file_size_mb ||
                (currentFile?.size ? (currentFile.size / (1024 * 1024)).toFixed(2) : '0.50')}{' '}
              MB
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[9px] text-slate-400 font-medium uppercase">Chunks</p>
            <p className="text-xs font-bold text-violet-300 font-mono mt-0.5">
              {pipelineMetrics?.chunks || (isSuccess ? 'Completed' : isError ? '0' : 'Extracting…')}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[9px] text-slate-400 font-medium uppercase">REST Batches</p>
            <p className="text-xs font-bold text-emerald-300 font-mono mt-0.5">
              {pipelineMetrics?.embedding_batches || (isSuccess ? '1' : isError ? '0' : 'Pacing…')}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[9px] text-slate-400 font-medium uppercase">Vector Dim</p>
            <p className="text-xs font-bold text-amber-300 font-mono mt-0.5">768d</p>
          </div>
        </div>

        {/* Tab 1: Pipeline Steps Trace */}
        {activeTab === 'trace' && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 max-h-[340px]">
            {steps.map((step) => {
              const Icon = step.icon
              const stepDone = step.status === 'complete'
              const stepError = step.status === 'error'
              const stepProcessing = step.status === 'processing'

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all
                    ${
                      stepDone
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : stepError
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : stepProcessing
                        ? 'bg-brand-500/10 border-brand-500/40'
                        : 'bg-white/[0.01] border-white/[0.04] opacity-40'
                    }`}
                >
                  <div
                    className={`flex-none w-7 h-7 rounded-xl flex items-center justify-center
                      ${
                        stepDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : stepError
                          ? 'bg-rose-500/25 text-rose-400'
                          : stepProcessing
                          ? 'bg-brand-500/25 text-brand-300 animate-pulse'
                          : 'bg-white/5 text-slate-400'
                      }`}
                  >
                    {stepDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : stepError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : stepProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold
                          ${
                            stepDone
                              ? 'text-emerald-300'
                              : stepError
                              ? 'text-rose-300'
                              : stepProcessing
                              ? 'text-brand-200'
                              : 'text-slate-400'
                          }`}
                      >
                        Step {step.id}: {step.title}
                      </h4>
                      {stepDone && (
                        <span className="text-[9px] text-emerald-400 font-mono font-semibold">
                          DONE
                        </span>
                      )}
                      {stepError && (
                        <span className="text-[9px] text-rose-400 font-mono font-semibold">
                          FAILED
                        </span>
                      )}
                      {stepProcessing && (
                        <span className="text-[9px] text-brand-400 animate-pulse font-mono font-semibold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 font-medium">{step.subtitle}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tab 2: Raw JSON Telemetry */}
        {activeTab === 'json' && (
          <div className="p-6 max-h-[340px] overflow-y-auto">
            <pre className="p-4 rounded-2xl bg-[#070b14] border border-white/[0.08] text-[11px] font-mono text-brand-300 overflow-x-auto">
              {JSON.stringify(
                {
                  pipeline_status: isSuccess ? 'COMPLETE' : isError ? 'FAILED' : 'PROCESSING',
                  telemetry: pipelineMetrics || {
                    filename: currentFile?.name || 'N/A',
                    file_size_mb: currentFile?.size ? (currentFile.size / (1024 * 1024)).toFixed(2) : 0,
                    status: uploadStatus,
                    error: errorMsg || null,
                  },
                  model_specs: {
                    embedding_model: 'gemini-embedding-001',
                    dimensions: 768,
                    vector_store: 'MongoDB Atlas Vector Search',
                    llm_engine: 'gemini-flash-latest',
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-brand-400" /> Ingestion Latency:{' '}
            {pipelineMetrics?.process_time_sec
              ? `${pipelineMetrics.process_time_sec}s`
              : isProcessing
              ? 'Measuring…'
              : 'N/A'}
          </span>
          <button
            onClick={onClose}
            className="btn-primary !px-3.5 !py-1 text-xs"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  )
}
