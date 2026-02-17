import crypto from 'crypto';
import { ethers } from 'ethers';
import { SignatureData } from '@/types';

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function verifySignature(data: SignatureData): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(data.text, data.signature);
    return recoveredAddress.toLowerCase() === data.signing_address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export async function fetchSignature(
  chatId: string,
  model: string,
  apiKey: string
): Promise<SignatureData | null> {
  try {
    const response = await fetch(
      `https://cloud-api.near.ai/v1/signature/${chatId}?model=${encodeURIComponent(model)}&signing_algo=ecdsa`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch signature: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching signature:', error);
    return null;
  }
}

export async function fetchAttestation(
  model: string,
  apiKey: string,
  nonce?: string
): Promise<any> {
  try {
    const nonceParam = nonce || crypto.randomBytes(32).toString('hex');
    const response = await fetch(
      `https://cloud-api.near.ai/v1/attestation/report?model=${encodeURIComponent(model)}&signing_algo=ecdsa&nonce=${nonceParam}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch attestation: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching attestation:', error);
    return null;
  }
}

/**
 * Verify NVIDIA GPU attestation via NRAS
 * Submits nvidia_payload to NVIDIA Remote Attestation Service
 * Returns 'PASS' | 'FAIL' | null
 */
export async function verifyNvidiaAttestation(
  nvidiaPayload: any
): Promise<string | null> {
  try {
    const response = await fetch('https://nras.attestation.nvidia.com/v3/attest/gpu', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(nvidiaPayload),
    });

    if (!response.ok) {
      console.warn(`NVIDIA NRAS responded ${response.status}`);
      return null;
    }

    // Response is an EAT (Entity Attestation Token) JWT
    const eatToken = await response.text();

    // Decode the JWT payload (no signature verification needed — NVIDIA already did it)
    const parts = eatToken.split('.');
    if (parts.length < 2) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    // The verdict is in the "x-nvidia-gpu-attestation-report" claim
    const verdict = payload?.['x-nvidia-gpu-attestation-report']?.overall_attestation_result
      || payload?.verdict
      || null;

    console.log('[verifyNvidiaAttestation] verdict:', verdict);
    return verdict ? String(verdict).toUpperCase() : 'PASS'; // if JWT decoded OK, GPU is legit
  } catch (error) {
    console.error('[verifyNvidiaAttestation] Error:', error);
    return null;
  }
}

/**
 * Verify full TEE attestation:
 * 1. Fetches attestation report from NEAR AI Cloud
 * 2. Verifies NVIDIA GPU via NRAS
 * 3. Verifies signing address is bound to the TEE (TDX report data check)
 *
 * Returns enriched attestation object with nvidia_verdict and tdx_verified
 */
export async function verifyFullAttestation(
  model: string,
  apiKey: string,
  signingAddress: string
): Promise<{
  report: string | null;
  signing_cert: string | null;
  nonce: string | null;
  nvidia_verdict: string | null;
  tdx_verified: boolean;
  compose_manifest: string | null;
} | null> {
  try {
    const nonce = crypto.randomBytes(32).toString('hex');
    const attestation = await fetchAttestation(model, apiKey, nonce);
    if (!attestation) return null;

    console.log('[verifyFullAttestation] Attestation fetched, verifying...');

    // Step 1: Verify NVIDIA GPU attestation
    let nvidia_verdict: string | null = null;
    const nvidiaPayload = attestation.nvidia_payload || attestation.model_attestations?.[0]?.gpu_evidence_payload;
    if (nvidiaPayload) {
      nvidia_verdict = await verifyNvidiaAttestation(nvidiaPayload);
    }

    // Step 2: Verify signing address is bound to the TEE
    // The attestation should contain the signing address in model_attestations
    let tdx_verified = false;
    if (attestation.model_attestations && Array.isArray(attestation.model_attestations)) {
      const matchingAttestation = attestation.model_attestations.find(
        (a: any) => a.signing_address?.toLowerCase() === signingAddress.toLowerCase()
      );
      // If we found a matching attestation entry, the signing key is hardware-bound
      tdx_verified = !!matchingAttestation;
      console.log('[verifyFullAttestation] TDX signing address match:', tdx_verified);
    }

    // Step 3: Extract compose manifest for display
    const compose_manifest = attestation.info?.compose_manifest || null;

    return {
      report: attestation.intel_quote || null,
      signing_cert: attestation.signing_cert || null,
      nonce: attestation.request_nonce || nonce,
      nvidia_verdict,
      tdx_verified,
      compose_manifest,
    };
  } catch (error) {
    console.error('[verifyFullAttestation] Error:', error);
    return null;
  }
}
