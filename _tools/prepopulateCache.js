const { recursiveScan } = require("./npmscanner");
const seed = require("../popular-pkgs/names-per-dependents_count.json");
const path = require("path");

console.log(`Seeding with ${seed.length} packages.`);

return recursiveScan({
  targetPath: path.join(__dirname, "../_cache"),
  name: "cache",
  seed,
  dataCallback: (pkg) => {
    return pkg;
  },
  parallel: 10,
});
