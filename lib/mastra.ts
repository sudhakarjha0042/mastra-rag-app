import { PineconeVector } from '@mastra/pinecone'
import { embedMany } from "ai";
import OpenAI from 'openai';
import { MDocument } from "@mastra/rag";

let openai: OpenAI;

const store = new PineconeVector({
  apiKey: process.env.PINECONE_API_KEY,
});


export async function initializePineconeIndexes() {
  try {
    await store.createIndex({
      indexName: "mastra-rag-documents-1536",
      dimension: 1536,
    });
    console.log("Pinecone index 'mastra-rag-documents-1536' created or already exists");
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
    const indexName = 'mastra-rag-documents-1536';
    return await store.query({
      indexName,
      ...params,
    });
  },
  upsert: async (vectors: any[]) => {
    const indexName = 'mastra-rag-documents-1536'; 
    
    try {
      await store.createIndex({
        indexName,
        dimension: 1536, 
      });
      console.log(`Index ${indexName} created or verified with 1536 dimensions`);
    } catch (error) {
      console.log('Index creation result:', error);
    }
    
    const vectorData = vectors.map((v, index) => {
      if (!v.id || !v.values || !Array.isArray(v.values)) {
        console.error('Invalid vector format at index:', index, v);
        throw new Error(`Invalid vector format at index ${index}`);
      }
      
      console.log(`Vector ${index} dimension:`, v.values.length); 
      return v.values; 
    });
    
    const metadata = vectors.map(v => v.metadata || {});
    
    console.log('Upserting vectors to Pinecone:', vectors.length);
    
    return await store.upsert({
      indexName,
      vectors: vectorData,
      metadata: metadata
    });
  },
};

export { openai, store };