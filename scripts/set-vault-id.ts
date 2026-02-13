import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setVaultId() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
  const vaultId = 'ecuador10-portfolio-vault';

  console.log('=== Actualizando Vault ID ===\n');
  console.log(`Account: ${accountId}`);
  console.log(`Setting vaultId to: ${vaultId}\n`);

  await prisma.user.update({
    where: { accountId },
    data: {
      novaVaultId: vaultId,
    },
  });

  console.log('✅ Vault ID actualizado correctamente\n');

  const updated = await prisma.user.findUnique({
    where: { accountId },
    select: {
      novaAccountId: true,
      novaVaultId: true,
    },
  });

  console.log('Configuración actualizada:');
  console.log(`   NOVA Account: ${updated?.novaAccountId}`);
  console.log(`   Vault/Group: ${updated?.novaVaultId}\n`);

  console.log('Ahora puedes:');
  console.log('1. Subir tu portfolio de nuevo en Vercel');
  console.log('2. Configurar Phala Cloud con este grupo: ecuador10-portfolio-vault');

  await prisma.$disconnect();
}

setVaultId().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
