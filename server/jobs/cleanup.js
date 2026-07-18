const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
// 2 years in milliseconds
const RETENTION_PERIOD_MS = 2 * 365 * 24 * 60 * 60 * 1000;

function cleanupOldImages() {
  console.log('[Cleanup Job] Starting image cleanup check...');
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('[Cleanup Job] Uploads directory does not exist. Skipping.');
    return;
  }

  const now = Date.now();
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      
      // Skip if it's a directory or a system file like .gitkeep
      const stats = fs.statSync(filePath);
      if (!stats.isFile() || file.startsWith('.')) continue;

      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > RETENTION_PERIOD_MS) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`[Cleanup Job] Deleted old image: ${file}`);
      }
    }

    console.log(`[Cleanup Job] Cleanup complete. Deleted ${deletedCount} files.`);
  } catch (error) {
    console.error('[Cleanup Job] Error during cleanup:', error);
  }
}

// Run daily at 2:00 AM
function startCleanupJob() {
  console.log('[Cleanup Job] Initializing daily image cleanup job (Runs at 02:00 AM)');
  cron.schedule('0 2 * * *', cleanupOldImages);
  
  // Also run once on startup just to clear backlogs immediately
  cleanupOldImages();
}

module.exports = startCleanupJob;
