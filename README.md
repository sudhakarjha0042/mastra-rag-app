# Chat with PDF - Mastra AI Application

A Next.js application that allows users to upload PDF documents and chat with their content using Mastra AI, OpenAI, and Pinecone vector database.

## Features

- PDF upload and text extraction
- Document chunking and vectorization
- Vector storage in Pinecone database
- RAG (Retrieval Augmented Generation) using Mastra AI
- Real-time chat interface
- OpenAI embeddings and completions

## Prerequisites

Before running this application, you need:

1. **OpenAI API Key** - For embeddings and chat completions
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

1. **Upload a PDF**: Click on the upload area and select a PDF file
2. **Wait for Processing**: The app will extract text, create chunks, generate embeddings, and store them in Pinecone
3. **Start Chatting**: Once uploaded, you can ask questions about the PDF content
4. **Get Answers**: The app uses RAG to find relevant content and generate responses

## Architecture

### Components

- **PDFUpload**: Handles file upload and processing
- **ChatInterface**: Provides the chat UI and message handling
- **Mastra Configuration**: Sets up RAG engine with OpenAI and Pinecone

### API Routes

- **`/api/upload`**: Processes PDF uploads, extracts text, and stores vectors
- **`/api/chat`**: Handles chat messages and generates responses using RAG

### Libraries Used

- **@mastra/core**: Core Mastra AI functionality
- **@mastra/rag**: RAG (Retrieval Augmented Generation) engine
- **openai**: OpenAI API client for embeddings and completions
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
