import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, Info, Trash2, X } from 'lucide-react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import { clearKnowledgeBase } from './api.js'

/**
 * Custom Confirmation Modal Component
 */
function ConfirmModal({ isOpen, title, message, confirmText, confirmVariant = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null

  const isDanger = confirmVariant === 'danger'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-surface-1 border border-white/[0.12] shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-none ${
              isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-brand-500/20 text-brand-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-white/[0.08]">
          <button
            onClick={onCancel}
            className="btn-ghost !px-4 !py-2 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/30'
            }`}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Toast Notification Pill
 */
function ToastNotification({ toast, onClose }) {
  if (!toast) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface-2 border border-white/[0.12] shadow-2xl text-xs text-slate-200 animate-slide-up">
      {toast.type === 'success' ? (
        <CheckCircle className="w-4 h-4 text-emerald-400 flex-none" />
      ) : (
        <Info className="w-4 h-4 text-brand-400 flex-none" />
      )}
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/**
 * App — Root application component with state management,
 * custom confirmation dialogs, mobile drawers, and toast alerts.
 */
export default function App() {
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([])
  const [activeDocument, setActiveDocument] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false })
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleRequestClearKnowledgeBase = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Knowledge Base?',
      message: 'This will purge all indexed document vectors and embeddings from the MongoDB Atlas vector database.',
      confirmText: 'Purge Index',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false })
        setClearing(true)
        try {
          await clearKnowledgeBase()
          setDocuments([])
          setMessages([])
          setActiveDocument(null)
          showToast('Knowledge base purged successfully.', 'success')
        } catch (err) {
          console.error('Failed to clear knowledge base:', err)
          showToast('Failed to clear knowledge base: ' + (err.message || 'Unknown error'), 'error')
        } finally {
          setClearing(false)
        }
      },
      onCancel: () => setConfirmDialog({ isOpen: false }),
    })
  }

  const handleRequestClearChat = () => {
    if (messages.length === 0) return
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Chat History?',
      message: 'This will clear all messages in the current conversation thread while keeping indexed documents.',
      confirmText: 'Clear Messages',
      confirmVariant: 'danger',
      onConfirm: () => {
        setMessages([])
        setConfirmDialog({ isOpen: false })
        showToast('Chat history cleared.', 'info')
      },
      onCancel: () => setConfirmDialog({ isOpen: false }),
    })
  }

  return (
    <div className="flex flex-col h-screen bg-surface-0 text-slate-100 overflow-hidden select-none">
      {/* Top Global Status Bar */}
      <Header
        documentCount={documents.length}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        messages={messages}
        onClearChat={handleRequestClearChat}
      />

      {/* Body: Sidebar Drawer + Main Chat View */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Knowledge Manager Sidebar */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          documents={documents}
          onDocumentsChange={(docs) => {
            setDocuments(docs)
            if (docs.length > 0 && !activeDocument) {
              setActiveDocument(docs[docs.length - 1].filename)
            }
          }}
          activeDocument={activeDocument}
          onSelectDocument={setActiveDocument}
          clearing={clearing}
          onRequestClear={handleRequestClearKnowledgeBase}
        />

        {/* Conversational Retrieval Main Stage */}
        <main className="flex-1 min-w-0 flex flex-col relative">
          <ChatWindow
            documents={documents}
            messages={messages}
            setMessages={setMessages}
            onClearChat={handleRequestClearChat}
          />
        </main>
      </div>

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
