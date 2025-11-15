#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const action = process.argv[2];
const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'src', 'pages');
const backupDir = path.join(repoRoot, '.src_pages_backup');

function move(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.renameSync(src, dest);
  return true;
}

try {
  if (action === 'remove') {
    // Move src/pages -> .src_pages_backup (if present)
    if (fs.existsSync(pagesDir)) {
      if (fs.existsSync(backupDir)) {
        // backup exists, remove it first to avoid conflicts
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
      move(pagesDir, backupDir);
      console.log('Moved src/pages -> .src_pages_backup');
    } else {
      console.log('No src/pages to move');
    }
  } else if (action === 'restore') {
    // Move .src_pages_backup -> src/pages
    if (fs.existsSync(backupDir)) {
      if (fs.existsSync(pagesDir)) {
        fs.rmSync(pagesDir, { recursive: true, force: true });
      }
      move(backupDir, pagesDir);
      console.log('Restored .src_pages_backup -> src/pages');
    } else {
      console.log('No backup found to restore');
    }
  } else {
    console.log('Usage: node scripts/toggle-pages.js <remove|restore>');
    process.exit(1);
  }
} catch (err) {
  console.error('Error toggling pages directory:', err);
  process.exit(2);
}
