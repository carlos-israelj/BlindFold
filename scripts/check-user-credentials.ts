import { PrismaClient } from '@prisma/client';
import { decryptApiKey } from '../lib/encryption';

const prisma = new PrismaClient();

async function main() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';

  console.log('🔍 Checking credentials for:', accountId);

  const user = await prisma.user.findUnique({
    where: { accountId },
    select: {
      id: true,
      accountId: true,
      publicKey: true,
      novaAccountId: true,
      novaApiKey: true,
      novaVaultId: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.error('❌ User not found in database');
    return;
  }

  console.log('\n✅ User found:');
  console.log('   ID:', user.id);
  console.log('   Account ID:', user.accountId);
  console.log('   Public Key:', user.publicKey);
  console.log('   NOVA Account ID:', user.novaAccountId || 'NOT SET');
  console.log('   NOVA API Key:', user.novaApiKey ? 'SET (encrypted)' : 'NOT SET');
  console.log('   NOVA Vault ID:', user.novaVaultId || 'NOT SET');
  console.log('   Created At:', user.createdAt);

  if (user.novaApiKey) {
    try {
      console.log('\n🔓 Attempting to decrypt API key...');
      const decryptedKey = await decryptApiKey(user.novaApiKey);
      console.log('✅ Decryption successful!');
      console.log('   Decrypted key starts with:', decryptedKey.substring(0, 10) + '...');
    } catch (error: any) {
      console.error('❌ Decryption failed:', error.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
