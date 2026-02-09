// @ts-check
const fs = require("fs");

const data = require("./bundleds-data.json");
const dataIndexed = require("./bundleds-data-indexed.json");

async function print(data) {
  const header =
    "| Dependency | Count | in NPM| parents |\n|--|--| -- | -- |";
  const rows = dataIndexed
    .map(
      (i) =>
        `| ${i.name} | ${i.count} | ${i.existsInNpm} | ${i.parents.join(
          ", "
        )} |`
    )
    .join("\n");

  const depsTableHeader =
    "\n\n| Name | bundleDependencies | packument |\n|--|--|--|";
  const depsTableRows = data
    .filter(
      ({ bundleDependencies }) =>
        bundleDependencies && bundleDependencies.length > 0
    )
    .sort((a, b) => b.bundleDependencies.length - a.bundleDependencies.length)
    .map(
      ({ name, bundleDependencies }) =>
        `| ${name} | ${bundleDependencies.join(", ")} | [latest](https://registry.npmjs.org/${name}/latest)`
    )
    .join("\n");

  return `${depsTableHeader}\n${depsTableRows}\n----\n${header}\n${rows}`;
}

async function whatsbundled(data) {
  // extract names of bundled dependencies

  const bundledDeps = new Set();
  data.forEach((pk) => {
    if (pk.bundleDependencies) {
      pk.bundleDependencies.forEach((d) => bundledDeps.add(d));
    }
  });

  // check if they exist on npm and fetch packument to check for install scripts
  const packumentData = await Promise.all(
    Array.from(bundledDeps).map(async (name) => {
      try {
        const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
        if (!res.ok) {
          return { name, exists: false, scripts: '-' };
        }
        const packument = await res.json();
        
        // Check for install/postinstall/preinstall scripts
        const hasInstallScripts = packument.scripts && (
          packument.scripts.install ||
          packument.scripts.postinstall ||
          packument.scripts.preinstall
        );
        
        return { 
          name, 
          exists: true, 
          scripts: hasInstallScripts ? '!scripts!' : 'no'
        };
      } catch (error) {
        return { name, exists: false, scripts: '-' };
      }
    })
  );

  // Sort by scripts column: !scripts! first, then no, then -
  const scriptsSortOrder = { '!scripts!': 0, 'no': 1, '-': 2 };
  const sortedPackumentData = packumentData.sort((a, b) => 
    scriptsSortOrder[a.scripts] - scriptsSortOrder[b.scripts]
  );

  // print a md table with all bundled dependencies and if they exist on npm provide a link to latest packument
  const header = "| Dependency | Exists in NPM | Install Scripts |\n|--|--|--|";
  const rows = sortedPackumentData
    .map(
      ({ name, exists, scripts }) =>
        `| ${name} | ${
          exists
            ? `[latest](https://registry.npmjs.org/${name}/latest)`
            : "no"
        } | ${scripts} |`
    )
    .join("\n");

  return `${header}\n${rows}`;
}

Promise.all([
  print(data),
  whatsbundled(data)
]).then(([md, bundledMd]) => {
  const text = `# Bundled Dependencies of top 10k npm packages and their dependencies

> generated on ${new Date().toISOString()}
  
${md}

${bundledMd}`;

  fs.writeFileSync("bundleds.md", text);
});
