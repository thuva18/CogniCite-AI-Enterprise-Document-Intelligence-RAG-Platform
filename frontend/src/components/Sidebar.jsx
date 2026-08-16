import React, { useRef, useState } from 'react'
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCode2,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  Maximize2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react'
import PipelineInspectorModal from './PipelineInspectorModal.jsx'
import { uploadFiles } from '../api.js'

export default function Sidebar({
  isOpen = false,
  onClose,
  documents = [],
  onDocumentsChange,
  activeDocument,
  onSelectDocument,
  clearing,
  onRequestClear,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [showInspector, setShowInspector] = useState(false)
  const [activeFile, setActiveFile] = useState(null)
  const [pipelineMetrics, setPipelineMetrics] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingSample, setLoadingSample] = useState(null)

  const fileRef = useRef(null)

  const sampleDocs = [
    {
      filename: 'CogniCite_Architecture.pdf',
      title: 'CogniCite Architecture Spec',
      badge: 'RAG Pipeline',
      badgeColor: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
      icon: Zap,
    },
    {
      filename: 'Global_Tech_Financial_2025.pdf',
      title: 'Global Tech Financial FY25',
      badge: 'Finance',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Sparkles,
    },
    {
      filename: 'AI_Security_Compliance.pdf',
      title: 'AI Governance & Privacy',
      badge: 'Security',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      icon: Layers,
    },
  ]

  const processFiles = async (files) => {
    if (!files || files.length === 0) return
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    )
    if (pdfFiles.length === 0) {
      setErrorMsg('Please select valid PDF files (.pdf).')
      setUploadStatus('error')
      return
    }

    const first = pdfFiles[0]
    setActiveFile(first)
    setUploading(true)
    setUploadStatus(null)
    setErrorMsg('')
    setPipelineMetrics(null)
    setShowInspector(true)

    try {
      const formData = new FormData()
      pdfFiles.forEach((file) => formData.append('files', file))

      const res = await uploadFiles(formData)
      setUploading(false)
      setUploadStatus('success')
      if (res.documents && res.documents.length > 0) {
        setPipelineMetrics(res.documents[0])
      }
      onDocumentsChange([...documents, ...(res.documents || [])])
    } catch (err) {
      setUploading(false)
      setUploadStatus('error')
      setErrorMsg(err.message || 'Failed to upload document')
    }
  }

  const handleLoadSample = async (sample) => {
    setLoadingSample(sample.filename)
    try {
      const res = await fetch(`/sample_docs/${sample.filename}`)
      if (!res.ok) throw new Error('Sample file not found')
      const blob = await res.blob()
      const file = new File([blob], sample.filename, { type: 'application/pdf' })
      await processFiles([file])
    } catch (err) {
      console.error('Failed to load sample:', err)
      setErrorMsg('Could not fetch sample PDF. Please upload manually.')
      setUploadStatus('error')
    } finally {
      setLoadingSample(null)
    }
  }

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunks || 0), 0)

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 md:w-80 flex flex-col h-full flex-none
          border-r border-white/[0.08] bg-surface-1/95 md:bg-surface-1/80 backdrop-blur-2xl
          shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* ── Top Bar / Mobile Close ── */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Knowledge Base
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {documents.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-300">
                {documents.length} PDF{documents.length > 1 ? 's' : ''}
              </span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Ingestion Dropzone ── */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-brand-400" /> Ingest PDF
            </span>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Browse
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              processFiles(e.dataTransfer.files)
            }}
            onClick={() => fileRef.current?.click()}
            className={`relative p-4 rounded-2xl border-2 border-dashed cursor-pointer text-center
              transition-all duration-200 select-none
              ${
                dragOver
                  ? 'border-brand-500 bg-brand-500/10 shadow-glow-sm scale-[1.01]'
                  : 'border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5 bg-white/[0.02]'
              }
              ${uploading ? 'pointer-events-none opacity-90' : ''}`}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => processFiles(e.target.files)}
            />

            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                  </div>
                  <p className="text-xs font-semibold text-brand-300">Processing Pipeline…</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowInspector(true)
                    }}
                    className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/20 border border-brand-500/35 text-brand-300 text-[11px] font-semibold hover:bg-brand-500/30 transition-all shadow-glow-sm pointer-events-auto"
                  >
                    <Maximize2 className="w-3 h-3" /> View Progress
                  </button>
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-300">Ingested Successfully!</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowInspector(true)
                    }}
                    className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/30 transition-all pointer-events-auto"
                  >
                    <Maximize2 className="w-3 h-3" /> Inspect Telemetry
                  </button>
                </>
              ) : (
                <>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                      ${dragOver ? 'bg-brand-500/25 text-brand-300' : 'bg-brand-500/10 text-brand-400'}`}
                  >
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {dragOver ? 'Drop PDF file here' : 'Drag & drop PDF'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      or <span className="text-brand-400 font-medium">browse local files</span> (max 20MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {uploadStatus === 'error' && (
            <p className="mt-2 text-[11px] text-rose-400 flex items-center gap-1.5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-none" />
              {errorMsg}
            </p>
          )}
        </div>

        {/* ── 1-Click Sample Documents ── */}
        <div className="px-4 py-3 border-t border-b border-white/[0.06] bg-white/[0.01]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3 h-3 text-brand-400" /> Quick Test Sample PDFs
          </span>
          <div className="space-y-1.5">
            {sampleDocs.map((sample) => {
              const Icon = sample.icon
              const isLoading = loadingSample === sample.filename
              return (
                <button
                  key={sample.filename}
                  onClick={() => handleLoadSample(sample)}
                  disabled={uploading || Boolean(loadingSample)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-brand-500/40 hover:bg-brand-500/10 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin flex-none" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-brand-400 flex-none group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                      {sample.title}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border flex-none ${sample.badgeColor}`}>
                    {sample.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Loaded Documents Search & Stats ── */}
        <div className="p-4 pb-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-brand-400" /> Indexed Documents
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {filteredDocs.length} docs · {totalChunks} chunks
            </span>
          </div>

          {documents.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search indexed files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500/50"
              />
            </div>
          )}
        </div>

        {/* ── Active Documents List ── */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-center text-slate-400">
              <FileText className="w-7 h-7 mb-2 opacity-30 text-brand-400" />
              <p className="text-xs font-medium">No documents loaded yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click a sample above or drop a PDF</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.filename}
                onClick={() => onSelectDocument?.(doc.filename)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group
                  ${
                    activeDocument === doc.filename
                      ? 'bg-brand-500/15 border-brand-500/50 shadow-glow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText
                    className={`w-4 h-4 flex-none transition-colors ${
                      activeDocument === doc.filename ? 'text-brand-300' : 'text-brand-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                      {doc.filename}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {doc.chunks || 0} chunks · {doc.pages || 1} pgs
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Footer Tools: Telemetry Modal Trigger & Reset ── */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] space-y-2">
          <button
            onClick={() => setShowInspector(true)}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-brand-400" /> Pipeline Inspector Trace
          </button>

          {documents.length > 0 && (
            <button
              onClick={onRequestClear}
              disabled={clearing}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all disabled:opacity-50"
            >
              {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {clearing ? 'Clearing Index…' : 'Reset Knowledge Base'}
            </button>
          )}
        </div>

        {/* ── Observability Modal ── */}
        <PipelineInspectorModal
          isOpen={showInspector}
          onClose={() => setShowInspector(false)}
          currentFile={activeFile}
          pipelineMetrics={pipelineMetrics}
          uploading={uploading}
          uploadStatus={uploadStatus}
          errorMsg={errorMsg}
        />
      </aside>
    </>
  )
}
