import { openai } from './mastra';
import OpenAI from 'openai';
import { embedMany } from "ai";
import { openai as aiOpenAI } from "@ai-sdk/openai";

export interface DocumentChunk {
  content: string;
  metadata: {
    fileName: string;
    page: number;
    chunkIndex: number;
  };
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse/lib/pdf-parse');
    const pdf = pdfParse.default || pdfParse;
    
    const data = await pdf(buffer);
    console.log('PDF text extracted successfully');
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      console.log('PDF text extracted successfully (fallback)');
      return data.text;
    } catch (fallbackError) {
      console.error('Fallback PDF parsing also failed:', fallbackError);
      throw new Error('Failed to extract text from PDF');
    }
  }
}

export function chunkText(text: string, fileName: string, chunkSize: number = 1000, overlap: number = 200): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          fileName,
          page: 1, 
          chunkIndex: chunkIndex++,
        }
      });
      
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 10));
      currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        fileName,
        page: 1,
        chunkIndex: chunkIndex++,
      }
    });
  }
  
  return chunks;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

export async function generateEmbeddings(
  chunks: DocumentChunk[], 
  batchSize: number = 25,
  onProgress?: (current: number, total: number) => void
): Promise<{ embedding: number[], metadata: any, content: string }[]> {
    console.log('generating embeddings chunks using mastra');
    
    const allEmbeddings: { embedding: number[], metadata: any, content: string }[] = [];
    const totalBatches = Math.ceil(chunks.length / batchSize);
    
    // Process chunks in batches to avoid token limits
    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const chunkTexts = batch.map(chunk => chunk.content);
        const currentBatch = Math.floor(i / batchSize) + 1;
        
        console.log(`Processing batch ${currentBatch}/${totalBatches} (${chunkTexts.length} chunks)`);
        
        if (onProgress) {
          onProgress(currentBatch, totalBatches);
        }
        
        try {
            const batchEmbeddings = await retryWithBackoff(async () => {
              const { embeddings } = await embedMany({
                  model: aiOpenAI.embedding("text-embedding-3-small"),
                  values: chunkTexts,
              });
              
              return batch.map((chunk, index) => {
                  const embedding = embeddings[index];
                  
                  return {
                      embedding: embedding as number[],
                      metadata: chunk.metadata,
                      content: chunk.content,
                  };
              });
            }, 3, 2000);
            
            allEmbeddings.push(...batchEmbeddings);
            
            // Add longer delay between batches to prevent connection issues
            if (i + batchSize < chunks.length) {
                await sleep(500);
            }
        } catch (error) {
            console.error(`Error processing batch ${currentBatch}:`, error);
            throw new Error(`Failed to process batch ${currentBatch}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    console.log('embedding successful');
    console.log('embeddings validated');
    return allEmbeddings;
}
