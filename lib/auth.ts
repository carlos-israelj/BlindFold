import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

// NEP-413 signature verification
import { verifyNep413Signature } from './near-auth';

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  emailAndPassword: {
    enabled: false, // We only use wallet-based auth
  },
  socialProviders: {
    // Disabled for wallet-only auth
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour cache
    },
  },
  rateLimit: {
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },
  advanced: {
    generateId: () => {
      // Generate custom IDs for sessions
      return crypto.randomUUID();
    },
  },
  plugins: [
    {
      id: 'near-wallet-auth',
      endpoints: {
        signInWithWallet: {
          method: 'POST',
          handler: async ({ request, context }) => {
            const body = await request.json();
            const { accountId, signature, message, publicKey, nonce } = body;

            // Verify NEP-413 signature
            const isValid = await verifyNep413Signature({
              accountId,
              signature,
              message,
              publicKey,
              nonce,
            });

            if (!isValid) {
              return {
                status: 401,
                body: { error: 'Invalid signature' },
              };
            }

            // Check if user exists
            let user = await prisma.user.findUnique({
              where: { accountId },
            });

            // Create user if doesn't exist
            if (!user) {
              user = await prisma.user.create({
                data: {
                  accountId,
                  publicKey,
                  createdAt: new Date(),
                },
              });
            }

            // Create session
            const session = await context.session.create({
              userId: user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            });

            return {
              status: 200,
              body: {
                user,
                session,
              },
              headers: {
                'Set-Cookie': await context.session.setCookie(session),
              },
            };
          },
        },
        signOut: {
          method: 'POST',
          handler: async ({ request, context }) => {
            const session = await context.session.get(request);
            if (session) {
              await context.session.delete(session.id);
            }

            return {
              status: 200,
              body: { success: true },
              headers: {
                'Set-Cookie': await context.session.clearCookie(),
              },
            };
          },
        },
        getSession: {
          method: 'GET',
          handler: async ({ request, context }) => {
            const session = await context.session.get(request);
            if (!session) {
              return {
                status: 401,
                body: { error: 'No active session' },
              };
            }

            const user = await prisma.user.findUnique({
              where: { id: session.userId },
            });

            return {
              status: 200,
              body: {
                user,
                session,
              },
            };
          },
        },
      },
    },
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
