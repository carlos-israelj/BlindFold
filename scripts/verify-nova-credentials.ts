import { NovaSdk } from 'nova-sdk-js';

async function verifyNovaCredentials() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
  const novaAccountId = 'ecuador10.nova-sdk.near';
  const apiKey = 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j';

  console.log('=== Verificando Credenciales NOVA ===\n');
  console.log(`Wallet NEAR: ${accountId}`);
  console.log(`NOVA Account: ${novaAccountId}`);
  console.log(`API Key: ${apiKey}\n`);

  try {
    // Initialize NOVA SDK with API key
    console.log('1. Inicializando NOVA SDK con API Key...');
    const nova = new NovaSdk(novaAccountId, {
      rpcUrl: 'https://rpc.mainnet.near.org',
      apiKey: apiKey,
    });
    console.log('   ✅ SDK inicializado\n');

    // Try to verify API key by attempting to get session token
    console.log('2. Verificando API Key...');
    try {
      // The SDK should automatically use the API key from environment or config
      // Let's try a simple operation that requires authentication

      // First, let's try to check a non-existent group to see the error
      console.log('   Intentando verificar autenticación...');

      try {
        const testResult = await nova.isAuthorized('test-nonexistent-group-12345');
        console.log(`   ✅ API Key válida (isAuthorized response: ${testResult})\n`);
      } catch (error: any) {
        if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
          console.log('   ❌ API Key INVÁLIDA');
          console.log(`   Error: ${error.message}\n`);
          return;
        } else if (error.message.includes('Group does not exist') || error.message.includes('not found')) {
          console.log('   ✅ API Key válida (grupo de prueba no existe, como esperado)\n');
        } else {
          console.log(`   ⚠️  Error inesperado: ${error.message}\n`);
        }
      }

      // Check specific groups
      console.log('3. Verificando grupos específicos:');

      console.log('\n   a) Verificando: ecuador5-portfolio-vault');
      try {
        const isAuth5 = await nova.isAuthorized('ecuador5-portfolio-vault');
        console.log(`      ✅ Grupo existe`);
        console.log(`      Autorizado: ${isAuth5}`);
      } catch (error: any) {
        console.log(`      ❌ ${error.message}`);
      }

      console.log('\n   b) Verificando: ecuador10-portfolio-vault');
      try {
        const isAuth10 = await nova.isAuthorized('ecuador10-portfolio-vault');
        console.log(`      ✅ Grupo existe`);
        console.log(`      Autorizado: ${isAuth10}`);
      } catch (error: any) {
        console.log(`      ❌ ${error.message}`);
      }

      // Try to register a test group
      console.log('\n4. Intentando crear grupo de prueba...');
      const testGroupId = `test-ecuador10-${Date.now()}`;
      console.log(`   Grupo: ${testGroupId}`);

      try {
        await nova.registerGroup(testGroupId);
        console.log(`   ✅ Grupo creado exitosamente!`);
        console.log(`   Esto significa que tienes permisos para crear grupos.\n`);

        // Clean up - delete the test group
        console.log('   Limpiando grupo de prueba...');
        // Note: NOVA SDK might not have a delete method, so we just leave it
        console.log('   (Grupo de prueba quedará en NOVA)\n');
      } catch (error: any) {
        console.log(`   ❌ Error al crear grupo: ${error.message}`);

        if (error.message.includes('Invalid API key')) {
          console.log('   → Problema: API Key inválida o sin permisos');
        } else if (error.message.includes('Insufficient funds')) {
          console.log('   → Problema: Fondos insuficientes');
        } else if (error.message.includes('already exists')) {
          console.log('   → El grupo ya existe (normal si se ejecutó antes)');
        } else {
          console.log(`   → Error desconocido: ${error.message}`);
        }
        console.log('');
      }

    } catch (error: any) {
      console.log(`   ❌ Error general: ${error.message}\n`);
    }

    console.log('=== Resumen ===');
    console.log('Si ves "API Key válida" arriba, el API key funciona.');
    console.log('Si falló al crear grupo, puede ser:');
    console.log('- API Key sin permisos de escritura');
    console.log('- Cuenta NOVA sin acceso al contrato');
    console.log('- Problema de configuración en NOVA SDK\n');

  } catch (error: any) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

verifyNovaCredentials();
