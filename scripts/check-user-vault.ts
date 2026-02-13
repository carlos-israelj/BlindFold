import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserVault() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';

  console.log('=== Verificando configuración de usuario ===\n');
  console.log(`Account ID: ${accountId}\n`);

  const user = await prisma.user.findUnique({
    where: { accountId },
    select: {
      accountId: true,
      novaApiKey: true,
      novaAccountId: true,
      novaVaultId: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log('❌ Usuario no encontrado en la base de datos');
    return;
  }

  console.log('✅ Usuario encontrado:\n');
  console.log(`   NOVA Account ID: ${user.novaAccountId || 'No configurado'}`);
  console.log(`   NOVA Vault/Group ID: ${user.novaVaultId || 'No configurado'}`);
  console.log(`   API Key configurada: ${user.novaApiKey ? 'Sí (encriptada)' : 'No'}`);
  console.log(`   Creado: ${user.createdAt}\n`);

  if (user.novaVaultId) {
    console.log(`🎯 Tu portfolio fue subido al grupo: ${user.novaVaultId}`);
    console.log(`📦 CID del portfolio: QmbuboD1pMycBBDSrfMv3JzztxB5JfxYCycMBv5xmPgmto\n`);
  } else {
    console.log('⚠️  No hay grupo configurado en la base de datos');
    console.log('   Esto puede significar que el flujo no completó correctamente.\n');
  }

  await prisma.$disconnect();
}

checkUserVault().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
