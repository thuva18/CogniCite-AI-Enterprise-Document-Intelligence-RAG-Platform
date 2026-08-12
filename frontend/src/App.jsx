import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import { clearKnowledgeBase } from './api.js'

/**
 * App — Root component.
 * Manages shared state: documents[], messages[], active document.
 * Passes it down to Sidebar & ChatWindow.
 */
export default function App() {
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([])
  const [activeDocument, setActiveDocument] = useState(null)
  const [clearing, setClearing] = useState(false)

  const handleClearKnowledgeBase = async () => {
    if (!window.confirm("Are you sure you want to delete all indexed documents from the vector database? This cannot be undone.")) {
      return
    }
    
    setClearing(true)
    try {
      await clearKnowledgeBase()
      setDocuments([])
      setMessages([])
      setActiveDocument(null)
      // We could add a toast notification here
    } catch (err) {
      console.error("Failed to clear knowledge base:", err)
      alert("Failed to clear knowledge base: " + (err.message || "Unknown error"))
    } finally {
      setClearing(false)
    }
  }

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([])
    }
  }

  return (
    <div className="flex flex-col h-screen bg-surface-0 overflow-hidden">
      {/* Global top status bar */}
      <Header documentCount={documents.length} />

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — upload & doc manager */}
        <Sidebar
          documents={documents}
          onDocumentsChange={setDocuments}
          activeDocument={activeDocument}
          onSelectDocument={setActiveDocument}
          clearing={clearing}
          onClear={handleClearKnowledgeBase}
        />

        {/* Main chat area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <ChatWindow 
            documents={documents} 
            messages={messages}
            setMessages={setMessages}
            onClearChat={handleClearChat}
          />
        </main>
      </div>
    </div>
  )
}
