#!/usr/bin/env node
const { execSync, exec } = require("node:child_process");
const fs = require("node:fs");

const permissions = {
    native: "--allow-addons --allow-ffi",
    wasi: "--allow-wasi",
    worker: "--allow-worker",
    "cwd:read": `--allow-fs-read=${process.cwd()}`,
    "cwd:write": `--allow-fs-write=${process.cwd()}`,
    cwd: `--allow-fs-read=${process.cwd()} --allow-fs-write=${process.cwd()}`,
    "fs:read": "--allow-fs-read",
    "fs:write": "--allow-fs-write",
    fs: "--allow-fs-read --allow-fs-write",
    net: "--allow-net",
    child_process: "--allow-child-process",
    worker: "--allow-worker",
    inspector: "--allow-inspector",
  };


const pathSeparator = process.platform === "win32" ? ";" : ":";
const scriptName = process.env.npm_lifecycle_event;
const scriptPayload = process.argv[3];

const isPnpm =
  (process.env.npm_config_user_agent || "").includes("pnpm") ||
  (process.env.npm_execpath || "").includes("pnpm");
const packageManager = isPnpm ? "pnpm" : "npm";

const pkgJsonPath = process.env.npm_package_json;

if (!pkgJsonPath) {
  throw new Error(
    `[LavaMoat] FATAL: 'npm_package_json' environment variable is missing. A modern package manager is required.`,
  );
}

const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
const lavamoat = pkgData.lavamoat || null;
const scriptPolicy = lavamoat?.scripts?.[scriptName] || null;

console.log(`\n[LavaMoat protecting: ${scriptName}]`);
try {
  const fallbackShell = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
  const shellArgs = process.platform === "win32" ? ["/d", "/s", "/c"] : ["-c"];

  // Tradeoff: Windows environment variables are case-insensitive, but Node's process.env
  // might expose it as 'Path' instead of 'PATH'. Checking both ensures it doesn't get wiped out.
  const existingPath = process.env.PATH || process.env.Path || "";

  const customEnv = {
    ...process.env, // Inherit existing environment variables

    // Rewrite/Prepend PATH
    PATH: envPathOpinions(existingPath),

    // Add new custom variables
    NODE_OPTIONS: installNodeOptions(process.env?.NODE_OPTIONS, scriptPolicy),
  };

  try {
    execSync(`${fallbackShell} ${shellArgs.join(" ")} "${scriptPayload}"`, {
      stdio: "inherit",
      env: customEnv,
    });
  } catch (execError) {
    const restrictedFlags = execError.stderr
      .toString()
      .split("\n")
      .filter((line) => line.includes("Access to this API has been restricted"))
      .map((line) => line.match(/--allow[^\s]*/)?.[0])
      .filter(Boolean);
    const recommendations = new Set();
    restrictedFlags.forEach((restrictedFlag) => {
    Object.entries(permissions).forEach(([perm, flags]) => {
        if (flags.includes(restrictedFlag)) {
          recommendations.add(perm);
        }
      });
    });

    if(!scriptPolicy.includes('cwd') && recommendations.has('fs')) {
      // Avoid recommending fs if cwd was not used before
      recommendations.delete('fs');
    }

    console.error(`[LavaMoat] Some of following permissions may help enable the script to run: ${[...recommendations].join(", ")}`);
    process.exit(execError.status || 1);
  }
} catch (error) {
  console.error(`[LavaMoat] Error executing script: "${scriptName}"`, error);
  process.exit(1);
}

/**
 *
 * @param {string} existingOptions
 * @param {string} scriptPolicy
 */
function installNodeOptions(existingOptions, scriptPolicy) {
  // preserve existing options and add permissions to them
  const permissionOptions = generatePermissions(scriptPolicy);
  return `${existingOptions || ""} ${permissionOptions}`.trim();
}

function generatePermissions(scriptPolicy) {
  if (!scriptPolicy) {
    return "";
  }

  
  return `--permission ${scriptPolicy
    .split(",")
    .map((perm) => permissions[perm.trim()])
    .join(" ")}`;
}

function envPathOpinions(PATH) {
  const pathFrgaments = PATH.split(pathSeparator);
  // This is to eliminate bin confusion attacks.
  // Find node_modules/.bin and remove it, put it on the end that gets looked up last when looking for a name in the path.
  const filteredFragments = pathFrgaments.filter(
    (fragment) => !fragment.endsWith("node_modules/.bin"),
  );
  const nodeModulesBinPath = pathFrgaments.find((fragment) =>
    fragment.endsWith("node_modules/.bin"),
  );
  if (nodeModulesBinPath) {
    filteredFragments.push(nodeModulesBinPath);
  }
  return filteredFragments.join(pathSeparator);
}
