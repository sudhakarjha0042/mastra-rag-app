import { NextRequest, NextResponse } from 'next/server';
import { financialAnalystAgent, addToMemory, getConversationHistory } from '@/lib/agent';
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use sessionId or generate one based on IP/timestamp for persistent memory
    const conversationId = sessionId || `session-${Date.now()}`;

    // Get conversation history for context
    const conversationHistory = getConversationHistory(conversationId);

    // Generate embedding for the user's question
    const { embedding } = await embed({
      value: message,
      model: openai.embedding("text-embedding-3-small"),
    });
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    
    const index = pinecone.index("mastra-rag-documents-1536");
    
    // Check if we have any documents
    const stats = await index.describeIndexStats();
    
    if (stats.totalRecordCount === 0) {
      return NextResponse.json({
        response: "No Berkshire Hathaway shareholder letters have been uploaded yet. Please upload Warren Buffett's shareholder letters first to enable my financial analysis capabilities.",
        sessionId: conversationId,
        debug: { indexEmpty: true }
      });
    }
    
    // Query vector database for relevant content
    const results = await index.query({
      vector: embedding,
      topK: 8,
      includeMetadata: true,
    });

    const searchResults = results.matches || [];
    const relevantDocs = searchResults
      .filter(match => match.score && match.score > 0.15) // Higher threshold for financial documents
      .map(match => ({
        content: match.metadata?.content,
        score: match.score,
        fileName: match.metadata?.fileName,
        year: extractYearFromFileName(match.metadata?.fileName as string)
      }))
      .filter(doc => doc.content);

    if (relevantDocs.length === 0) {
      return NextResponse.json({
        response: "I couldn't find relevant information in the uploaded Berkshire Hathaway shareholder letters to answer your question. Please ensure you've uploaded Warren Buffett's annual letters and try asking about specific investment principles, company strategies, or financial concepts mentioned in those letters.",
        sessionId: conversationId,
        debug: {
          totalMatches: searchResults.length,
          relevantMatches: 0,
          topScores: searchResults.slice(0, 3).map(m => ({ score: m.score, hasContent: !!m.metadata?.content }))
        }
      });
    }

    // Prepare context with source attribution
    const contextWithSources = relevantDocs
      .map(doc => `[Source: ${doc.fileName || 'Unknown'} ${doc.year ? `(${doc.year})` : ''}]\n${doc.content}`)
      .join('\n\n---\n\n');

    // Prepare the enhanced prompt with conversation history and RAG context
    const enhancedPrompt = `
Previous conversation context:
${conversationHistory ? `${conversationHistory}\n\n` : ''}

Current question: ${message}

Relevant content from Berkshire Hathaway shareholder letters:
${contextWithSources}

Please analyze the above content and provide a comprehensive response following your role as a financial analyst specializing in Warren Buffett's investment philosophy. Include specific quotes when relevant and cite the source letters with years.`;

    // Use the Mastra agent to generate response
    const agentResponse = await financialAnalystAgent.generate(enhancedPrompt);

    // Extract source documents for attribution
    const sourceDocuments = relevantDocs.map(doc => ({
      fileName: doc.fileName || 'Unknown Document',
      year: doc.year,
      relevanceScore: doc.score
    }));

    // Add to conversation memory
    addToMemory(conversationId, 'user', message);
    addToMemory(conversationId, 'assistant', agentResponse.text, sourceDocuments.map(s => `${s.fileName} (${s.year})`));

    return NextResponse.json({
      response: agentResponse.text,
      sessionId: conversationId,
      sources: sourceDocuments,
      relevantChunks: relevantDocs.length,
      hasConversationHistory: !!conversationHistory,
    });

  } catch (error) {
    console.error('Error in agent chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message with financial analyst agent' },
      { status: 500 }
    );
  }
}

// Helper function to extract year from filename
function extractYearFromFileName(fileName: string): string | null {
  if (!fileName) return null;
  
  // Look for 4-digit year pattern
  const yearMatch = fileName.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : null;
}
