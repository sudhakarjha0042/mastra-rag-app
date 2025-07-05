import { NextRequest, NextResponse } from 'next/server';
import { index as vectorStore } from '@/lib/mastra';
import { extractTextFromPDF, chunkText, generateEmbeddings } from '@/lib/pdf-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Please upload a valid PDF file' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const text = await extractTextFromPDF(buffer);
    console.log(`Extracted text from ${file.name}:`, text.slice(0, 100)); // Log first 100 characters
    
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No text found in the PDF' },
        { status: 400 }
      );
    }

    // Split text into chunks
    const chunks = chunkText(text, file.name);
    
    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Store in Pinecone
    const vectors = embeddings.map((embedding, i) => ({
      id: `${file.name}-${Date.now()}-${i}`,
      values: embedding.embedding,
      metadata: {
        ...embedding.metadata,
        content: embedding.content,
        uploadedAt: new Date().toISOString(),
      },
    }));

    await vectorStore.upsert(vectors);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${chunks.length} chunks from ${file.name}`,
      chunksProcessed: chunks.length,
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
