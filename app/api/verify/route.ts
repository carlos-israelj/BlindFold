import { NextRequest, NextResponse } from 'next/server';
import { fetchSignature, fetchAttestation, verifySignature } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const { action, chatId, model, nonce } = await request.json();

    const apiKey = process.env.NEAR_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'NEAR AI API key not configured' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'signature': {
        if (!chatId || !model) {
          return NextResponse.json(
            { success: false, error: 'chatId and model are required' },
            { status: 400 }
          );
        }

        const signatureData = await fetchSignature(chatId, model, apiKey);

        if (!signatureData) {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch signature' },
            { status: 500 }
          );
        }

        const isValid = verifySignature(signatureData);

        return NextResponse.json({
          success: true,
          data: {
            ...signatureData,
            isValid,
          },
        });
      }

      case 'attestation': {
        if (!model) {
          return NextResponse.json(
            { success: false, error: 'model is required' },
            { status: 400 }
          );
        }

        const attestationData = await fetchAttestation(model, apiKey, nonce);

        if (!attestationData) {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch attestation' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: attestationData,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
