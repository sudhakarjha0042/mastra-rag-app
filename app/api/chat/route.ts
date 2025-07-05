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
    
    // First check if we have any documents at all
    const stats = await index.describeIndexStats();
    console.log('Index stats:', stats);
    
    if (stats.totalRecordCount === 0) {
      return NextResponse.json({
        response: "No documents have been uploaded yet. Please upload a PDF document first to enable question answering.",
        debug: { indexEmpty: true }
      });
    }
    
    const results = await index.query({
      vector: embedding,
      topK: 10,
      includeMetadata: true,
    });

    // console.log('Search results:', results);
    console.log('First match metadata:', results.matches?.[0]?.metadata);
    console.log('Number of matches found:', results.matches?.length);
    console.log('Match scores:', results.matches?.map(m => m.score));

    const searchResults = results.matches || [];

    const context = searchResults
      .filter(match => match.score && match.score > 0.1) // Lowered threshold
      .map(match => match.metadata?.content)
      .filter(Boolean)
      .join('\n\n');

    console.log('Context length:', context.length);
    console.log('Filtered matches:', searchResults.filter(match => match.score && match.score > 0.1).length);

    if (!context || context.trim().length === 0) {
      return NextResponse.json({
        response: "I couldn't find relevant information in the uploaded documents to answer your question. Please make sure you've uploaded a PDF document first.",
        debug: {
          totalMatches: searchResults.length,
          scoresAboveThreshold: searchResults.filter(match => match.score && match.score > 0.1).length,
          topScores: searchResults.slice(0, 3).map(m => ({ score: m.score, hasContent: !!m.metadata?.content }))
        }
      });
    }

    const { text } = await generateText({
      model: openai("gpt-4"),
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based on the provided context from uploaded documents. 
          
          Guidelines:
          - Use the provided context to answer questions accurately
          - If the context contains relevant information, provide a detailed answer
          - You can make reasonable inferences from the context
          - If the context doesn't contain enough information to answer the question, say so clearly
          - Always be helpful and try to extract useful information from what's available`
        },
        {
          role: "user",
          content: `Based on the following document content, please answer my question:

Context from documents:
${context}

Question: ${message}

Please provide a helpful answer based on the above context.`
        }
      ],
    });

    return NextResponse.json({
      response: text,
      context,
      sources: searchResults.filter(match => match.score && match.score > 0.1).length,
    });

  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}


