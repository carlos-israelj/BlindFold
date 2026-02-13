import { PrismaClient } from '@prisma/client';
import { NovaSdk } from 'nova-sdk-js';
import { decryptApiKey } from '../lib/encryption';

const prisma = new PrismaClient();

async function createVaultManually() {
  try {
    const walletAddress = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
    const novaAccountId = 'ecuador10.nova-sdk.near';

    console.log('\n🔍 Buscando usuario...');
    const user = await prisma.user.findUnique({
      where: { accountId: walletAddress },
      select: { id: true, accountId: true, novaApiKey: true }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    if (!user.novaApiKey) {
      console.error('❌ Usuario no tiene NOVA API key');
      return;
    }

    console.log('✅ Usuario encontrado');
    console.log('  - Account ID:', user.accountId);

    console.log('\n🔓 Desencriptando API key...');
    const apiKey = await decryptApiKey(user.novaApiKey);
    console.log('✅ API key desencriptada');
    console.log('  - Comienza con:', apiKey.substring(0, 15) + '...');

    console.log('\n🔧 Creando cliente NOVA SDK...');
    console.log('  - Account ID:', novaAccountId);
    const nova = new NovaSdk(novaAccountId, {
      apiKey: apiKey,
    });
    console.log('✅ Cliente NOVA SDK creado');

    // Intentar registrar el grupo (vault)
    const vaultId = `vault.${user.accountId}`;
    console.log('\n📦 Intentando crear vault...');
    console.log('  - Vault ID:', vaultId);

    try {
      await nova.registerGroup(vaultId);
      console.log('✅ Vault creado exitosamente en NOVA!');

      // Guardar en la base de datos
      console.log('\n💾 Guardando vault en la base de datos...');
      const vault = await prisma.vault.create({
        data: {
          userId: user.id,
          groupId: vaultId,
        }
      });
      console.log('✅ Vault guardado en la base de datos');
      console.log('  - Vault DB ID:', vault.id);
      console.log('  - Group ID:', vault.groupId);

    } catch (error: any) {
      console.error('❌ Error al crear vault:');
      console.error('  - Mensaje:', error.message);
      console.error('  - Detalles:', error);

      // Verificar si es error de fondos
      if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
        console.log('\n💡 Posible solución:');
        console.log('  1. Ve a https://nova-sdk.com');
        console.log('  2. Inicia sesión con ' + novaAccountId);
        console.log('  3. Agrega fondos NEAR a tu cuenta NOVA');
        console.log('  4. Se necesitan aproximadamente 0.05 NEAR para registrar un vault');
      }

      // Verificar si es error de autenticación
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        console.log('\n💡 Posible solución:');
        console.log('  1. Verifica que la API key sea correcta');
        console.log('  2. Verifica que la API key esté asociada a ' + novaAccountId);
        console.log('  3. Genera una nueva API key si es necesario');
      }

      // Verificar si el vault ya existe
      if (error.message?.includes('already') || error.message?.includes('exist')) {
        console.log('\n💡 El vault podría ya existir en NOVA');
        console.log('  - Intentando guardar en la base de datos de todas formas...');

        try {
          const vault = await prisma.vault.create({
            data: {
              userId: user.id,
              groupId: vaultId,
            }
          });
          console.log('✅ Vault guardado en la base de datos');
          console.log('  - Vault DB ID:', vault.id);
        } catch (dbError) {
          console.error('❌ Error al guardar en DB:', dbError);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createVaultManually();
