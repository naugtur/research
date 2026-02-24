#!/usr/bin/env node

const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const DATA_FILE = path.join(__dirname, '..', 'exports-data.json');
const PROGRESS_FILE = path.join(__dirname, 'search-progress.json');
const OUTPUT_FILE = path.join(__dirname, 'cjs-zero.md');

const SEARCH_PATTERN = '0 && (module.exports = ';

/**
 * Recursively extract all .js and .cjs file paths from an exports object
 */
function extractJsCjsPaths(obj, paths = []) {
  if (typeof obj === 'string') {
    if (obj.endsWith('.js') || obj.endsWith('.cjs')) {
      paths.push(obj);
    }
    return paths;
  }
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractJsCjsPaths(item, paths);
    }
    return paths;
  }
  
  if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      extractJsCjsPaths(value, paths);
    }
    return paths;
  }
  
  return paths;
}

/**
 * Load progress from file
 */
async function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    const content = await fs.readFile(PROGRESS_FILE, 'utf8');
    const data = JSON.parse(content);
    return {
      processed: new Set(data.processed || []),
      errors: data.errors || []
    };
  }
  return { processed: new Set(), errors: [] };
}

/**
 * Save progress to file
 */
async function saveProgress(progress) {
  await fs.writeFile(
    PROGRESS_FILE,
    JSON.stringify({
      processed: Array.from(progress.processed),
      errors: progress.errors
    }, null, 2)
  );
}

/**
 * Get tarball URL for a package from npm registry
 */
async function getTarballUrl(packageName) {
  // Handle scoped packages by encoding the name
  const encodedName = packageName.startsWith('@') 
    ? `@${encodeURIComponent(packageName.slice(1))}`
    : encodeURIComponent(packageName);
  
  const metadataUrl = `https://registry.npmjs.org/${encodedName}/latest`;
  
  const result = execSync(`curl -sL "${metadataUrl}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  const pkg = JSON.parse(result);
  return pkg.dist.tarball;
}

/**
 * Search a package tarball for the pattern using ugrep
 * Returns match output if found, null otherwise
 */
function searchPackage(tarballUrl, exportPaths) {
  if (exportPaths.length === 0) {
    return null;
  }
  
  // Build --include arguments for each export path
  // Paths in exports are like "./dist/index.cjs", need to prefix with "package/"
  const includeArgs = exportPaths.map(p => {
    // Remove leading "./" if present and prefix with "package/"
    const cleanPath = p.startsWith('./') ? p.slice(2) : p;
    return `--include="package/${cleanPath}"`;
  }).join(' ');
  
  // Use -F for fixed string matching (not regex), -A10 for 10 lines after context
  const command = `curl -sL "${tarballUrl}" | ugrep -z -F -A10 ${includeArgs} '${SEARCH_PATTERN}'`;
  
  const result = spawnSync('sh', ['-c', command], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer
  });
  
  // ugrep returns 0 if matches found, 1 if no matches, >1 for errors
  if (result.status === 0 && result.stdout && result.stdout.trim()) {
    // Truncate each line to 200 characters in case of minified code
    const truncated = result.stdout
      .split('\n')
      .map(line => line.length > 200 ? line.slice(0, 200) + '...' : line)
      .join('\n')
      .trim();
    return truncated;
  }
  
  if (result.status > 1) {
    // Actual error occurred
    throw new Error(result.stderr || `ugrep exited with status ${result.status}`);
  }
  
  return null;
}

/**
 * Append a match to the output markdown file
 */
async function appendMatch(packageName, matchOutput) {
  const content = `### ${packageName}\n\n\`\`\`\n${matchOutput}\n\`\`\`\n\n`;
  await fs.appendFile(OUTPUT_FILE, content);
}

async function main() {
  // Load data and progress
  const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  const progress = await loadProgress();
  
  console.log(`Total packages: ${data.length}`);
  console.log(`Already processed: ${progress.processed.size}`);
  
  let successCount = 0;
  let matchCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const packageName = item.name;
    
    if (progress.processed.has(packageName)) {
      skipCount++;
      continue;
    }
    
    console.log(`\n[${i + 1}/${data.length}] Processing ${packageName}...`);
    
    try {
      // Extract JS/CJS paths from exports field
      const exportPaths = extractJsCjsPaths(item.exports);
      
      if (exportPaths.length === 0) {
        console.log(`  ⚠ No .js/.cjs files in exports`);
        progress.processed.add(packageName);
        successCount++;
        continue;
      }
      
      console.log(`  Found ${exportPaths.length} export path(s)`);
      
      // Get tarball URL
      const tarballUrl = await getTarballUrl(packageName);
      
      // Search for pattern
      const matchOutput = searchPackage(tarballUrl, exportPaths);
      
      if (matchOutput) {
        console.log(`  ✓ MATCH FOUND`);
        await appendMatch(packageName, matchOutput);
        matchCount++;
      } else {
        console.log(`  No match`);
      }
      
      progress.processed.add(packageName);
      successCount++;
      
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      errorCount++;
      progress.errors.push({
        package: packageName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      // Still mark as processed to avoid retrying broken packages
      progress.processed.add(packageName);
    }
    
    // Save progress every 10 packages
    if ((i + 1) % 10 === 0) {
      await saveProgress(progress);
      console.log(`\nProgress saved. Processed: ${successCount}, Matches: ${matchCount}, Errors: ${errorCount}, Skipped: ${skipCount}`);
    }
  }
  
  // Final save
  await saveProgress(progress);
  
  console.log('\n=== Search Complete ===');
  console.log(`Successful: ${successCount}`);
  console.log(`Matches found: ${matchCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped (already processed): ${skipCount}`);
  console.log(`Total processed: ${progress.processed.size}`);
  
  if (matchCount > 0) {
    console.log(`\nResults written to ${OUTPUT_FILE}`);
  }
  
  if (progress.errors.length > 0) {
    console.log(`Errors logged in ${PROGRESS_FILE}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractJsCjsPaths, searchPackage };
