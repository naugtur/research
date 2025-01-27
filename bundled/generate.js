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

print(data).then((md) => {
  const text = `# Bundled Dependencies of top 10k npm packages and their dependencies

> generated on ${new Date().toISOString()}
  
${md}`;

  fs.writeFileSync("bundleds.md", text);
});
