import React, { useRef, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Maximize2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Zap,
} from 'lucide-react'
import PipelineInspectorModal from './PipelineInspectorModal'
import { uploadFiles } from '../api'

export default function Sidebar({
  documents,
  onDocumentsChange,
  activeDocument,
  onSelectDocument,
  clearing,
  onClear,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [showInspector, setShowInspector] = useState(false)
  const [activeFile, setActiveFile] = useState(null)
  const [pipelineMetrics, setPipelineMetrics] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fileRef = useRef(null)

  const sampleDocs = [
    {
      filename: 'CogniCite_Architecture.pdf',
      title: 'CogniCite Architecture Spec',
      badge: 'RAG Pipeline',
      icon: Zap,
    },
    {
      filename: 'Global_Tech_Financial_2025.pdf',
      title: 'Global Tech Financial FY25',
      badge: 'Finance',
      icon: Sparkles,
    },
    {
      filename: 'AI_Security_Compliance.pdf',
      title: 'AI Governance & Privacy',
      badge: 'Security',
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

  const handleLoadSample = async (filename) => {
    try {
      const res = await fetch(`/sample_docs/${filename}`)
      if (!res.ok) throw new Error('Sample file not found')
      const blob = await res.blob()
      const file = new File([blob], filename, { type: 'application/pdf' })
      processFiles([file])
    } catch (err) {
      console.error('Failed to load sample:', err)
      setErrorMsg('Could not fetch sample PDF. Please upload manually.')
      setUploadStatus('error')
    }
  }

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="w-80 border-r border-white/10 bg-surface-2/95 flex flex-col h-full flex-none shadow-xl relative backdrop-blur-md select-none">
      {/* ── Brand Title Area ── */}
      <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight tracking-wide">
              CogniCite AI
            </h1>
            <p className="text-[10px] text-indigo-400/90 uppercase tracking-widest font-semibold">
              Enterprise RAG
            </p>
          </div>
        </div>

        {documents.length > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
            {documents.length} PDF{documents.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Upload Area ── */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            Upload PDF Knowledge
          </span>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Browse
          </button>
        </div>

        {/* Dropzone */}
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
            transition-all duration-300 select-none
            ${
              dragOver
                ? 'border-indigo-500 bg-indigo-500/10 shadow-glow-md scale-[1.01]'
                : 'border-white/15 hover:border-indigo-500/50 hover:bg-indigo-500/5 bg-white/[0.02]'
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
                <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
                <p className="text-xs font-semibold text-indigo-300">Processing Pipeline…</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowInspector(true)
                  }}
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 text-[11px] font-semibold hover:bg-indigo-500/30 transition-all duration-200 shadow-glow-sm pointer-events-auto"
                >
                  <Maximize2 className="w-3 h-3" /> View Live Progress
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
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/30 transition-all duration-200 shadow-glow-sm pointer-events-auto"
                >
                  <Maximize2 className="w-3 h-3" /> Inspect Telemetry
                </button>
              </>
            ) : (
              <>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${dragOver ? 'bg-indigo-500/25' : 'bg-indigo-500/10'}`}
                >
                  <UploadCloud
                    className={`w-5 h-5 transition-colors duration-300 ${dragOver ? 'text-indigo-300' : 'text-indigo-500'}`}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    {dragOver ? 'Drop PDF file' : 'Drag & drop PDF'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    or <span className="text-indigo-400 font-medium">browse local files</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error notice */}
        {uploadStatus === 'error' && (
          <p className="mt-2 text-[11px] text-red-400 flex items-center gap-1.5 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-none" />
            {errorMsg}
          </p>
        )}
      </div>

      {/* ── 1-Click Sample Test Documents ── */}
      <div className="px-4 py-2 border-t border-b border-white/[0.06] bg-white/[0.01]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
          <BookOpen className="w-3 h-3 text-indigo-400" />
          Quick Test Sample PDFs
        </span>
        <div className="space-y-1.5">
          {sampleDocs.map((sample) => (
            <button
              key={sample.filename}
              onClick={() => handleLoadSample(sample.filename)}
              disabled={uploading}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-indigo-400 flex-none group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                  {sample.title}
                </span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-indigo-500/20 text-indigo-300 flex-none">
                {sample.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Document List Header & Search ── */}
      <div className="p-4 pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Active Index
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{filteredDocs.length} loaded</span>
        </div>

        {documents.length > 2 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search documents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        )}
      </div>

      {/* ── Active Documents List ── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-center text-slate-500">
            <FileText className="w-7 h-7 mb-2 opacity-30 text-indigo-400" />
            <p className="text-xs font-medium">No documents loaded yet</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Click a sample above or drop a PDF</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.filename}
              onClick={() => onSelectDocument?.(doc.filename)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer group
                ${
                  activeDocument === doc.filename
                    ? 'bg-indigo-500/15 border-indigo-500/50 shadow-glow-sm'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15'
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText
                  className={`w-4 h-4 flex-none transition-colors ${activeDocument === doc.filename ? 'text-indigo-300' : 'text-indigo-400'}`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                    {doc.filename}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {doc.chunks} chunks · {doc.pages} pgs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-sm" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Reset Knowledge Base ── */}
      {documents.length > 0 && (
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01]">
          <button
            onClick={onClear}
            disabled={clearing}
            className="w-full flex items-center justify-center gap-2 py-2 px-3
              rounded-xl text-xs font-semibold text-red-400 bg-red-500/10
              border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40
              transition-all duration-200 disabled:opacity-50"
          >
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {clearing ? 'Clearing Index…' : 'Reset Knowledge Base'}
          </button>
        </div>
      )}

      {/* ── Meticulous Glass Inspector Modal ── */}
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
  )
}
