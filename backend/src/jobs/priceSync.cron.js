import cron from 'node-cron';
import { syncAllProductsLivePrices } from '../services/livePriceSync.service.js';
import { broadcastScraperLog } from '../services/realtime.service.js';
import { checkAndTriggerPriceAlerts } from '../services/emailAlert.service.js';

/**
 * Initialize Scheduled Automated Price Sync Jobs
 * Periodically refreshes all catalog product prices from Meesho, Flipkart, Amazon, Croma.
 */
export function initPriceSyncCron() {
  console.log('⏰ [Cron Scheduler] Initializing automated price synchronization jobs...');

  async function runSync(label) {
    console.log(`⏰ [Cron Scheduler] Running ${label} live market price sync...`);
    broadcastScraperLog(`⏰ ${label}: Initiating live market price sync across all stores...`, 'step');
    try {
      const results = await syncAllProductsLivePrices();
      console.log(`✅ [Cron Scheduler] Successfully synced ${results.length} products with live prices.`);
      broadcastScraperLog(`✅ ${label}: Successfully synced ${results.length} products with live market rates!`, 'success');

      // Check active price drop alerts
      await checkAndTriggerPriceAlerts();
    } catch (err) {
      console.error(`❌ [Cron Scheduler] Error during ${label}:`, err.message);
      broadcastScraperLog(`❌ ${label} Error: ${err.message}`, 'error');
    }
  }

  // Schedule to run every 4 hours
  cron.schedule('0 */4 * * *', () => runSync('4-hour scheduled sync'));

  // Run once 30 minutes after server start to ensure fresh data on boot
  setTimeout(() => runSync('Startup sync (30m post-boot)'), 30 * 60 * 1000);

  console.log('✅ [Cron Scheduler] Price sync cron registered (every 4 hours + startup sync in 30 min).');
}
