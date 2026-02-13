import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearNovaData() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';

  console.log('Checking current NOVA data...');
  const user = await prisma.user.findUnique({
    where: { accountId },
    select: {
      accountId: true,
      novaApiKey: true,
      novaAccountId: true,
      novaVaultId: true,
    },
  });

  console.log('Current data:', user);

  console.log('\nClearing NOVA data...');
  await prisma.user.update({
    where: { accountId },
    data: {
      novaApiKey: null,
      novaAccountId: null,
      novaVaultId: null,
    },
  });

  console.log('✅ NOVA data cleared successfully!');

  const updated = await prisma.user.findUnique({
    where: { accountId },
    select: {
      accountId: true,
      novaApiKey: true,
      novaAccountId: true,
      novaVaultId: true,
    },
  });

  console.log('\nUpdated data:', updated);

  await prisma.$disconnect();
}

clearNovaData().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
