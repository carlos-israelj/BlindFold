import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixVaultId() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
  const vaultId = `vault.${accountId}`;

  console.log('=== Corrigiendo Vault ID ===\n');
  console.log(`Account: ${accountId}`);
  console.log(`Vault ID correcto: ${vaultId}\n`);

  await prisma.user.update({
    where: { accountId },
    data: {
      novaVaultId: vaultId,
    },
  });

  console.log('✅ Vault ID corregido\n');

  const updated = await prisma.user.findUnique({
    where: { accountId },
    select: {
      novaAccountId: true,
      novaVaultId: true,
    },
  });

  console.log('Configuración actualizada:');
  console.log(`   NOVA Account: ${updated?.novaAccountId}`);
  console.log(`   Vault ID: ${updated?.novaVaultId}\n`);

  await prisma.$disconnect();
}

fixVaultId().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
