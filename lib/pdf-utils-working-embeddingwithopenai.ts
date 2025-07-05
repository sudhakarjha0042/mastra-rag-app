import { openai } from './mastra';
import OpenAI from 'openai';

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
      const overlapWords = words.slice(-Math.floor(overlap / 10)); // Approximate overlap
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
  const embeddings = [];
  
  // Validate OpenAI client
  if (!openai) {
    console.error('OpenAI client not initialized');
    
    // Try to initialize OpenAI if environment variable is available
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      
      // Process chunks with the new client
      for (const chunk of chunks) {
        try {
          console.log('Generating embedding for chunk:', chunk.metadata.chunkIndex);
          
          const response = await client.embeddings.create({
            model: 'text-embedding-ada-002',
            input: chunk.content,
          });
          
          if (!response.data[0].embedding) {
            throw new Error('Invalid embedding response from OpenAI');
          }
          
          embeddings.push({
            embedding: response.data[0].embedding,
            metadata: chunk.metadata,
            content: chunk.content,
          });
        } catch (error) {
          console.error('Error generating embedding for chunk:', chunk.metadata.chunkIndex, error);
          throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      return embeddings;
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('OpenAI client not available');
    }
  }
  
  // If openai client exists, use it
  for (const chunk of chunks) {
    try {
      console.log('Generating embedding for chunk:', chunk.metadata.chunkIndex);
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk.content,
      });
      
      if (!response.data[0].embedding) {
        throw new Error('Invalid embedding response from OpenAI');
      }
      
      embeddings.push({
        embedding: response.data[0].embedding,
        metadata: chunk.metadata,
        content: chunk.content,
      });
    } catch (error) {
      console.error('Error generating embedding for chunk:', chunk.metadata.chunkIndex, error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return embeddings;
}
