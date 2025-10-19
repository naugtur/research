const { recursiveScan } = require("../_tools/npmscanner");
const seed = require("../popular-pkgs/names-per-dependents_count.json");

recursiveScan({
  name: "gits",
  seed,
  dataCallback: (pkg) => {
    const vdeps = [].concat([], Object.values(pkg.dependencies || []))
    const vdevdeps = [].concat([], Object.values(pkg.devDependencies || []))
    const result = vdeps.filter(a => (a).match(/^git.*:/))
    const devresult = vdevdeps.filter(a => (a).match(/^git.*:/))
    if (result.length > 0 || devresult.length > 0) {
      return { name: pkg.name, gitdeps: result, gitdevdeps: devresult };
    }
  },
  parallel: 10
});
