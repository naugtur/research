#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT = "#default";

const pathSeparator = process.platform === "win32" ? ";" : ":";
const scriptName = process.env.npm_lifecycle_event;
const scriptPayload = process.argv[3];

const isPnpm =
  (process.env.npm_config_user_agent || "").includes("pnpm") ||
  (process.env.npm_execpath || "").includes("pnpm");
const packageManager = isPnpm ? "pnpm" : "npm";

const pkgJsonPath = process.env.npm_package_json;

if (!pkgJsonPath) {
  throw Error(
    `[LavaMoat] FATAL: 'npm_package_json' environment variable is missing. A modern package manager is required.`,
  );
}

const pkgJsonFolder = path.dirname(pkgJsonPath);
const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));

if (pkgData.scriptsConfig && !pkgData?.scriptsConfig?.[DEFAULT]) {
  throw Error(
    `[LavaMoat] package.json->scriptsConfig must have a default configuration under the key '${DEFAULT}'. This is used as a fallback when a script doesn't specify a config.`,
  );
}
const config = readConfig(
  pkgData?.scriptsConfig?.[scriptName] || pkgData?.scriptsConfig?.[DEFAULT],
);

console.log(`\n[LavaMoat protecting: ${scriptName}]`);
const fallbackShell = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
const shellArgs = process.platform === "win32" ? ["/d", "/s", "/c"] : ["-c"];

// Smell: Windows environment variables are case-insensitive, but Node's process.env
// might expose it as 'Path' instead of 'PATH'. Checking both ensures it doesn't get wiped out.
const existingPath = process.env.PATH || process.env.Path || "";

const customEnv = {
  ...filterEnv(process.env, config.envBanKeywords),
  PATH: envPathOpinions(existingPath),
  NODE_OPTIONS: installNodeOptions(process.env?.NODE_OPTIONS, config.options),
};

console.log(customEnv);

const result = spawnSync(fallbackShell, [...shellArgs, scriptPayload], {
  stdio: "inherit",
  env: customEnv,
  cwd: pkgJsonFolder,
});
process.exit(result.status || 1);

/**
 * Install Node.js options to load matching configuration
 *
 * @param {string} existingOptions
 * @param {string} scriptConf
 */
function installNodeOptions(existingOptions, configOptions) {
  if (!configOptions) {
    return existingOptions;
  }
  // 1. @lavamoat/node-guard will exit if permissions are not enabled
  // 2. load config with permissions
  const confOption = `--require="@lavamoat/node-guard" ${makeFlagsFromConfig(configOptions)}`;
  return `${existingOptions || ""} ${confOption}`.trim();
}

/**
 * Filter environment variables based on ban keywords
 * @param {NodeJS.ProcessEnv} env
 * @param {string[]} banKeywords
 * @returns {NodeJS.ProcessEnv}
 */
function filterEnv(env, banKeywords = []) {
  const filteredEnv = {};
  banKeywords = banKeywords.map((keyword) => keyword.toLowerCase());
  for (const [key, value] of Object.entries(env)) {
    if (!banKeywords.some((keyword) => key.toLowerCase().includes(keyword))) {
      filteredEnv[key] = value;
    }
  }
  return filteredEnv;
}

function readConfig(configName) {
  const configPath = path.join(__dirname, configName);
  let conf;
  try {
    conf = require(configPath);
    if (typeof conf !== "object" || conf === null) {
      throw Error(`Expected an object, got ${typeof conf}`);
    }
  } catch (err) {
    throw Error(
      `[LavaMoat] Error loading script config file "${configPath}": ${err.message}`,
    );
  }
  return conf;
}
function makeFlagsFromConfig(configOptions) {
  return Object.entries(configOptions)
    .map(([arg, value]) => {
      if (typeof value === "boolean") {
        return value ? arg : "";
      } else if (Array.isArray(value)) {
        return value.map((v) => `${arg}="${v}"`).join(" ");
      } else {
        return `${arg}="${value}"`;
      }
    })
    .filter(Boolean)
    .join(" ");
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
