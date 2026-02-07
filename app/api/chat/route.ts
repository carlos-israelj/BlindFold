import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletion } from 'openai/resources';
import { nearAIClient } from '@/lib/near-ai';
import { hashData, fetchSignature } from '@/lib/verification';
import { SYSTEM_PROMPT, DEFAULT_MODEL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { messages, portfolio } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Build request with system prompt and portfolio context
    const lastUserMessage = messages[messages.length - 1];
    const userPrompt = `Portfolio:\n${portfolio}\n\nQuestion: ${lastUserMessage.content}`;

    const requestBody = {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        { role: 'user' as const, content: userPrompt },
      ],
      stream: false, // Using non-streaming for simplicity in MVP
    };

    // Store request body string for hashing
    const requestBodyString = JSON.stringify(requestBody);
    const requestHash = hashData(requestBodyString);

    // Call NEAR AI Cloud
    const completion = await nearAIClient.chat.completions.create(requestBody) as ChatCompletion;

    const chatId = completion.id;
    const content = completion.choices[0]?.message?.content || '';

    // Hash the response
    const responseHash = hashData(content);

    // Fetch signature for verification
    let verification = null;
    const apiKey = process.env.NEAR_AI_API_KEY;

    if (apiKey) {
      try {
        const signatureData = await fetchSignature(chatId, DEFAULT_MODEL, apiKey);

        if (signatureData) {
          verification = {
            chat_id: chatId,
            request_hash: requestHash,
            response_hash: responseHash,
            signature: signatureData.signature,
            signing_address: signatureData.signing_address,
            signing_algo: signatureData.signing_algo,
          };
        }
      } catch (error) {
        console.error('Failed to fetch signature:', error);
        // Continue without verification rather than failing
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        content,
        verification,
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Chat request failed' },
      { status: 500 }
    );
  }
}
