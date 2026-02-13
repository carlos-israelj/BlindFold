import { PrismaClient } from '@prisma/client';

const DATABASE_URL = 'postgresql://neondb_owner:npg_YXHQDmc7RbM5@ep-purple-glade-aiobbfm0-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function verifySchema() {
  try {
    console.log('\n🔍 Verificando schema de producción...\n');

    // Consulta para verificar las columnas de la tabla User
    const result: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `;

    console.log('📋 Columnas en la tabla User:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    result.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      const star = col.column_name === 'novaAccountId' ? '⭐' : '  ';
      console.log(`${star} ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${nullable}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar específicamente novaAccountId
    const hasNovaAccountId = result.some(col => col.column_name === 'novaAccountId');

    if (hasNovaAccountId) {
      console.log('✅ El campo "novaAccountId" existe en la base de datos\n');

      // Verificar usuarios con novaAccountId
      const usersWithNova = await prisma.user.findMany({
        where: {
          novaAccountId: { not: null }
        },
        select: {
          accountId: true,
          novaAccountId: true
        }
      });

      console.log(`📊 Usuarios con NOVA Account ID: ${usersWithNova.length}\n`);

      if (usersWithNova.length > 0) {
        console.log('Usuarios:');
        usersWithNova.forEach((user, i) => {
          console.log(`  ${i + 1}. Wallet: ${user.accountId.substring(0, 20)}...`);
          console.log(`     NOVA: ${user.novaAccountId}\n`);
        });
      }
    } else {
      console.log('❌ El campo "novaAccountId" NO existe en la base de datos');
      console.log('   Necesitas aplicar la migración manualmente\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
