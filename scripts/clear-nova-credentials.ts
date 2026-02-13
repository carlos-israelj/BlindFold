import { PrismaClient } from '@prisma/client';

const DATABASE_URL = 'postgresql://neondb_owner:npg_YXHQDmc7RbM5@ep-purple-glade-aiobbfm0-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function clearNovaCredentials() {
  try {
    const walletAddress = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';

    console.log('\n⚠️  Esta acción borrará temporalmente tus credenciales NOVA');
    console.log('   Para testing del modal de setup\n');
    console.log('   Wallet:', walletAddress);
    console.log('\n   Presiona Ctrl+C para cancelar o Enter para continuar...\n');

    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('🔄 Borrando credenciales NOVA...\n');

    const result = await prisma.user.update({
      where: { accountId: walletAddress },
      data: {
        novaApiKey: null,
        novaAccountId: null
      }
    });

    console.log('✅ Credenciales NOVA borradas');
    console.log('   - novaApiKey: null');
    console.log('   - novaAccountId: null');
    console.log('\n📝 Ahora cuando conectes tu wallet:');
    console.log('   1. Verás el modal de NOVA Setup');
    console.log('   2. Con el campo "NOVA Account ID"');
    console.log('   3. Con instrucciones sobre fondos\n');
    console.log('⚠️  Recuerda volver a configurar después del testing!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

clearNovaCredentials();
