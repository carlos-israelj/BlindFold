import { PrismaClient } from '@prisma/client';
import { encryptApiKey } from '../lib/encryption';

const prisma = new PrismaClient();

async function updateNovaKey() {
  try {
    const walletAddress = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
    const newApiKey = 'nova_sk_l63lwEFHcp7GkgDZOXjLU4Suf5dI0LqC';

    console.log('\n🔍 Buscando usuario...');
    const user = await prisma.user.findUnique({
      where: { accountId: walletAddress },
      select: { id: true, accountId: true }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado');
    console.log('  - Account ID:', user.accountId);

    console.log('\n🔐 Encriptando nueva API key...');
    const encryptedApiKey = await encryptApiKey(newApiKey);
    console.log('✅ API key encriptada');

    console.log('\n💾 Actualizando en la base de datos...');
    await prisma.user.update({
      where: { id: user.id },
      data: { novaApiKey: encryptedApiKey }
    });

    console.log('✅ API key actualizada exitosamente!');
    console.log('\n📝 Siguiente paso: Ejecutar el script para crear el vault');
    console.log('   Comando: npx tsx scripts/create-vault-manually.ts');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNovaKey();
