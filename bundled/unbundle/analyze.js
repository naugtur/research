#!/usr/bin/env node
// @ts-check

const fs = require('fs').promises;
const { existsSync, readdirSync, statSync } = require('fs');
const path = require('path');

const EXTRACTED_DIR = path.join(__dirname, '_cache');
const OUTPUT_FILE = path.join(__dirname, 'install-scripts.md');

// Scripts that indicate installation or build processes
const INSTALL_SCRIPTS = ['install', 'preinstall', 'postinstall'];
// const INSTALL_SCRIPTS = ['install', 'preinstall', 'postinstall','prepare', 'prepack', 'postpack', 'prepublish', 'postpublish'];

function findPackageJsonFiles(dir, results = []) {
  if (!existsSync(dir)) {
    return results;
  }
  
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    
    try {
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        findPackageJsonFiles(fullPath, results);
      } else if (entry === 'package.json') {
        results.push(fullPath);
      }
    } catch (error) {
      // Skip files/dirs we can't access
      console.error(`Warning: Cannot access ${fullPath}`);
    }
  }
  
  return results;
}

async function analyzePackageJson(pkgJsonPath) {
  try {
    const content = await fs.readFile(pkgJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    
    const findings = {
      path: path.dirname(pkgJsonPath),
      name: pkg.name || 'unknown',
      installScripts: [],
      buildScripts: [],
      hasGypFile: false
    };
    
    // Check for scripts
    if (pkg.scripts) {
      for (const scriptName of INSTALL_SCRIPTS) {
        if (pkg.scripts[scriptName]) {
          findings.installScripts.push({
            name: scriptName,
            command: pkg.scripts[scriptName]
          });
        }
      }
    }
    
    // Check for binding.gyp (native modules)
    const gypPath = path.join(path.dirname(pkgJsonPath), 'binding.gyp');
    if (existsSync(gypPath)) {
      findings.hasGypFile = true;
    }
    
    // Only return if we found something relevant
    if (findings.installScripts.length > 0 || 
        findings.hasGypFile) {
      return findings;
    }
    
    return null;
  } catch (error) {
    console.error(`Error analyzing ${pkgJsonPath}:`, error.message);
    return null;
  }
}

function getRelativePath(fullPath) {
  return path.relative(EXTRACTED_DIR, fullPath);
}

async function checkNpmRegistry(packageName) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!res.ok) {
      return { exists: false, hasInstallScripts: false };
    }
    const packument = await res.json();
    
    // Check for install/postinstall/preinstall scripts
    const hasInstallScripts = packument.scripts && (
      packument.scripts.install ||
      packument.scripts.postinstall ||
      packument.scripts.preinstall
    );
    
    return { 
      exists: true, 
      hasInstallScripts: !!hasInstallScripts,
      packumentUrl: `https://registry.npmjs.org/${packageName}/latest`
    };
  } catch (error) {
    return { exists: false, hasInstallScripts: false };
  }
}

function generateMarkdown(results) {
  let md = '# Bundled Dependencies with Install/Build Scripts\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `Total parent packages analyzed: ${results.length}\n\n`;
  
  let totalWithScripts = 0;
  let totalInstallScripts = 0;
  let totalGypFiles = 0;
  
  for (const result of results) {
    if (result.findings.length > 0) {
      totalWithScripts++;
    }
    result.findings.forEach(f => {
      if (f.installScripts.length > 0) totalInstallScripts++;
      if (f.hasGypFile) totalGypFiles++;
    });
  }
  
  md += `## Summary\n\n`;
  md += `- Parent packages with bundled deps containing scripts: ${totalWithScripts}\n`;
  md += `- Bundled deps with install scripts: ${totalInstallScripts}\n`;
  md += `- Bundled deps with binding.gyp: ${totalGypFiles}\n\n`;
  
  md += '---\n\n';
  
  for (const result of results) {
    if (result.findings.length === 0) {
      continue;
    }
    
    md += `## ${result.parentPackage}\n\n`;
    
    // Deduplicate findings by creating a unique key
    const seen = new Set();
    const uniqueFindings = [];
    
    for (const finding of result.findings) {
      // Create a unique key based on name, scripts, and gyp file
      const scriptsKey = finding.installScripts
        .map(s => `${s.name}:${s.command}`)
        .sort()
        .join('|');
      const key = `${finding.name}||${scriptsKey}||${finding.hasGypFile}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFindings.push(finding);
      }
    }
    
    for (const finding of uniqueFindings) {
      md += `### ${finding.name}\n\n path: ${getRelativePath(finding.path)}\n\n`;
      
      if (finding.installScripts.length > 0) {
        md += '**Install Scripts:**\n\n';
        for (const script of finding.installScripts) {
          md += `- \`${script.name}\`: \`${script.command}\`\n`;
        }
        md += '\n';
      }
      
      if (finding.hasGypFile) {
        md += '**Native Module:** Contains `binding.gyp`\n\n';
      }
      
      // Add NPM registry information
      if (finding.npmInfo) {
        if (finding.npmInfo.exists) {
          md += `**NPM:** [packument](${finding.npmInfo.packumentUrl})`;
          if (finding.npmInfo.hasInstallScripts) {
            md += ' - Has install scripts on npm too';
          } else {
            md += ' - ⚠️ No install scripts on npm';
          }
          md += '\n\n';
        } else {
          md += '**NPM:** Package not found on npm\n\n';
        }
      }
    }
  }
  
  return md;
}

async function main() {
  if (!existsSync(EXTRACTED_DIR)) {
    console.error(`Error: Extracted directory not found: ${EXTRACTED_DIR}`);
    console.error('Please run unpackbund.js first to extract packages.');
    process.exit(1);
  }
  
  const parentDirs = readdirSync(EXTRACTED_DIR).filter(entry => {
    const fullPath = path.join(EXTRACTED_DIR, entry);
    return statSync(fullPath).isDirectory() && entry !== '.temp';
  });
  
  console.log(`Found ${parentDirs.length} parent packages to analyze...`);
  
  const results = [];
  
  for (let i = 0; i < parentDirs.length; i++) {
    const parentPackage = parentDirs[i];
    const parentPath = path.join(EXTRACTED_DIR, parentPackage);
    
    console.log(`[${i + 1}/${parentDirs.length}] Analyzing ${parentPackage}...`);
    
    const packageJsonFiles = findPackageJsonFiles(parentPath);
    const findings = [];
    
    for (const pkgJsonPath of packageJsonFiles) {
      const analysis = await analyzePackageJson(pkgJsonPath);
      if (analysis) {
        // Check NPM registry for this package
        const npmInfo = await checkNpmRegistry(analysis.name);
        analysis.npmInfo = npmInfo;
        findings.push(analysis);
      }
    }
    
    results.push({
      parentPackage,
      findings,
      totalPackageJsons: packageJsonFiles.length
    });
    
    if (findings.length > 0) {
      console.log(`  ✓ Found ${findings.length} package(s) with install/build scripts`);
    }
  }
  
  // Generate markdown report
  const markdown = generateMarkdown(results);
  await fs.writeFile(OUTPUT_FILE, markdown, 'utf8');
  
  console.log(`\n=== Analysis Complete ===`);
  console.log(`Report written to: ${OUTPUT_FILE}`);
  
  // Print summary
  const withFindings = results.filter(r => r.findings.length > 0);
  console.log(`\nPackages with install/build scripts: ${withFindings.length}/${results.length}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzePackageJson, findPackageJsonFiles };
