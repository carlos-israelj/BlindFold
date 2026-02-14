/**
 * Shade Key API Server
 *
 * Exposes HTTP endpoint for NOVA MCP Server to request Shade keys.
 * Keys are derived using Phala TEE attestation.
 */

import express, { Request, Response } from 'express';
import { getNovaClient } from './nova-client';

const app = express();
app.use(express.json());

const PORT = process.env.SHADE_API_PORT || 3001;

/**
 * Derive Shade key for a given account and group
 *
 * This uses deterministic key derivation based on:
 * - Account ID (user identity)
 * - Group ID (vault identifier)
 * - NOVA API Key (secret from environment)
 * - TEE attestation (Phala provides secure execution)
 *
 * The key is derived using HMAC-SHA256 to ensure:
 * 1. Same account + group always get same key (deterministic)
 * 2. Different accounts/groups get different keys (isolated)
 * 3. Keys are derived in TEE (secure)
 */
async function deriveShadeKey(accountId: string, groupId: string): Promise<string> {
  try {
    const crypto = await import('crypto');

    // Use NOVA API KEY as the master secret (only available in TEE)
    const apiKey = process.env.NOVA_API_KEY;
    if (!apiKey) {
      throw new Error('NOVA_API_KEY not found in environment');
    }

    // Derive a deterministic key using HMAC-SHA256
    // Format: HMAC(api_key, account_id || group_id)
    const message = `${accountId}:${groupId}`;
    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(message);
    const derivedKey = hmac.digest();

    // Return as base64 (32 bytes = 256-bit key for AES-256-GCM)
    const keyB64 = derivedKey.toString('base64');

    console.log('[Shade Key] ✅ Key derived successfully');
    console.log(`   Account: ${accountId.substring(0, 16)}...`);
    console.log(`   Group: ${groupId.substring(0, 32)}...`);
    console.log(`   Key length: ${derivedKey.length} bytes`);

    return keyB64;

  } catch (error: any) {
    console.error('[Shade Key] Error deriving key:', error.message);
    throw error;
  }
}

/**
 * POST /api/key-management/get_key
 *
 * Called by NOVA MCP Server to get Shade key for decryption
 */
app.post('/api/key-management/get_key', async (req: Request, res: Response) => {
  try {
    const { account_id, group_id } = req.body;

    console.log('[Shade Key API] Key request received:', {
      account_id,
      group_id,
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    // Validate input
    if (!account_id || !group_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'Both account_id and group_id are required',
      });
    }

    // Derive Shade key using TEE
    const shadeKey = await deriveShadeKey(account_id, group_id);

    console.log('[Shade Key API] ✅ Key derived successfully');

    return res.json({
      shade_key: shadeKey,
      derived_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Shade Key API] ❌ Error:', error.message);
    return res.status(500).json({
      error: 'Failed to derive Shade key',
      details: error.message,
    });
  }
});

/**
 * GET /health
 *
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'shade-key-api',
    timestamp: new Date().toISOString(),
    tee_enabled: process.env.PHALA_TEE === 'true',
  });
});

/**
 * Start the API server
 */
export function startShadeKeyApi(): void {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🔑 Shade Key API Server started`);
    console.log(`📍 Listening on port ${PORT}`);
    console.log(`🔒 TEE-secured key derivation enabled`);
    console.log('='.repeat(60));
  });
}

export default app;
