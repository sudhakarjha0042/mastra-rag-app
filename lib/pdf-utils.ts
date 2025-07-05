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
    // Dynamic import to avoid module loading issues
    const pdfParse = await import('pdf-parse/lib/pdf-parse');
    const pdf = pdfParse.default || pdfParse;
    
    const data = await pdf(buffer);
    console.log('PDF text extracted successfully');
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // Fallback: try alternative approach
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
  try {
    console.log('Generating embeddings for chunks using Mastra AI');
    
    const chunkTexts = chunks.map(chunk => chunk.content);
    
    const { embeddings } = await embedMany({
      model: aiOpenAI.embedding("text-embedding-ada-002"),
      values: chunkTexts,
    });
    
    console.log('Embeddings generated successfully, validating format...');
    
    const validatedEmbeddings = chunks.map((chunk, index) => {
      const embedding = embeddings[index];
      
      if (!Array.isArray(embedding) || !embedding.every(val => typeof val === 'number')) {
        console.error('Invalid embedding format at index:', index, typeof embedding);
        throw new Error(`Invalid embedding format at index ${index}: expected number array`);
      }
      
      return {
        embedding: embedding as number[],
        metadata: chunk.metadata,
        content: chunk.content,
      };
    });
    
    console.log('All embeddings validated successfully');
    return validatedEmbeddings;
  } catch (error) {
    console.error('Error generating embeddings with Mastra AI:', error);
    
    if (!openai) {
      console.error('OpenAI client not initialized');
      throw new Error('Failed to generate embeddings: OpenAI client not available');
    }
    
    console.log('Falling back to direct OpenAI embedding generation...');
    const embeddings = [];
    
    for (const chunk of chunks) {
      try {
        console.log('Fallback: Generating embedding for chunk:', chunk.metadata.chunkIndex);
        
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk.content,
        });
        
        if (!response.data[0].embedding) {
          throw new Error('Invalid embedding response from OpenAI');
        }
        
        // Validate embedding format
        const embedding = response.data[0].embedding;
        if (!Array.isArray(embedding) || !embedding.every(val => typeof val === 'number')) {
          throw new Error('Invalid embedding format from OpenAI API');
        }
        
        embeddings.push({
          embedding: embedding,
          metadata: chunk.metadata,
          content: chunk.content,
        });
      } catch (chunkError) {
        console.error('Error generating embedding for chunk:', chunk.metadata.chunkIndex, chunkError);
        throw new Error(`Failed to generate embeddings: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`);
      }
    }
    
    return embeddings;
  }
}
