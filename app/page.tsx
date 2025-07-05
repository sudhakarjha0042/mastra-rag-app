'use client';

import { useState } from 'react';
import PDFUpload from '@/components/PDFUpload';
import ChatInterface from '@/components/ChatInterface';
import AgentChatInterface from '@/components/AgentChatInterface';
import './components.css';

type ChatMode = 'regular' | 'agent';

export default function Home() {
  const [isPdfUploaded, setIsPdfUploaded] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('agent');

  return (
    <div className="page-container">
      <div className="container">
        <header className="header">
          <h1>Berkshire Hathaway Intelligence</h1>
          <p>Upload Warren Buffett&apos;s shareholder letters and chat with an AI financial analyst</p>
        </header>

        <div className="main-content">
          {!isPdfUploaded ? (
            <div>
              <div className="upload-instructions">
                <h2>📄 Upload Berkshire Hathaway Documents</h2>
                <p>
                  Upload Warren Buffett&apos;s annual shareholder letters to enable intelligent financial analysis. 
                  The AI agent specializes in investment philosophy and business strategy insights.
                </p>
                <div className="recommended-docs">
                  <h3>Recommended Documents:</h3>
                  <ul>
                    <li>Berkshire Hathaway Annual Shareholder Letters (1977-present)</li>
                    <li>Warren Buffett&apos;s Chairman Letters</li>
                    <li>Berkshire Hathaway Annual Reports</li>
                  </ul>
                </div>
              </div>
              <PDFUpload onUploadSuccess={() => setIsPdfUploaded(true)} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="success-message">
                <div className="success-content">
                  <p className="success-text">
                    ✅ Financial documents uploaded successfully! Your AI analyst is ready.
                  </p>
                  <div className="mode-selector">
                    <label>Chat Mode:</label>
                    <select 
                      value={chatMode} 
                      onChange={(e) => setChatMode(e.target.value as ChatMode)}
                      className="mode-select"
                    >
                      <option value="agent">🤖 AI Financial Analyst (Recommended)</option>
                      <option value="regular">💬 Regular Chat</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setIsPdfUploaded(false)}
                  className="upload-another-btn"
                >
                  Upload more documents
                </button>
              </div>
              
              {chatMode === 'agent' ? (
                <AgentChatInterface />
              ) : (
                <ChatInterface />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
