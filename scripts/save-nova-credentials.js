const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

// Encryption function (same as in lib/encryption.ts)
async function encryptApiKey(apiKey) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set');
  }
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

async function saveNovaCredentials() {
  try {
    const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
    const novaAccountId = 'ecuador10.nova-sdk.near';
    const novaApiKey = 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j';
    
    console.log('🔐 Encrypting API key...');
    const encryptedApiKey = await encryptApiKey(novaApiKey);
    
    console.log('💾 Saving to database...');
    const user = await prisma.user.upsert({
      where: { accountId },
      update: {
        novaAccountId,
        novaApiKey: encryptedApiKey,
      },
      create: {
        accountId,
        novaAccountId,
        novaApiKey: encryptedApiKey,
      },
    });
    
    console.log('✅ NOVA credentials saved successfully!');
    console.log('   Account ID:', accountId);
    console.log('   NOVA Account:', novaAccountId);
    console.log('   User ID:', user.id);
  } catch (error) {
    console.error('❌ Error saving credentials:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

saveNovaCredentials();
