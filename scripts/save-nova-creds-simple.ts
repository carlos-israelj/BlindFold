import { PrismaClient } from '@prisma/client';
import { encryptApiKey } from '../lib/encryption';

const prisma = new PrismaClient();

async function main() {
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
      publicKey: accountId, // Using accountId as publicKey placeholder
      novaAccountId,
      novaApiKey: encryptedApiKey,
    },
  });

  console.log('✅ NOVA credentials saved successfully!');
  console.log('   Account ID:', accountId);
  console.log('   NOVA Account:', novaAccountId);
  console.log('   User ID:', user.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
