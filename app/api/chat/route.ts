import { NextRequest, NextResponse } from 'next/server';
import { openai, queryDocuments } from '@/lib/mastra';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use the queryDocuments function from mastra
    const searchResults = await queryDocuments(message, 5);

    // Extract relevant context from search results
    const context = searchResults
      .filter(match => match.score && match.score > 0.7)
      .map(match => match.text)
      .filter(Boolean)
      .join('\n\n');

    if (!context) {
      return NextResponse.json({
        response: "I couldn't find relevant information in the uploaded documents to answer your question. Please make sure you've uploaded a PDF document first.",
      });
    }

    // Generate response using OpenAI with context
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions based on the provided context from PDF documents. 
                   Use only the information from the context to answer questions. 
                   If the context doesn't contain enough information to answer the question, say so clearly.
                   
                   Context:
                   ${context}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      response,
      sources: searchResults.length,
    });

  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
    });

  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
