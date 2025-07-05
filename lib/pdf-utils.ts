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

export async function generateEmbeddings(chunks: DocumentChunk[]): Promise<{ embedding: number[], metadata: any, content: string }[]> {
    console.log('generating embeddings chunks using mastra');
    
    const chunkTexts = chunks.map(chunk => chunk.content);
    
    const { embeddings } = await embedMany({
      model: aiOpenAI.embedding("text-embedding-3-small"),
      values: chunkTexts,
    });
    
    console.log('embedding successfull');
    
    const validatedEmbeddings = chunks.map((chunk, index) => {
      const embedding = embeddings[index];

      return {
        embedding: embedding as number[],
        metadata: chunk.metadata,
        content: chunk.content,
      };
    });
    
    console.log('embeddings validated');
    return validatedEmbeddings;
}
