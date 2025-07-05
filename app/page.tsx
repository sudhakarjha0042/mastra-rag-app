'use client';

import { useState } from 'react';
import PDFUpload from '@/components/PDFUpload';
import ChatInterface from '@/components/ChatInterface';
import './components.css';

export default function Home() {
  const [isPdfUploaded, setIsPdfUploaded] = useState(false);

  return (
    <div className="page-container">
      <div className="container">
        <header className="header">
          <h1>Chat with PDF</h1>
          <p>Upload a PDF document and ask questions about its content</p>
        </header>

        <div className="main-content">
          {!isPdfUploaded ? (
            <PDFUpload onUploadSuccess={() => setIsPdfUploaded(true)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="success-message">
                <p className="success-text">
                  ✅ PDF uploaded successfully! You can now ask questions about the document.
                </p>
                <button
                  onClick={() => setIsPdfUploaded(false)}
                  className="upload-another-btn"
                >
                  Upload another PDF
                </button>
              </div>
              <ChatInterface />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
