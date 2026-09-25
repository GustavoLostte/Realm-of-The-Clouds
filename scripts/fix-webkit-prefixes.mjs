#!/usr/bin/env node
/**
 * Auto-add missing -webkit-backdrop-filter and -webkit-filter prefixes
 * to all CSS files in the project.
 * 
 * This is a one-time fix — going forward, the PostCSS autoprefixer handles this.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(import.meta.dirname, '..', 'src');
let totalFixed = 0;
let filesFixed = 0;

function findCssFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && entry !== 'node_modules') {
      results.push(...findCssFiles(full));
    } else if (extname(entry) === '.css') {
      results.push(full);
    }
  }
  return results;
}

function addWebkitPrefixes(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const newLines = [];
  let fixCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Get the leading whitespace
    const indent = line.match(/^(\s*)/)[1];
    
    // --- backdrop-filter ---
    if (
      trimmed.startsWith('backdrop-filter:') &&
      !trimmed.startsWith('-webkit-backdrop-filter:') &&
      !trimmed.includes('none')
    ) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (!nextLine.startsWith('-webkit-backdrop-filter:')) {
        newLines.push(line);
        newLines.push(`${indent}-webkit-${trimmed}`);
        fixCount++;
        continue;
      }
    }
    
    // --- filter (NOT inside @keyframes, NOT backdrop-filter) ---
    if (
      trimmed.startsWith('filter:') &&
      !trimmed.startsWith('-webkit-filter:')
    ) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (!nextLine.startsWith('-webkit-filter:')) {
        let inKeyframes = false;
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const prev = lines[j].trim();
          if (/^\d+%\s*\{/.test(prev) || /^(from|to)\s*\{/.test(prev)) {
            inKeyframes = true;
            break;
          }
        }
        
        if (trimmed.match(/^\d+%.*filter:/) || trimmed.match(/^(from|to).*filter:/)) {
          inKeyframes = true;
        }
        
        if (!inKeyframes) {
          newLines.push(line);
          newLines.push(`${indent}-webkit-${trimmed}`);
          fixCount++;
          continue;
        }
      }
    }
    
    newLines.push(line);
  }

  if (fixCount > 0) {
    writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    const relative = filePath.replace(join(import.meta.dirname, '..') + '/', '');
    console.log(`  ✅ ${relative}: +${fixCount} webkit prefixes`);
    totalFixed += fixCount;
    filesFixed++;
  }
}

console.log('🔧 Adding missing -webkit- prefixes to all CSS files...\n');

const cssFiles = findCssFiles(SRC_DIR);
for (const file of cssFiles) {
  addWebkitPrefixes(file);
}

console.log(`\n✨ Done! Fixed ${totalFixed} properties across ${filesFixed} files.`);
console.log('ℹ️  Going forward, PostCSS autoprefixer will handle this automatically.\n');
