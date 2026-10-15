#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { pipeline } = require("node:stream/promises");
const { recursiveScan } = require("../_tools/npmscanner");

//
// const seed = ["typescript", "@tanstack/react-query", "xhr"]; /*
const seed = require("../popular-pkgs/names-per-monthly_dl.json");
// */

async function main() {
  const limit = Number(process.argv[2]);
  const patternFile = process.argv[3] && path.resolve(process.argv[3]);
  if (!Number.isSafeInteger(limit) || limit < 1 || !patternFile) {
    throw new Error("Usage: node greptarballs/runScan.js <N> <pattern-file>");
  }
  fs.readFileSync(patternFile);
  const cacheDir = path.join(__dirname, "_cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  return recursiveScan({
    name: "gtb_" + path.basename(patternFile),
    targetPath: __dirname,
    seed: seed.slice(0, limit),
    recursive: true,
    parallel: 1,
    cache: false,
    dataCallback: async (pkg) => {
      const tarball = path.join(
        cacheDir,
        `${encodeURIComponent(pkg.name)}.tgz`,
      );
      if (!fs.existsSync(tarball)) {
        const partial = `${tarball}.${process.pid}.part`;
        const response = await fetch(pkg.dist.tarball);
        if (!response.ok) throw new Error(`Tarball HTTP ${response.status}`);
        await pipeline(response.body, fs.createWriteStream(partial));
        fs.renameSync(partial, tarball);
      }
      try {
        const file = execFileSync(
          "ugrep",
          ["-zn", "-f", patternFile, tarball],
          {
            encoding: "utf8",
            maxBuffer: 64 * 1024 * 1024,
          },
        ).trimEnd();
        if (file) return { name: pkg.name, found: file.split("\n") };
      } catch (error) {
        // Ignore exit code 1 (no matches found)
        if (error.status !== 1) throw error;
      }
    },
  });
}

main().then((res) => {
  if (res.errors && res.errors.length > 0) {
    console.error(res.errors.reverse());
  }
}, console.error);
