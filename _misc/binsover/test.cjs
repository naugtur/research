const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const manager = process.argv[2];
if (!["npm", "pnpm", "yarn"].includes(manager)) {
  throw new Error("Usage: node test.cjs <npm|pnpm|yarn> (from a fixture folder)");
}

const fixture = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(fixture, "package.json"), "utf8")
);
const runs = path.join(fixture, ".runs");
fs.mkdirSync(runs, { recursive: true });
const run = fs.mkdtempSync(path.join(runs, `${manager}-`));

function command(args, options = {}) {
  const result = spawnSync(manager, args, {
    cwd: run,
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (result.stdout) console.error(result.stdout);
    if (result.stderr) console.error(result.stderr);
    throw new Error(
      `${manager} ${args.join(" ")} failed (status ${result.status}, signal ${result.signal})`
    );
  }
  return result;
}

function inspectBin(label, bin, required = false) {
  let stat;
  try {
    stat = fs.lstatSync(bin);
  } catch (error) {
    if (error.code !== "ENOENT" || required) throw error;
    console.log(`${label}: no .bin/tsc entry`);
    return;
  }
  console.log(`\n${label}: ${bin}`);
  if (stat.isSymbolicLink()) {
    console.log(`link: ${fs.readlinkSync(bin)}`);
    const target = fs.realpathSync(bin);
    console.log(`resolved: ${target}`);
    let directory = path.dirname(target);
    while (true) {
      const packagePath = path.join(directory, "package.json");
      if (fs.existsSync(packagePath)) {
        const owner = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        console.log(`owner: ${owner.name}@${owner.version}`);
        break;
      }
      const parent = path.dirname(directory);
      if (parent === directory) {
        throw new Error(`No owning package.json found for ${target}`);
      }
      directory = parent;
    }
    return [target];
  } else {
    // pnpm uses executable shims rather than symlinks.
    if (!stat.isFile() || stat.size > 16384) {
      throw new Error(`Unexpected bin entry (not a small shim): ${bin}`);
    }
    const shim = fs.readFileSync(bin, "utf8");
    console.log(`shim contents:\n${shim}`);
    const binDirectory = path.dirname(fs.realpathSync(bin));
    const targetMarker = shim.match(/^# cmd-shim-target=(.+)\r?$/m);
    if (targetMarker) {
      return [fs.realpathSync(path.resolve(binDirectory, targetMarker[1].trim()))];
    }
    return [...shim.matchAll(/^\s*exec .*\$(?:basedir(?:_abs|_win)?|\{basedir(?:_abs|_win)?\})\/([^"'\r\n]+)["']/gm)]
      .map((match) => path.resolve(binDirectory, match[1]))
      .filter((target) => fs.existsSync(target))
      .map((target) => fs.realpathSync(target));
  }
}

function tscOwner(targets) {
  const owners = new Set();
  for (const target of targets) {
    let directory = path.dirname(target);
    while (true) {
      const packagePath = path.join(directory, "package.json");
      if (fs.existsSync(packagePath)) {
        const installed = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        const bin = typeof installed.bin === "string"
          ? (installed.name.split("/").pop() === "tsc" ? installed.bin : undefined)
          : installed.bin?.tsc;
        if (bin && fs.realpathSync(path.resolve(directory, bin)) === target) {
          owners.add(`${installed.name}@${installed.version}`);
        }
        break;
      }
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  if (owners.size !== 1) {
    throw new Error(`Expected one tsc owner, found ${owners.size}: ${[...owners].join(", ")}`);
  }
  return [...owners][0];
}

const dependencies = manifest.dependencies;
fs.writeFileSync(
  path.join(run, "package.json"),
  JSON.stringify({
    name: manifest.name,
    private: true,
    packageManager: manifest.packageManager,
    devEngines: manifest.devEngines,
    dependencies,
  }, null, 2) + "\n"
);

console.log(`\nFixture: ${manifest.name}\nManager: ${manager}\nRun directory: ${run}`);
const versionResult = command(["--version"], { encoding: "utf8", stdio: "pipe" });
const version = versionResult.stdout.trim();
console.log(`Manager version: ${version}`);
const major = Number(version.split(".")[0]);
if (manager === "yarn" && (!Number.isInteger(major) || major < 2)) {
  throw new Error(`Yarn Modern (>=2) is required, found ${version}`);
}

if (manager === "yarn") {
  fs.writeFileSync(
    path.join(run, ".yarnrc.yml"),
    "nodeLinker: node-modules\nenableScripts: false\nenableImmutableInstalls: false\n"
  );
  // Establish an independent Yarn project rather than using an ancestor project.
  fs.writeFileSync(path.join(run, "yarn.lock"), "");
  command(["install"]);
} else if (manager === "pnpm") {
  fs.writeFileSync(path.join(run, ".npmrc"), "node-linker=isolated\n");
  fs.writeFileSync(
    path.join(run, "pnpm-workspace.yaml"),
    "packages:\n  - '.'\nnodeLinker: isolated\n"
  );
  command(["install", "--ignore-scripts", "--no-frozen-lockfile"]);
} else {
  command(["install", "--ignore-scripts", "--no-audit", "--no-fund"]);
}

const targets = inspectBin("root", path.join(run, "node_modules", ".bin", "tsc"), true);
const winner = tscOwner(targets);
const nestedNotes = [];
for (const name of Object.keys(dependencies)) {
  const packageDirectory = path.join(run, "node_modules", name);
  const installed = JSON.parse(
    fs.readFileSync(path.join(packageDirectory, "package.json"), "utf8")
  );
  console.log(`installed: ${installed.name}@${installed.version}`);
  if (name === "lugga") {
    const transitivePath = require.resolve("tsc/package.json", {
      paths: [fs.realpathSync(packageDirectory)],
    });
    const transitive = JSON.parse(fs.readFileSync(transitivePath, "utf8"));
    console.log(`lugga dependency: ${transitive.name}@${transitive.version} (${transitivePath})`);
  }
  const nestedTargets = inspectBin(
    name,
    path.join(run, "node_modules", name, "node_modules", ".bin", "tsc")
  );
  if (name === "lugga") {
    nestedNotes.push(nestedTargets
      ? `Lugga's nested .bin/tsc links to ${tscOwner(nestedTargets)}.`
      : "Lugga has no nested .bin/tsc entry.");
  }
}

const note = [`Root .bin/tsc links to ${winner} (${manager}@${version}).`, ...nestedNotes].join(" ");
for (const directory of [fixture, run]) {
  const packagePath = path.join(directory, "package.json");
  const current = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  current.note = note;
  fs.writeFileSync(packagePath, JSON.stringify(current, null, 2) + "\n");
}
console.log(note);
