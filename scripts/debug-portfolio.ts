import { NovaSdk } from 'nova-sdk-js';

async function debugPortfolio() {
  const novaAccountId = 'ecuador10.nova-sdk.near';
  const apiKey = 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j';
  const vaultId = 'vault.3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
  const portfolioCid = 'QmYCsVNnBE3DDFhLsoz1BU48WxqFguxTpUALyLUb1YtWik';

  console.log('=== Debugging Portfolio Data ===\n');

  const nova = new NovaSdk(novaAccountId, {
    rpcUrl: 'https://rpc.mainnet.near.org',
    apiKey: apiKey,
  });

  console.log('Retrieving portfolio...');
  try {
    const result = await nova.retrieve(vaultId, portfolioCid);
    const rawData = result.data.toString('utf-8');

    console.log('\n📦 Raw data (first 500 chars):');
    console.log(rawData.substring(0, 500));
    console.log('...\n');

    const portfolioData = JSON.parse(rawData);

    console.log('📋 Parsed Portfolio Data:');
    console.log(JSON.stringify(portfolioData, null, 2));
    console.log('\n');

    if (portfolioData.assets) {
      console.log(`✅ Assets found: ${portfolioData.assets.length}`);
      portfolioData.assets.forEach((asset: any, index: number) => {
        console.log(`   ${index + 1}. ${JSON.stringify(asset)}`);
      });
    } else {
      console.log('❌ No "assets" field found in portfolio data');
      console.log('Available fields:', Object.keys(portfolioData));
    }

    if (portfolioData.metadata) {
      console.log('\n📝 Metadata:');
      console.log(JSON.stringify(portfolioData.metadata, null, 2));
    }

  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugPortfolio().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
