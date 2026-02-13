import { NovaSdk } from 'nova-sdk-js';

async function verifyPortfolioUpload() {
  const novaAccountId = 'ecuador10.nova-sdk.near';
  const apiKey = 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j';
  const vaultId = 'vault.3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
  const portfolioCid = 'QmYCsVNnBE3DDFhLsoz1BU48WxqFguxTpUALyLUb1YtWik';

  console.log('=== Verificando Portfolio Upload ===\n');
  console.log(`NOVA Account: ${novaAccountId}`);
  console.log(`Vault ID: ${vaultId}`);
  console.log(`Portfolio CID: ${portfolioCid}\n`);

  const nova = new NovaSdk(novaAccountId, {
    rpcUrl: 'https://rpc.mainnet.near.org',
    apiKey: apiKey,
  });

  console.log('1. Verificando acceso al vault...');
  try {
    const isAuthorized = await nova.isAuthorized(vaultId);
    console.log(`   Autorizado: ${isAuthorized}\n`);

    if (!isAuthorized) {
      console.log('❌ No tienes acceso a este vault');
      return;
    }
  } catch (error: any) {
    console.log(`   ❌ Error verificando autorización: ${error.message}\n`);
    return;
  }

  console.log('2. Intentando recuperar portfolio...');
  try {
    const result = await nova.retrieve(vaultId, portfolioCid);
    const portfolioData = JSON.parse(result.data.toString('utf-8'));

    console.log('   ✅ Portfolio recuperado exitosamente!\n');

    if (portfolioData.assets) {
      console.log('💼 Portfolio contents:');
      portfolioData.assets.forEach((asset: any, index: number) => {
        console.log(`   ${index + 1}. ${asset.symbol}: ${asset.balance} units @ $${asset.value.toLocaleString()}`);
      });

      const totalValue = portfolioData.assets.reduce((sum: number, a: any) => sum + a.value, 0);
      console.log(`\n   Total Portfolio Value: $${totalValue.toLocaleString()}`);

      // Calculate HHI
      const weights = portfolioData.assets.map((a: any) => a.value / totalValue);
      const hhi = weights.reduce((sum: number, w: number) => sum + (w * w * 10000), 0);
      console.log(`   HHI Score: ${hhi.toFixed(2)}\n`);

      if (hhi < 1500) {
        console.log('   ✅ Low concentration risk (HHI < 1500)');
      } else if (hhi < 2500) {
        console.log('   ⚠️  Moderate concentration risk (1500 ≤ HHI < 2500)');
      } else {
        console.log('   🚨 High concentration risk (HHI ≥ 2500)');
      }
    }

    console.log('\n3. Metadata:');
    if (portfolioData.metadata) {
      console.log(`   Uploaded: ${portfolioData.metadata.uploadedAt}`);
      console.log(`   By: ${portfolioData.metadata.uploadedBy}`);
      console.log(`   Version: ${portfolioData.metadata.version}`);
    }

    console.log('\n=== Todo está correcto ===');
    console.log('El portfolio existe en el vault y puede ser recuperado.');
    console.log('El problema es solo con la configuración de Phala Cloud.\n');

  } catch (error: any) {
    console.log(`   ❌ Error recuperando portfolio: ${error.message}\n`);
    console.log('Esto significa que el portfolio NO se subió a este vault,');
    console.log('o el CID es incorrecto.\n');
  }
}

verifyPortfolioUpload().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
