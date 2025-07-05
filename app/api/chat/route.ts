import { NextRequest, NextResponse } from 'next/server';
import { openai } from "@ai-sdk/openai";
import { embed, generateText } from "ai";
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

    const { embedding } = await embed({
      value: message,
      model: openai.embedding("text-embedding-3-small"),
    });
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    
    const index = pinecone.index("mastra-rag-documents-1536");
    const results = await index.query({
      vector: embedding,
      topK: 10,
      includeMetadata: true,
    });

    // console.log('Search results:', results);
    console.log('First match metadata:', results.matches?.[0]?.metadata);

    const searchResults = results.matches || [];

    const context = searchResults
      .filter(match => match.score && match.score > 0.2)
      .map(match => match.metadata?.content)
      .filter(Boolean)
      .join('\n\n');

    if (!context) {
      return NextResponse.json({
        response: "I couldn't find relevant information in the uploaded documents to answer your question. Please make sure you've uploaded a PDF document first.",
      });
    }

    const { text } = await generateText({
      model: openai("gpt-4"),
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on the provided context. Only use information from the context to answer questions. If the context doesn't contain relevant information, say so."
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${message}`
        }
      ],
    });

    return NextResponse.json({
      response: text,
      context,
      sources: searchResults.filter(match => match.score && match.score > 0.2).length,
    });

  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}


