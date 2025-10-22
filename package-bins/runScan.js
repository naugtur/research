const { recursiveScan } = require("../_tools/npmscanner");
const seed = require("../popular-pkgs/names-per-dependents_count.json");

recursiveScan({
  name: "bins1",
  seed,
  dataCallback: (pkg) => {
    if (pkg.bin && typeof pkg.bin === "object") {
      return { name: pkg.name, bins: Object.keys(pkg.bin) };
    }
  },
  parallel: 10
});
