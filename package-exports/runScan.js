const recursiveScan = require("../_tools/npmscanner");
const seed = require("../popular-pkgs/names-per-dependents_count.json");

recursiveScan({
  name: "exports",
  seed,
  dataCallback: (pkg) => {
    if (pkg.exports && typeof pkg.exports !== "string") {
      return { name: pkg.name, exports: pkg.exports, type: pkg.type };
    }
  },
  parallel: 10
});
