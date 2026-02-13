import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateNovaAccountId() {
  try {
    const walletAddress = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
    const novaAccountId = 'ecuador10.nova-sdk.near';

    console.log('\n🔍 Actualizando NOVA Account ID...');
    console.log('  - Wallet:', walletAddress);
    console.log('  - NOVA Account:', novaAccountId);

    const user = await prisma.user.update({
      where: { accountId: walletAddress },
      data: { novaAccountId: novaAccountId }
    });

    console.log('\n✅ NOVA Account ID actualizado exitosamente!');
    console.log('  - User ID:', user.id);
    console.log('  - Wallet:', user.accountId);
    console.log('  - NOVA Account:', user.novaAccountId);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNovaAccountId();
