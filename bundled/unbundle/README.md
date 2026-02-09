# Bundled Dependencies Analysis

This directory contains tools to extract and analyze bundled dependencies from npm packages.

## Observations

- Many of them are false positives
- A few are node-gyp. I wonder if they actually work.

[install-scripts.md](./install-scripts.md)

## Scripts

### 1. `unpackbund.js` - Extract Bundled Dependencies

Downloads packages with bundled dependencies and extracts their `node_modules` directories.

**Usage:**
```bash
node unpackbund.js
```

### 2. `analyze.js` - Find Install/Build Scripts

Scans extracted bundled dependencies for installation and build scripts.

**Usage:**
```bash
node analyze.js
```


## Progress & Recovery

- `unpack-progress.json` - Tracks processed packages and errors
- Delete this file to start fresh
- Script automatically resumes from last checkpoint

## Output Files

- `_cache/` - Directory containing all extracted bundled dependencies
- `unpack-progress.json` - Progress tracking for extraction
- `install-scripts.md` - Analysis report of install/build scripts
