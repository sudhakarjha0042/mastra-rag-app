import { PineconeVector } from '@mastra/pinecone'
import { embedMany } from "ai";
import OpenAI from 'openai';
import { MDocument } from "@mastra/rag";
import { z } from "zod";

// Initialize the OpenAI client first before using it
let openai: OpenAI;

try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Warning: OPENAI_API_KEY environment variable is not set');
  } else {
    openai = new OpenAI({ apiKey });
    console.log('OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

// Initialize Pinecone vector store
const store = new PineconeVector({
  apiKey: process.env.PINECONE_API_KEY,
});

// Convert the top-level code to an example function
export async function exampleDocumentProcessing() {
  const doc = MDocument.fromText(`Your document text here...`);

  const chunks = await doc.chunk({
    strategy: "recursive",
    size: 512,
    overlap: 50,
  });
  
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  const { embeddings } = await embedMany({
    values: chunks.map((chunk) => chunk.text),
    model: openai.embedding("text-embedding-3-small"),
  });

  await store.createIndex({
    indexName: "mycollection",
    dimension: 1536,
  });
  
  await store.upsert({
    indexName: "mycollection",
    vectors: embeddings,
    metadata: chunks.map(chunk => ({ text: chunk.text })),
  });
}

// Optional: Initialize Pinecone indexes if needed
export async function initializePineconeIndexes() {
  try {
    await store.createIndex({
      indexName: "pazagopinecone",
      dimension: 1536,
    });
    console.log("Pinecone index 'pazagopinecone' created or already exists");
  } catch (error) {
    console.error("Error creating Pinecone index:", error);
  }
}

export async function processDocument(documentText: string) {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  const doc = MDocument.fromText(documentText);

  const chunks = await doc.chunk({
    strategy: 'recursive',
    size: 512,
    overlap: 50,
  });

  const { embeddings } = await embedMany({
    values: chunks.map((chunk) => chunk.text),
    model: openai.embedding('text-embedding-3-small'),
  });

  const indexName = process.env.PINECONE_INDEX_NAME?.toLowerCase() || 'rag-documents';
  await store.createIndex({
    indexName,
    dimension: 1536,
  });

  await store.upsert({
    indexName,
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({ text: chunk.text })),
  });

  return { chunksProcessed: chunks.length };
}

export async function queryDocuments(queryText: string, topK: number = 3) {
  const { embeddings } = await embedMany({
    values: [queryText],
    model: openai.embedding('text-embedding-3-small'),
  });

  const queryVector = embeddings[0];

  const indexName = process.env.PINECONE_INDEX_NAME?.toLowerCase() || 'rag-documents';
  const results = await store.query({
    indexName,
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return (
    results.matches?.map((match) => ({
      text: match.metadata?.text,
      score: match.score,
      id: match.id,
    })) || []
  );
}

export const index = {
  query: async (params: any) => {
    const indexName = process.env.PINECONE_INDEX_NAME?.toLowerCase() || 'rag-documents';
    return await store.query({
      indexName,
      ...params,
    });
  },
  upsert: async (vectors: any[]) => {
    const indexName = process.env.PINECONE_INDEX_NAME?.toLowerCase() || 'rag-documents';
    
    // Validate and format vectors properly
    const formattedVectors = vectors.map((v, index) => {
      if (!v.id || !v.embedding || !Array.isArray(v.embedding)) {
        console.error('Invalid vector format at index:', index, v);
        throw new Error(`Invalid vector format at index ${index}`);
      }
      
      return {
        id: v.id,
        values: v.embedding, // Ensure this is the number array
        metadata: v.metadata || {}
      };
    });
    
    console.log('Upserting vectors to Pinecone:', formattedVectors.length);
    
    return await store.upsert({
      indexName,
      vectors: formattedVectors
    });
  },
};

export { openai, store };