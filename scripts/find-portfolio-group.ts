import { NovaSdk } from 'nova-sdk-js';

async function findPortfolioGroup() {
  const novaAccountId = 'ecuador10.nova-sdk.near';
  const apiKey = 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j';
  const portfolioCid = 'QmbuboD1pMycBBDSrfMv3JzztxB5JfxYCycMBv5xmPgmto';

  console.log('=== Buscando grupo del portfolio ===\n');
  console.log(`CID del portfolio: ${portfolioCid}\n`);

  const nova = new NovaSdk(novaAccountId, {
    rpcUrl: 'https://rpc.mainnet.near.org',
    apiKey: apiKey,
  });

  // Grupos conocidos para probar
  const knownGroups = [
    'ecuador10-portfolio-vault',
    'ecuador5-portfolio-vault',
    'test-ecuador10-1771009395368',
  ];

  console.log('Probando grupos conocidos:\n');

  for (const groupId of knownGroups) {
    try {
      console.log(`Verificando: ${groupId}`);

      // Check if authorized
      const isAuthorized = await nova.isAuthorized(groupId);
      console.log(`  Autorizado: ${isAuthorized}`);

      if (isAuthorized) {
        // Try to retrieve the portfolio using the CID
        try {
          const result = await nova.retrieve(groupId, portfolioCid);
          const portfolioData = JSON.parse(result.data.toString('utf-8'));

          console.log(`  ✅ ¡ENCONTRADO! El portfolio está en este grupo`);
          console.log(`  Assets: ${portfolioData.assets?.length || 0}`);
          console.log(`  Uploaded: ${portfolioData.metadata?.uploadedAt || 'unknown'}\n`);

          console.log(`🎯 Tu portfolio fue subido al grupo: ${groupId}`);
          console.log(`📦 CID: ${portfolioCid}`);

          // Show portfolio contents
          if (portfolioData.assets) {
            console.log('\n💼 Portfolio contents:');
            portfolioData.assets.forEach((asset: any, index: number) => {
              console.log(`   ${index + 1}. ${asset.symbol}: $${asset.value.toLocaleString()}`);
            });

            const totalValue = portfolioData.assets.reduce((sum: number, a: any) => sum + a.value, 0);
            console.log(`\n   Total: $${totalValue.toLocaleString()}`);
          }

          return groupId;
        } catch (retrieveError: any) {
          console.log(`  CID no encontrado en este grupo`);
        }
      }

      console.log('');
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('⚠️  Portfolio no encontrado en grupos conocidos');
  console.log('El portfolio puede estar en un grupo diferente o puede haber un problema.');
}

findPortfolioGroup().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
