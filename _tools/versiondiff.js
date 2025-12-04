// Specification: downloads two versions of a npm package and runs a diff on their sources.
//  avoid using dependencies, rely on latest APIs in node.js
// Usage: node versiondiff.js npmPackageName versionA versionB
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Lazy-load dprint only when needed
let formatter = null;
async function getFormatter() {
  if (!formatter) {
    try {
      const { createFromBuffer } = await import('dprint');
      const wasmBuffer = fs.readFileSync(
        require.resolve('dprint/js-formatter.wasm')
      );
      formatter = createFromBuffer(wasmBuffer);
    } catch (e) {
      throw new Error(`Failed to initialize dprint: ${e.message}`);
    }
  }
  return formatter;
}

if (process.argv.length !== 5) {
  console.error(
    'Usage: node versiondiff.js <npm-package-name> <older-version> <newer-version>',
  );
  process.exit(1);
}

const [,, packageName, versionA, versionB] = process.argv;

function isMinified(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Heuristics for detecting minified JS:
  // - Average line length > 500 characters
  // - More than 80% of lines are over 200 characters
  // - File has fewer than 10 lines but is over 1KB
  
  if (lines.length < 10 && content.length > 1024) {
    return true;
  }
  
  const longLines = lines.filter(line => line.length > 200).length;
  if (longLines / lines.length > 0.8) {
    return true;
  }
  
  const avgLineLength = content.length / lines.length;
  if (avgLineLength > 500) {
    return true;
  }
  
  return false;
}

async function formatJsFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fmt = await getFormatter();
    const formatted = fmt.formatText({
      filePath,
      fileText: content,
    });
    fs.writeFileSync(filePath, formatted, 'utf8');
    console.debug(`- Formatted ${filePath}`);
  } catch (e) {
    // If formatting fails, log but continue
    console.warn(`Warning: Could not format ${filePath}:`, e.message);
  }
}

function unminify(filePath, dir) {
  if (filePath.endsWith('.js') && isMinified(filePath)) {
    console.log(`Formatting minified file: ${path.relative(dir, filePath)}`);
    formatJsFile(filePath);
  }
}

function preprocessDirectory(dir, processFn) {
  const walkDir = (currentPath) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and common non-source directories
        if (!['node_modules', '.git', 'test', 'tests'].includes(entry.name)) {
          walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        processFn(fullPath, dir);
      }
    }
  };
  
  walkDir(dir);
}

async function fetchPackageVersion(name, version, targetDir) {
  const packageSpec = `${name}@${version}`;
  console.log(`Fetching ${packageSpec} into ${targetDir}`);
  execSync(`npm pack ${packageSpec}`, { cwd: targetDir, stdio: 'inherit' });
  const tarballName = fs.readdirSync(targetDir).find(file => file.endsWith('.tgz'));
  execSync(`tar -xzf ${tarballName} --strip-components=1`, {
    cwd: targetDir,
    stdio: 'inherit',
  });
  fs.unlinkSync(path.join(targetDir, tarballName));
}

function parseDiffIntoFiles(diffOutput) {
  const lines = diffOutput.split('\n');
  const fileDiffs = new Map();
  let currentFile = null;
  let currentDiff = [];
  
  for (const line of lines) {
    // Check for diff header lines like "diff -ruNw /tmp/... /tmp/..."
    if (line.startsWith('diff -')) {
      if (currentFile && currentDiff.length > 0) {
        fileDiffs.set(currentFile, currentDiff.join('\n'));
      }
      currentDiff = [line];
      currentFile = null;
    } else if (line.startsWith('---') || line.startsWith('+++')) {
      currentDiff.push(line);
      // Extract filename from "--- /tmp/.../versionA/path/to/file.js"
      if (line.startsWith('---')) {
        const match = line.match(/---\s+[^\s]+\/[^\/]+\/(.+?)(?:\s|$)/);
        if (match) {
          currentFile = match[1];
        }
      }
    } else {
      currentDiff.push(line);
    }
  }
  
  // Don't forget the last file
  if (currentFile && currentDiff.length > 0) {
    fileDiffs.set(currentFile, currentDiff.join('\n'));
  }
  
  return fileDiffs;
}

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'versiondiff-'));
  const dirA = path.join(tempDir, versionA);
  const dirB = path.join(tempDir, versionB);
  fs.mkdirSync(dirA);
  fs.mkdirSync(dirB);

  await fetchPackageVersion(packageName, versionA, dirA);
  await fetchPackageVersion(packageName, versionB, dirB);

  console.log('Preprocessing files...');
  preprocessDirectory(dirA, unminify);
  preprocessDirectory(dirB, unminify);

  // Create output directory from package name and versions
  const safePackageName = packageName.replace(/[@/]/g, '-');
  const outputDir = path.join(process.cwd(), `${safePackageName}-${versionA}-to-${versionB}`);
  
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Diffing versions ${versionA} and ${versionB} of ${packageName}:`);
  console.log(`Writing diffs to: ${outputDir}`);
  
  try {
    const diffOutput = execSync(`diff -ruNw ${dirA} ${dirB}`, { 
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large diffs
    });
    
    const fileDiffs = parseDiffIntoFiles(diffOutput);
    saveDiffsToFiles(fileDiffs, outputDir);
  } catch (e) {
    // diff exits with code 1 when differences are found
    if (e.status === 1 && e.stdout) {
      const fileDiffs = parseDiffIntoFiles(e.stdout);
      saveDiffsToFiles(fileDiffs, outputDir);
    } else {
      throw e;
    }
  }

  console.log(`Diffs saved to: ${outputDir}`);
  console.log(`Total files changed: ${fs.readdirSync(outputDir).length}`);

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function saveDiffsToFiles(fileDiffs, outputDir) {
  for (const [filePath, diff] of fileDiffs) {
    // Create safe filename by replacing path separators
    const safeName = filePath.replace(/\//g, '_') + '.diff';
    const outputPath = path.join(outputDir, safeName);
    fs.writeFileSync(outputPath, diff, 'utf8');
    console.log(`  - ${filePath}`);
  }
}

main().catch(err => {
  console.error('Error during version diff:', err);
  process.exit(1);
});