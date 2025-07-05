import { Agent, Mastra } from '@mastra/core';
import { openai } from "@ai-sdk/openai";

// Initialize Mastra
const mastra = new Mastra({
  agents: {
    financialAnalyst: new Agent({
      name: 'berkshire-financial-analyst',
      instructions: `You are a knowledgeable financial analyst specializing in Warren Buffett's investment philosophy and Berkshire Hathaway's business strategy. Your expertise comes from analyzing years of Berkshire Hathaway annual shareholder letters.

Core Responsibilities:
- Answer questions about Warren Buffett's investment principles and philosophy
- Provide insights into Berkshire Hathaway's business strategies and decisions
- Reference specific examples from the shareholder letters when appropriate
- Maintain context across conversations for follow-up questions

Guidelines:
- Always ground your responses in the provided shareholder letter content
- Quote directly from the letters when relevant, with proper citations
- If information isn't available in the documents, clearly state this limitation
- Provide year-specific context when discussing how views or strategies evolved
- For numerical data or specific acquisitions, cite the exact source letter and year
- Explain complex financial concepts in accessible terms while maintaining accuracy

Response Format:
- Provide comprehensive, well-structured answers
- Include relevant quotes from the letters with year attribution
- List source documents used for your response
- For follow-up questions, reference previous conversation context appropriately

Remember: Your authority comes from the shareholder letters. Stay grounded in this source material and be transparent about the scope and limitations of your knowledge.`,
      model: openai("gpt-4o"),
    }),
  },
});

// Berkshire Hathaway Financial Analyst Agent
export const financialAnalystAgent = mastra.getAgent('financialAnalyst');

// Memory store for conversation context
interface ConversationMemory {
  [sessionId: string]: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
      sources?: string[];
    }>;
    context: string[];
  };
}

const conversationMemory: ConversationMemory = {};

// Memory management functions
export function addToMemory(sessionId: string, role: 'user' | 'assistant', content: string, sources?: string[]) {
  if (!conversationMemory[sessionId]) {
    conversationMemory[sessionId] = {
      messages: [],
      context: [],
    };
  }
  
  conversationMemory[sessionId].messages.push({
    role,
    content,
    timestamp: new Date(),
    sources,
  });
  
  // Keep only last 10 messages to prevent memory overflow
  if (conversationMemory[sessionId].messages.length > 10) {
    conversationMemory[sessionId].messages = conversationMemory[sessionId].messages.slice(-10);
  }
}

export function getConversationHistory(sessionId: string): string {
  if (!conversationMemory[sessionId]) {
    return '';
  }
  
  return conversationMemory[sessionId].messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n\n');
}

export function clearMemory(sessionId: string) {
  delete conversationMemory[sessionId];
}

export { mastra };
