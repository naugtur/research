const fs = require("fs");
const path = require("path");

const results = require("./npm_packages_results.json");

const cutoff = process.argv[2] ? parseInt(process.argv[2], 10) : 50000;

const sortedDL = Object.values(results).sort(
  (a, b) => b.dl.monthly - a.dl.monthly
);
const sorted = Object.values(results).sort((a, b) => b.dp - a.dp);

sortedDL.splice(cutoff);
sorted.splice(cutoff);

const thead =
  "| Package | Dependents | Monthly Downloads | Weekly Downloads |\n| --- | --- | --- | --- |\n";
fs.writeFileSync(
  path.join(__dirname, "per-monthly_dl.md"),
  thead +
    sortedDL
      .map((p) => `| ${p.name} | ${p.dp} | ${p.dl.monthly} | ${p.dl.weekly} |`)
      .join("\n")
);
fs.writeFileSync(
  path.join(__dirname, "per-dependents_count.md"),
  thead +
    sorted
      .map((p) => `| ${p.name} | ${p.dp} | ${p.dl.monthly} | ${p.dl.weekly} |`)
      .join("\n")
);

fs.writeFileSync(
  path.join(__dirname, "names-per-monthly_dl.json"),
  JSON.stringify(sortedDL.map((p) => p.name))
);
fs.writeFileSync(
  path.join(__dirname, "names-per-dependents_count.json"),
  JSON.stringify(sorted.map((p) => p.name))
);
