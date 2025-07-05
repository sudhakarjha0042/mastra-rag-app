import { NextRequest, NextResponse } from 'next/server';
// import { openai, queryDocuments } from '@/lib/mastra';

import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Convert query to embedding
    const { embedding } = await embed({
      value: message,
      model: openai.embedding("text-embedding-3-small"),
    });
    
    // Query vector store
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    
    const index = pinecone.index("mastra-rag-documents-1536");
    const results = await index.query({
      vector: embedding,
      topK: 10,
      includeMetadata: true,
    });

    console.log('Search results:', results);

    const searchResults = results.matches || [];

    const context = searchResults
      .filter(match => match.score && match.score > 0.4)
      .map(match => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n');

    if (!context) {
      return NextResponse.json({
        response: "I couldn't find relevant information in the uploaded documents to answer your question. Please make sure you've uploaded a PDF document first.",
      });
    }

    return NextResponse.json({
      context,
      sources: searchResults.length,
    });

  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

  
