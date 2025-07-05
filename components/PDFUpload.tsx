'use client';

import { useState } from 'react';

interface PDFUploadProps {
  onUploadSuccess: () => void;
}

export default function PDFUpload({ onUploadSuccess }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid PDF file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress({ current: 0, total: 0 });

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        onUploadSuccess();
        setProgress({ current: 0, total: 0 });
      } else {
        setError(result.error || 'Failed to upload PDF');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <svg
            className="upload-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="upload-title">Upload Your PDF Document</h2>
          <p className="upload-subtitle">
            Select a PDF file to start chatting with its content
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="upload-dropzone">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="upload-input"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
              <div className="upload-text">
                <span className="upload-link">Click to upload</span>
                {' '}or drag and drop
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                PDF files only (Max 10MB)
              </div>
            </label>
          </div>

          {file && (
            <div className="file-info">
              <div className="file-details">
                <svg
                  className="file-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="remove-btn">
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="upload-btn"
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="loading-spinner"></span>
                  Processing PDF...
                </div>
                {progress.total > 0 && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Processing embeddings: {progress.current}/{progress.total} batches
                  </div>
                )}
              </div>
            ) : (
              'Upload and Process PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
