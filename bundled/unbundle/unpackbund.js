#!/usr/bin/env node

const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, '..', 'bundleds-data.json');
const PROGRESS_FILE = path.join(__dirname, 'unpack-progress.json');
const OUTPUT_DIR = path.join(__dirname, '_cache');

async function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    const content = await fs.readFile(PROGRESS_FILE, 'utf8');
    return JSON.parse(content);
  }
  return { processed: new Set(), errors: [] };
}

async function saveProgress(progress) {
  await fs.writeFile(
    PROGRESS_FILE,
    JSON.stringify({
      processed: Array.from(progress.processed),
      errors: progress.errors
    }, null, 2)
  );
}

async function downloadAndExtract(packageName) {
  const outputPath = path.join(OUTPUT_DIR, packageName);
  const tempDir = path.join(OUTPUT_DIR, '.temp', packageName);
  
  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // Get package metadata to find tarball URL
    console.log(`Fetching metadata for ${packageName}...`);
    const metadataUrl = `https://registry.npmjs.org/${packageName}/latest`;
    const metadata = execSync(`curl -sL "${metadataUrl}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const pkg = JSON.parse(metadata);
    const tarballUrl = pkg.dist.tarball;
    const tarballName = `${packageName.replace('/', '-')}.tgz`;
    const tarballPath = path.join(tempDir, tarballName);
    
    // Download tarball using curl
    console.log(`Downloading ${packageName}...`);
    execSync(`curl -sL "${tarballUrl}" -o "${tarballName}"`, {
      cwd: tempDir,
      stdio: 'ignore'
    });
    
    // Create output directory
    await fs.mkdir(outputPath, { recursive: true });
    
    // Extract package.json for reference
    console.log(`Extracting package.json from ${packageName}...`);
    try {
      execSync(`tar -xzf "${tarballName}" package/package.json --strip-components=1`, {
        cwd: outputPath,
        stdio: 'ignore'
      });
    } catch (e) {
      // package.json might not exist, continue
    }
    
    // Extract only node_modules from the tarball
    console.log(`Extracting node_modules from ${packageName}...`);
    try {
      execSync(`tar -xzf "${tarballPath}" package/node_modules --strip-components=1`, {
        cwd: outputPath,
        stdio: 'ignore'
      });
      
      // Check if node_modules was actually extracted
      const nodeModulesPath = path.join(outputPath, 'node_modules');
      if (existsSync(nodeModulesPath)) {
        console.log(`✓ Extracted bundled dependencies for ${packageName}`);
        return true;
      } else {
        console.log(`⚠ No node_modules found in ${packageName}`);
        return false;
      }
    } catch (error) {
      console.log(`⚠ No node_modules found in ${packageName}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error processing ${packageName}:`, error.message);
    throw error;
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  // Create output directories
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, '.temp'), { recursive: true });
  
  // Load data and progress
  const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  const progress = await loadProgress();
  progress.processed = new Set(progress.processed || []);
  
  console.log(`Total packages: ${data.length}`);
  console.log(`Already processed: ${progress.processed.size}`);
  
  let successCount = 0;
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
      const hasNodeModules = await downloadAndExtract(packageName);
      if (hasNodeModules) {
        successCount++;
      }
      progress.processed.add(packageName);
    } catch (error) {
      errorCount++;
      progress.errors.push({
        package: packageName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Save progress every 10 packages
    if ((i + 1) % 10 === 0) {
      await saveProgress(progress);
      console.log(`\nProgress saved. Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skipCount}`);
    }
  }
  
  // Final save
  await saveProgress(progress);
  
  console.log('\n=== Extraction Complete ===');
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Total processed: ${progress.processed.size}`);
  
  if (progress.errors.length > 0) {
    console.log(`\nErrors logged in ${PROGRESS_FILE}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadAndExtract };
