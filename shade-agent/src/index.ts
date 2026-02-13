/**
 * BlindFold Shade Agent
 * Autonomous portfolio risk monitoring agent running in TEE
 */

import * as cron from 'node-cron';
import dotenv from 'dotenv';
import { NovaSdk } from 'nova-sdk-js';
import { analyzePortfolioRisk, sendNotification } from './risk-monitor';
import { getLatestPortfolioCid } from './nova-client';

dotenv.config();

const ACCOUNT_ID = process.env.NEAR_ACCOUNT_ID!;
const GROUP_ID = process.env.NOVA_GROUP_ID!;
const SCHEDULE = process.env.SCHEDULE_CRON || '0 9 * * *'; // 9 AM daily
const MONITORING_ENABLED = process.env.MONITORING_ENABLED === 'true';

async function runMonitoring() {
  console.log(`[${new Date().toISOString()}] Starting portfolio risk monitoring...`);

  try {
    // Get latest portfolio CID from group transactions
    const latestCid = await getLatestPortfolioCid(ACCOUNT_ID, GROUP_ID);

    if (!latestCid) {
      console.log('No portfolio data found in vault');
      return;
    }

    console.log(`Analyzing portfolio CID: ${latestCid}`);

    // Run risk analysis
    const analysis = await analyzePortfolioRisk(ACCOUNT_ID, GROUP_ID, latestCid);

    console.log(`Analysis complete: ${analysis.message}`);
    console.log(`Severity: ${analysis.severity}`);
    console.log(`Data:`, JSON.stringify(analysis.data, null, 2));

    // Send notification if warning or critical
    if (analysis.severity === 'warning' || analysis.severity === 'critical') {
      await sendNotification(analysis);
      console.log('Alert notification sent');
    }
  } catch (error: any) {
    console.error('Monitoring error:', error.message);
    console.error(error.stack);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('BlindFold Shade Agent - Portfolio Risk Monitor');
  console.log('='.repeat(60));
  console.log(`Account: ${ACCOUNT_ID}`);
  console.log(`Group ID: ${GROUP_ID}`);
  console.log(`Schedule: ${SCHEDULE}`);
  console.log(`Monitoring: ${MONITORING_ENABLED ? 'ENABLED' : 'DISABLED'}`);
  console.log('='.repeat(60));

  if (!MONITORING_ENABLED) {
    console.log('Monitoring is disabled. Set MONITORING_ENABLED=true to enable.');
    return;
  }

  // Run immediately on startup
  console.log('Running initial analysis...');
  await runMonitoring();

  // Schedule periodic monitoring
  console.log(`\nScheduling monitoring with cron: ${SCHEDULE}`);
  cron.schedule(SCHEDULE, async () => {
    await runMonitoring();
  });

  console.log('Agent is running. Press Ctrl+C to stop.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down agent...');
  process.exit(0);
});

// Start agent
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
