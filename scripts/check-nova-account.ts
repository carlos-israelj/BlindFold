import { NovaSdk } from 'nova-sdk-js';
import * as nearAPI from 'near-api-js';

async function checkNovaAccount() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
  const privateKey = 'ed25519:3woArMr7jZkVyAZ3fxsVUsWWDjQdkn7i517mwyzpy7JRijKRBcJSHL6ajeWsqx921oTFeaaFd1Y5jheGPkfMo8Wq';
  const novaAccountId = 'ecuador10.nova-sdk.near';

  console.log('=== Verificando cuenta NOVA ===\n');

  // Initialize NEAR connection
  const { connect, keyStores, KeyPair } = nearAPI;
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(privateKey);
  await keyStore.setKey('mainnet', accountId, keyPair);

  const config = {
    networkId: 'mainnet',
    keyStore,
    nodeUrl: 'https://rpc.mainnet.near.org',
  };

  const near = await connect(config);

  // Check NEAR account balance
  console.log('1. Verificando saldo de la wallet NEAR:');
  console.log(`   Account: ${accountId}`);
  try {
    const account = await near.account(accountId);
    const balance = await account.getAccountBalance();
    const availableNEAR = (BigInt(balance.available) / BigInt(10 ** 24)).toString();
    console.log(`   Saldo disponible: ${availableNEAR} NEAR`);
    console.log(`   Total: ${(BigInt(balance.total) / BigInt(10 ** 24)).toString()} NEAR\n`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Check NOVA account
  console.log('2. Verificando cuenta NOVA:');
  console.log(`   NOVA Account: ${novaAccountId}`);
  try {
    const novaAccount = await near.account(novaAccountId);
    const novaBalance = await novaAccount.getAccountBalance();
    const availableNEAR = (BigInt(novaBalance.available) / BigInt(10 ** 24)).toString();
    console.log(`   Saldo disponible: ${availableNEAR} NEAR`);
    console.log(`   Total: ${(BigInt(novaBalance.total) / BigInt(10 ** 24)).toString()} NEAR\n`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Initialize NOVA SDK
  console.log('3. Verificando conexión con NOVA SDK:');
  try {
    const nova = new NovaSdk(accountId, {
      rpcUrl: 'https://rpc.mainnet.near.org',
    });
    console.log('   ✅ NOVA SDK inicializado correctamente\n');

    // Try to check if we can access NOVA contract
    console.log('4. Verificando acceso al contrato NOVA:');
    try {
      // Try to get account info or any non-mutating call
      console.log('   Intentando verificar permisos...');

      // Check if ecuador5-portfolio-vault exists
      console.log('\n5. Verificando grupos existentes:');
      console.log('   Verificando: ecuador5-portfolio-vault');
      try {
        const isAuth5 = await nova.isAuthorized('ecuador5-portfolio-vault');
        console.log(`   ✅ Grupo existe. Autorizado: ${isAuth5}`);
      } catch (error: any) {
        console.log(`   ❌ ${error.message}`);
      }

      console.log('   Verificando: ecuador10-portfolio-vault');
      try {
        const isAuth10 = await nova.isAuthorized('ecuador10-portfolio-vault');
        console.log(`   ✅ Grupo existe. Autorizado: ${isAuth10}`);
      } catch (error: any) {
        console.log(`   ❌ ${error.message}`);
      }

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }

  } catch (error: any) {
    console.log(`   ❌ Error inicializando NOVA: ${error.message}\n`);
  }

  console.log('\n=== Resumen ===');
  console.log('Para crear un nuevo grupo necesitas:');
  console.log('- Al menos 1.3 NEAR en la wallet');
  console.log('- Acceso al contrato NOVA (nova-sdk.near)');
  console.log('- API Key válida');
}

checkNovaAccount().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
