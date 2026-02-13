import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserData() {
  try {
    // Buscar usuario con la wallet address
    const walletAddress = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';

    console.log('\n🔍 Buscando usuario con wallet:', walletAddress);

    const user = await prisma.user.findUnique({
      where: { accountId: walletAddress },
      include: {
        vaults: true,
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (user) {
      console.log('\n✅ Usuario encontrado:');
      console.log('  - ID:', user.id);
      console.log('  - Account ID (Wallet):', user.accountId);
      console.log('  - Public Key:', user.publicKey);
      console.log('  - Tiene NOVA API Key:', !!user.novaApiKey);
      console.log('  - NOVA Account ID:', (user as any).novaAccountId || 'N/A');
      console.log('  - Creado:', user.createdAt);
      console.log('  - Actualizado:', user.updatedAt);

      if (user.vaults.length > 0) {
        console.log('\n📦 Vaults:');
        user.vaults.forEach((vault, i) => {
          console.log(`  Vault ${i + 1}:`);
          console.log(`    - Group ID: ${vault.groupId}`);
          console.log(`    - CID: ${vault.novaCid || 'N/A'}`);
          console.log(`    - Creado: ${vault.createdAt}`);
        });
      } else {
        console.log('\n⚠️  No se encontraron vaults para este usuario');
      }

      if (user.sessions.length > 0) {
        console.log('\n🔐 Sesión más reciente:');
        console.log('  - Token:', user.sessions[0].token.substring(0, 20) + '...');
        console.log('  - Expira:', user.sessions[0].expiresAt);
      }
    } else {
      console.log('\n❌ No se encontró usuario con ese wallet address');
    }

    // También buscar por ecuador5.near
    console.log('\n\n🔍 Buscando usuario con ecuador5.near...');
    const ecuador5User = await prisma.user.findUnique({
      where: { accountId: 'ecuador5.near' },
      include: { vaults: true }
    });

    if (ecuador5User) {
      console.log('✅ Usuario ecuador5.near encontrado');
      console.log('  - Tiene NOVA API Key:', !!ecuador5User.novaApiKey);
      console.log('  - Vaults:', ecuador5User.vaults.length);
    } else {
      console.log('❌ No se encontró usuario ecuador5.near');
    }

    // Listar todos los usuarios
    console.log('\n\n📊 Todos los usuarios en la base de datos:');
    const allUsers = await prisma.user.findMany({
      select: {
        accountId: true,
        createdAt: true,
        novaApiKey: true
      }
    });

    allUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.accountId}`);
      console.log(`     - Tiene NOVA API Key: ${!!u.novaApiKey}`);
      console.log(`     - Creado: ${u.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
