const recursiveScan = require("./npmscanner");
const seed = require("../popular-pkgs/names-per-dependents_count.json");

recursiveScan({
  name: "cache",
  seed,
  dataCallback: (pkg) => {
    return pkg
  },
  parallel: 10
});
