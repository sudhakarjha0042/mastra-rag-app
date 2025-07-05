# Berkshire Hathaway Intelligence - RAG Agent Application

A sophisticated Next.js application that transforms Warren Buffett's shareholder letters into an intelligent financial analyst using Mastra AI agents, OpenAI GPT-4o, and Pinecone vector database.

## 🎯 Phase 3 Features: Advanced RAG Agent

### AI Financial Analyst Agent
- **Specialized Expertise**: Trained on Warren Buffett's investment philosophy and Berkshire Hathaway's business strategy
- **Intelligent Memory**: Maintains conversation context across sessions for follow-up questions
- **Source Attribution**: Provides specific citations from shareholder letters with year attribution
- **Expert System Prompts**: Configured with financial analysis expertise and response formatting guidelines

### Enhanced RAG Capabilities
- **GPT-4o Integration**: Powered by OpenAI's most advanced model through Mastra's LLM setup
- **Persistent Memory**: Conversation continuity with session management
- **Context-Aware Responses**: References previous conversations for coherent multi-turn dialogues
- **Document Intelligence**: Automatically extracts years and provides temporal context

### Core Features
- PDF upload and text extraction for financial documents
- Advanced document chunking and vectorization
- Vector storage in Pinecone database with 1536-dimensional embeddings
- Dual chat modes: AI Financial Analyst (Agent) and Regular Chat
- Real-time chat interface with source citations
- Session-based conversation memory
- Mobile-responsive design optimized for financial analysis

## Prerequisites

Before running this application, you need:

1. **OpenAI API Key** - For embeddings and GPT-4o completions
2. **Pinecone API Key** - For vector database storage
3. **Node.js** - Version 18 or higher

## Setup Instructions

### 1. Environment Variables

Copy the `.env.local` file and update it with your API keys:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=pdf-chat-index

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Pinecone Setup

1. Sign up for a [Pinecone account](https://www.pinecone.io/)
2. Create a new index with the following settings:
   - **Index Name**: `pdf-chat-index` (or update the name in `.env.local`)
   - **Dimensions**: `1536` (for OpenAI text-embedding-ada-002)
   - **Metric**: `cosine`
   - **Environment**: Note your environment (e.g., `us-east1-gcp`)

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## How to Use

### For Warren Buffett Investment Analysis

1. **Upload Shareholder Letters**: 
   - Click on the upload area and select Berkshire Hathaway annual shareholder letters
   - Recommended: Upload multiple years (1977-present) for comprehensive analysis
   - The system will extract text, create semantic chunks, and store them with temporal context

2. **Choose AI Financial Analyst Mode**: 
   - After upload, select "AI Financial Analyst (Recommended)" from the chat mode dropdown
   - This activates the specialized Mastra agent trained in Warren Buffett's philosophy

3. **Start Financial Analysis**: 
   - Ask about investment principles, business strategies, or specific financial concepts
   - Try sample questions like "What are Warren Buffett's key investment principles?"
   - The agent maintains conversation context for follow-up questions

4. **Get Expert Insights**: 
   - Receive comprehensive responses with direct quotes from shareholder letters
   - See source attributions with specific years and relevance scores
   - Access year-by-year evolution of strategies and viewpoints

### Sample Questions for Best Results
- "How does Berkshire Hathaway evaluate potential acquisitions?"
- "What is Warren Buffett's view on market volatility and timing?"
- "How has Berkshire's investment strategy evolved over the decades?"
- "What does Buffett say about intrinsic value calculation?"
- "How does Berkshire approach capital allocation decisions?"

### Regular Chat Mode
- Switch to "Regular Chat" for basic document Q&A without agent intelligence
- Suitable for general document queries and simple fact extraction

## Architecture

### Enhanced Components

- **AgentChatInterface**: Advanced chat UI with session management and source citations
- **ChatInterface**: Basic chat interface for regular document Q&A  
- **PDFUpload**: Enhanced file upload with financial document guidance
- **Mastra Configuration**: Sets up RAG engine with OpenAI and Pinecone

### API Routes

- **`/api/upload`**: Processes PDF uploads, extracts text, and stores vectors with temporal metadata
- **`/api/agent-chat`**: Powered by Mastra agent with GPT-4o for intelligent financial analysis
- **`/api/chat`**: Basic RAG chat endpoint for regular document Q&A

### Agent Architecture

- **Financial Analyst Agent**: Specialized Mastra agent with Warren Buffett expertise
- **Memory Management**: Session-based conversation tracking and context maintenance
- **Source Attribution**: Automatic citation generation with year extraction
- **Response Formatting**: Structured responses with quotes and source references

### Enhanced Libraries

- **@mastra/core**: Core Mastra AI functionality with agent architecture
- **@mastra/rag**: RAG (Retrieval Augmented Generation) engine  
- **@mastra/pinecone**: Pinecone vector database integration
- **@ai-sdk/openai**: OpenAI SDK for GPT-4o and embeddings
- **@pinecone-database/pinecone**: Pinecone vector database client
- **pdf-parse**: PDF text extraction
- **Next.js**: React framework for the web application

## File Structure

```
mastra-rag-app/
├── app/
│   ├── api/
│   │   ├── upload/route.ts     # PDF upload and processing
│   │   └── chat/route.ts       # Chat message handling
│   ├── components.css          # Custom styles
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── components/
│   ├── PDFUpload.tsx           # PDF upload component
│   └── ChatInterface.tsx       # Chat UI component
├── lib/
│   ├── mastra.ts               # Mastra AI configuration
│   └── pdf-utils.ts            # PDF processing utilities
├── .env.local                  # Environment variables
└── package.json
```

## Troubleshooting

### Common Issues

1. **PDF Upload Fails**
   - Check if the file is a valid PDF
   - Ensure the file size is under 10MB
   - Verify OpenAI API key is correct

2. **Chat Not Working**
   - Verify Pinecone configuration
   - Check if vectors were stored successfully
   - Ensure OpenAI API key has sufficient credits

3. **No Relevant Answers**
   - The similarity threshold might be too high (0.7)
   - Try asking more specific questions
   - Ensure the PDF contains relevant text content

### Environment Issues

- Make sure all environment variables are set correctly
- Verify Pinecone index exists with correct dimensions (1536)
- Check OpenAI API key permissions and rate limits

## License

This project is for educational purposes. Please ensure you comply with the terms of service for OpenAI and Pinecone when using their services.
