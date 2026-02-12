/**
 * Better Auth Client for Frontend
 * Handles authentication on the client side
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

// Custom hook for NEAR wallet authentication
export async function signInWithNEAR(accountId: string, signature: string, publicKey: string, message: any) {
  try {
    const response = await fetch('/api/auth/near/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        publicKey,
        signature,
        message,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Authentication failed');
    }

    return data.data;
  } catch (error) {
    console.error('NEAR sign in error:', error);
    throw error;
  }
}

export async function getNEARChallenge(accountId: string) {
  try {
    const response = await fetch('/api/auth/near/challenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get challenge');
    }

    return data.data;
  } catch (error) {
    console.error('Get challenge error:', error);
    throw error;
  }
}
