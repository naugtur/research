const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const fixtures = path.join(__dirname, "fixtures");
const failures = [];
const folders = fs.readdirSync(fixtures, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => fs.existsSync(path.join(fixtures, entry.name, "package.json")))
  .map((entry) => entry.name)
  .sort();

if (folders.length === 0) throw new Error("No fixture folders found");

for (const folder of folders) {
  console.log(`\n========== ${folder} ==========`);
  const result = spawnSync(process.execPath, ["--run", "test"], {
    cwd: path.join(fixtures, folder),
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`${folder}: ${result.error.message}`);
    failures.push(folder);
  } else if (result.status !== 0) {
    console.error(`${folder}: status ${result.status}, signal ${result.signal}`);
    failures.push(folder);
  }
}

console.log(`\n${folders.length - failures.length}/${folders.length} fixtures completed`);
if (failures.length) {
  console.error(`Failed fixtures:\n${failures.join("\n")}`);
  process.exitCode = 1;
}
