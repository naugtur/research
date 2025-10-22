// @ts-check
const fs = require("fs");
const { recursiveScan } = require("../_tools/npmscanner");
const seed = require("../popular-pkgs/names-per-dependents_count.json");

recursiveScan({
  name: "bundleds",
  seed,
  dataCallback: (pkg) => {
    if (pkg.bundleDependencies) {
      return { name: pkg.name, bundleDependencies: pkg.bundleDependencies };
    }
  },
  parallel: 10,
}).then(() => {
  const data = require("./bundleds-data.json");
  return getBundledDepsWithPopularity(data).then((deps) => {
    fs.writeFileSync("bundleds-data-indexed.json", JSON.stringify(deps));
  });
});

async function getBundledDepsWithPopularity(data) {
  const deps = data.reduce((acc, { bundleDependencies, name }) => {
    if (bundleDependencies) {
      bundleDependencies.forEach((dep) => {
        if (!acc[dep]) {
          acc[dep] = {
            count: 0,
            parents: [],
            name: dep,
            existsInNpm: "unchecked",
          };
        }

        acc[dep].count += 1;
        acc[dep].parents.push(name);
      });
    }
    return acc;
  }, {});

  for (const dep in deps) {
    try {
      const response = await fetch(`https://registry.npmjs.org/${dep}/latest`);
      process.stdout.write(".");
      if (response.ok) {
        deps[dep].existsInNpm = true;
      } else {
        console.error(`Failed to find ${dep} ${response.status}`);
        deps[dep].existsInNpm = false;
      }
    } catch (error) {
      console.error(`Failed to fetch ${dep} }`, error);
    }
  }

  return Object.values(deps).sort((a, b) => b.count - a.count);
}
