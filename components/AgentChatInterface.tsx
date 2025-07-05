'use client';

import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceDocument[];
}

interface SourceDocument {
  fileName: string;
  year: string | null;
  relevanceScore: number;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  sources?: SourceDocument[];
  relevantChunks?: number;
  hasConversationHistory?: boolean;
}

export default function AgentChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showSources, setShowSources] = useState(false);

  // Generate session ID on component mount
  useEffect(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  // Sample questions for Berkshire Hathaway analysis
  const sampleQuestions = [
    "What are Warren Buffett's key investment principles?",
    "How does Berkshire Hathaway evaluate potential acquisitions?",
    "What is Buffett's view on market volatility?",
    "How has Berkshire's investment strategy evolved over the years?",
    "What does Buffett say about intrinsic value?",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input.trim(), 
          sessionId: sessionId 
        }),
      });

      const result: ChatResponse = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
        sources: result.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please ensure you have uploaded Berkshire Hathaway shareholder letters.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setInput(question);
  };

  const clearConversation = () => {
    setMessages([]);
    // Generate new session ID to start fresh
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  };

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-content">
          <h3 className="chat-title">Berkshire Hathaway Financial Analyst</h3>
          <p className="chat-subtitle">Powered by Warren Buffett&apos;s Shareholder Letters</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowSources(!showSources)}
            className="toggle-sources-btn"
            title="Toggle source citations"
          >
            📚 Sources
          </button>
          <button 
            onClick={clearConversation}
            className="clear-chat-btn"
            title="Clear conversation"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Sample Questions */}
      {messages.length === 0 && (
        <div className="sample-questions">
          <h4>Try asking about:</h4>
          <div className="questions-grid">
            {sampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSampleQuestion(question)}
                className="sample-question-btn"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="analyst-avatar">📊</div>
            <p className="empty-chat-title">Warren Buffett Financial Analyst Ready</p>
            <p className="empty-chat-text">
              Ask me about investment principles, business strategies, or any insights from Berkshire Hathaway&apos;s shareholder letters
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className={`message-bubble ${message.role}`}>
                <div className="message-content">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                  
                  {/* Source Citations */}
                  {message.sources && message.sources.length > 0 && showSources && (
                    <div className="message-sources">
                      <h5>📄 Sources:</h5>
                      <ul>
                        {message.sources.map((source, idx) => (
                          <li key={idx} className="source-item">
                            <strong>{source.fileName}</strong>
                            {source.year && <span className="source-year"> ({source.year})</span>}
                            <span className="relevance-score">
                              {Math.round(source.relevanceScore * 100)}% relevance
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="message-meta">
                  <p className={`message-time ${message.role}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  {message.sources && message.sources.length > 0 && (
                    <span className="source-count">
                      {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <div className="analyst-avatar-small">📊</div>
              <div className="typing-content">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Analyzing shareholder letters...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Warren Buffett's investment philosophy..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? (
              <span className="send-spinner"></span>
            ) : (
              'Analyze'
            )}
          </button>
        </form>
      </div>

      {/* Session Info */}
      {sessionId && (
        <div className="session-info">
          <small>Session: {sessionId.slice(-8)}</small>
        </div>
      )}
    </div>
  );
}
