/**
 * Test script to verify NOVA connection and credentials
 */

import { NovaSdk } from 'nova-sdk-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from shade-agent/.env
dotenv.config({ path: path.join(__dirname, '../shade-agent/.env') });

async function testNovaConnection() {
  console.log('='.repeat(60));
  console.log('Testing NOVA Connection');
  console.log('='.repeat(60));

  const novaAccountId = process.env.NOVA_ACCOUNT_ID;
  const novaApiKey = process.env.NOVA_API_KEY;
  const groupId = process.env.NOVA_GROUP_ID;
  const network = process.env.NEAR_NETWORK || 'mainnet';

  console.log(`NOVA Account: ${novaAccountId}`);
  console.log(`Group ID: ${groupId}`);
  console.log(`Network: ${network}`);
  console.log(`API Key: ${novaApiKey?.substring(0, 15)}...`);
  console.log('');

  if (!novaAccountId || !novaApiKey || !groupId) {
    console.error('❌ Missing NOVA credentials in .env file');
    console.log('   Required: NOVA_ACCOUNT_ID, NOVA_API_KEY, NOVA_GROUP_ID');
    process.exit(1);
  }

  try {
    // Initialize NOVA SDK
    const rpcUrl = network === 'mainnet'
      ? 'https://rpc.mainnet.near.org'
      : 'https://rpc.testnet.near.org';

    console.log('⚙️  Initializing NOVA SDK...');
    const nova = new NovaSdk(novaAccountId, {
      rpcUrl,
      apiKey: novaApiKey,
    });

    console.log('✅ NOVA SDK initialized successfully\n');

    // Test: Get session token
    console.log('🔑 Testing session token...');
    // This will happen automatically on first API call

    // Test: Get transactions for group
    console.log(`📡 Fetching transactions for group: ${groupId}\n`);
    const transactions = await nova.getTransactionsForGroup(groupId, process.env.NEAR_ACCOUNT_ID!);

    if (!transactions || transactions.length === 0) {
      console.log('⚠️  No transactions found in vault');
      console.log('   This is normal if you haven\'t uploaded a portfolio yet.');
      console.log('   Upload a portfolio through the web interface at https://blindfold.lat/chat\n');
      return;
    }

    console.log(`✅ Found ${transactions.length} transaction(s) in vault\n`);

    // Get the latest transaction
    const latestTx = transactions[0];
    console.log('📄 Latest transaction:');
    console.log(`   CID: ${latestTx.ipfs_hash}`);
    console.log(`   File Hash: ${latestTx.file_hash}`);
    console.log(`   Timestamp: ${new Date(latestTx.timestamp).toISOString()}\n`);

    // Test: Retrieve and decrypt the portfolio
    console.log(`🔓 Attempting to retrieve portfolio with CID: ${latestTx.ipfs_hash}...`);
    const result = await nova.retrieve(groupId, latestTx.ipfs_hash);
    const portfolio = JSON.parse(result.data.toString('utf-8'));

    console.log('✅ Portfolio retrieved and decrypted successfully!\n');

    // Display portfolio summary
    const assets = portfolio.assets || portfolio.holdings || [];
    console.log('📊 Portfolio Summary:');
    console.log(`   Assets: ${assets.length}`);

    if (assets.length > 0) {
      console.log('   \nAsset List:');
      assets.forEach((asset: any, idx: number) => {
        const value = asset.value || asset.valueUSD || asset.balance || 0;
        console.log(`   ${idx + 1}. ${asset.symbol || asset.name}: $${value.toFixed(2)}`);
      });
    }

    if (portfolio.metadata) {
      console.log(`\n   📅 Uploaded: ${portfolio.metadata.uploadedAt}`);
      console.log(`   👤 By: ${portfolio.metadata.uploadedBy}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! NOVA connection is working correctly.');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    console.log('\n' + '='.repeat(60));
    console.log('❌ NOVA connection test failed');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run the test
testNovaConnection().catch(console.error);
