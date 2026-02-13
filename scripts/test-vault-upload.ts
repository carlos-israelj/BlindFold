import { PrismaClient } from '@prisma/client';
import { NovaSdk } from 'nova-sdk-js';
import { decryptApiKey } from '../lib/encryption';

const prisma = new PrismaClient();

async function testVaultUpload() {
  try {
    const walletAddress = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
    const novaAccountId = 'ecuador10.nova-sdk.near';

    console.log('\n🔍 Obteniendo datos del usuario y vault...');
    const user = await prisma.user.findUnique({
      where: { accountId: walletAddress },
      include: { vaults: true }
    });

    if (!user || !user.novaApiKey) {
      console.error('❌ Usuario o API key no encontrados');
      return;
    }

    if (user.vaults.length === 0) {
      console.error('❌ No se encontró vault');
      return;
    }

    const vault = user.vaults[0];
    console.log('✅ Vault encontrado:', vault.groupId);

    console.log('\n🔓 Desencriptando API key...');
    const apiKey = await decryptApiKey(user.novaApiKey);

    console.log('\n🔧 Creando cliente NOVA SDK...');
    const nova = new NovaSdk(novaAccountId, {
      apiKey: apiKey,
    });

    // Crear datos de prueba
    const testData = {
      test: 'vault-test',
      timestamp: new Date().toISOString(),
      wallet: walletAddress,
      message: '¡Vault funcionando correctamente!'
    };

    console.log('\n📤 Subiendo archivo de prueba al vault...');
    console.log('  - Vault ID:', vault.groupId);
    console.log('  - Archivo:', 'test.json');

    const result = await nova.upload(
      vault.groupId,
      Buffer.from(JSON.stringify(testData, null, 2)),
      'test.json'
    );

    console.log('✅ Archivo subido exitosamente!');
    console.log('  - CID:', result.cid);

    // Actualizar el CID en la base de datos
    console.log('\n💾 Actualizando CID en la base de datos...');
    await prisma.vault.update({
      where: { id: vault.id },
      data: { novaCid: result.cid }
    });
    console.log('✅ CID guardado en la base de datos');

    // Intentar recuperar el archivo
    console.log('\n📥 Recuperando archivo del vault...');
    const { data } = await nova.retrieve(vault.groupId, result.cid);
    const retrievedData = JSON.parse(data.toString());

    console.log('✅ Archivo recuperado exitosamente!');
    console.log('\n📄 Contenido:');
    console.log(JSON.stringify(retrievedData, null, 2));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ¡VAULT COMPLETAMENTE FUNCIONAL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Resumen:');
    console.log('  - Usuario registrado');
    console.log('  - API Key configurada');
    console.log('  - Vault creado');
    console.log('  - Subida de archivos: ✅');
    console.log('  - Recuperación de archivos: ✅');
    console.log('\n📝 Próximos pasos:');
    console.log('  - Tu aplicación ahora puede usar el vault para');
    console.log('    almacenar datos de portafolio de forma segura');
    console.log('  - Los datos están encriptados en NOVA SDK');
    console.log('  - Solo tú puedes acceder a ellos con tu API key');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVaultUpload();
