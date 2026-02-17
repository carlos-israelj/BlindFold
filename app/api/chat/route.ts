import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletion } from 'openai/resources';
import { nearAIClient } from '@/lib/near-ai';
import { hashData, fetchSignature, verifySignature, fetchAttestation } from '@/lib/verification';
import { SYSTEM_PROMPT, DEFAULT_MODEL } from '@/lib/constants';
import { uploadToVault } from '@/lib/nova';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { messages, portfolio, accountId } = await request.json();

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

    // Fetch and VERIFY signature — Fix 8
    let verification = null;
    const apiKey = process.env.NEAR_AI_API_KEY;

    if (apiKey) {
      try {
        const signatureData = await fetchSignature(chatId, DEFAULT_MODEL, apiKey);

        if (signatureData) {
          // NEAR AI Cloud signs `requestHash:responseHash`, not the raw content
          const isVerified = verifySignature({
            text: `${requestHash}:${responseHash}`,
            signature: signatureData.signature,
            signing_address: signatureData.signing_address,
            signing_algo: signatureData.signing_algo,
          });

          verification = {
            chat_id: chatId,
            request_hash: requestHash,
            response_hash: responseHash,
            signature: signatureData.signature,
            signing_address: signatureData.signing_address,
            signing_algo: signatureData.signing_algo,
            verified: isVerified,
          };
        }
      } catch (error) {
        console.error('Failed to fetch/verify signature:', error);
      }

      // Fix 9: Fetch TEE attestation report
      try {
        const attestation = await fetchAttestation(DEFAULT_MODEL, apiKey);
        if (attestation && verification) {
          (verification as any).attestation = {
            report: attestation.report || null,
            signing_cert: attestation.signing_cert || null,
            nonce: attestation.nonce || null,
          };
        }
      } catch (error) {
        console.error('Failed to fetch attestation:', error);
      }
    }

    // Fix 3: Save chat exchange to NOVA vault in background (non-blocking)
    let chatCid: string | null = null;
    if (accountId) {
      (async () => {
        try {
          const user = await prisma.user.findUnique({ where: { accountId }, select: { id: true } });
          if (user) {
            const vault = await prisma.vault.findFirst({ where: { userId: user.id } });
            if (vault?.groupId) {
              const chatEntry = {
                timestamp: new Date().toISOString(),
                question: lastUserMessage.content,
                answer: content,
                verified: (verification as any)?.verified ?? false,
                chat_id: (verification as any)?.chat_id ?? null,
              };
              chatCid = await uploadToVault(
                accountId,
                vault.groupId,
                chatEntry,
                `chat-${Date.now()}.json`
              );
              console.log(`Chat history saved to NOVA vault: ${chatCid}`);
            }
          }
        } catch (err) {
          console.error('Failed to save chat to NOVA vault (non-blocking):', err);
        }
      })();
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
