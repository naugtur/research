# Bundled Dependencies Analysis

This directory contains tools to extract and analyze bundled dependencies from npm packages.

## Scripts

### 1. `unpackbund.js` - Extract Bundled Dependencies

Downloads packages with bundled dependencies and extracts their `node_modules` directories.

**Usage:**
```bash
node unpackbund.js
```

**What it does:**
- Reads `bundleds-data.json` (array of `{name, bundleDependencies}` objects)
- For each package:
  - Downloads the tarball using `npm pack`
  - Extracts only the `node_modules/` directory
  - Saves to `extracted/<package-name>/`
  - Copies the parent `package.json` for reference
- Tracks progress in `unpack-progress.json` for crash recovery
- Logs errors and statistics

**Output Structure:**
```
extracted/
  <package-name>/
    package.json          # Parent package.json
    node_modules/         # Bundled dependencies
      <bundled-dep-1>/
      <bundled-dep-2>/
```

### 2. `analyze.js` - Find Install/Build Scripts

Scans extracted bundled dependencies for installation and build scripts.

**Usage:**
```bash
node analyze.js
```

**What it does:**
- Recursively scans all `extracted/` directories
- Finds all `package.json` files in bundled dependencies
- Identifies packages with:
  - Install scripts (`install`, `preinstall`, `postinstall`)
  - Build scripts (`build`, `prepare`, `prebuild`, etc.)
  - Native modules (`binding.gyp` files)
- Generates `install-scripts.md` report

**Run after** `unpackbund.js` completes.

## Workflow

```bash
# Step 1: Extract bundled dependencies
node unpackbund.js

# Step 2: Analyze for install/build scripts
node analyze.js

# Step 3: Review the results
cat install-scripts.md
```

## Progress & Recovery

- `unpack-progress.json` - Tracks processed packages and errors
- Delete this file to start fresh
- Script automatically resumes from last checkpoint

## Output Files

- `_cache/` - Directory containing all extracted bundled dependencies
- `unpack-progress.json` - Progress tracking for extraction
- `install-scripts.md` - Analysis report of install/build scripts
