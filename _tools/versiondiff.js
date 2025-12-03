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

  // Create output filename from package name and versions
  const safePackageName = packageName.replace(/[@/]/g, '-');
  const outputFile = path.join(process.cwd(), `${safePackageName}-${versionA}-to-${versionB}.diff`);

  console.log(`Diffing versions ${versionA} and ${versionB} of ${packageName}:`);
  console.log(`Writing diff to: ${outputFile}`);
  
  try {
    const diffOutput = execSync(`diff -ruNw ${dirA} ${dirB}`, { 
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large diffs
    });
    fs.writeFileSync(outputFile, diffOutput, 'utf8');
  } catch (e) {
    // diff exits with code 1 when differences are found
    if (e.status === 1) {
      // Write the diff output (available in e.stdout)
      fs.writeFileSync(outputFile, e.stdout, 'utf8');
    } else {
      throw e;
    }
  }

  console.log(`Diff saved to: ${outputFile}`);

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
}

main().catch(err => {
  console.error('Error during version diff:', err);
  process.exit(1);
});