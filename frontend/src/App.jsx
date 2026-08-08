import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'

/**
 * App — Root component.
 * Manages shared state: documents[] and passes it down to Sidebar & ChatWindow.
 */
export default function App() {
  const [documents, setDocuments] = useState([])

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
        />

        {/* Main chat area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <ChatWindow documents={documents} />
        </main>
      </div>
    </div>
  )
}
