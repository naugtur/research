// @ts-check
const { spawnSync } = require("child_process");
const { realpathSync } = require("fs");
const data = require("./bins1-data.json");

const index = {};
data.forEach((entry) =>
  entry.bins.map((bin) => {
    index[bin] || (index[bin] = []);
    index[bin].push(entry.name);
  })
);

const sortIndex = (index, filter) =>
  Object.fromEntries(
    Object.entries(index)
      .filter(filter)
      .sort((a, b) => b[1].length - a[1].length)
  );

const sortedIndex = sortIndex(index, (a) => a[1].length > 1);

require("fs").writeFileSync(
  "collisions.json",
  JSON.stringify(sortedIndex, null, 2)
);

const PATH = process.env.PATH.split(":")
  .filter((p) => !p.includes("npm") && !p.includes("node_modules"))
  .join(":");
const osCollisions = sortIndex(index, (a) => {
  const which = spawnSync("which", [a[0]], { env: { PATH } });
  if (which.status === 0) {
    const path = which.stdout.toString().trim();
    let resolvedPath;
    resolvedPath = realpathSync(path);

    if (resolvedPath.includes("npm") || resolvedPath.includes("node_modules") || resolvedPath.includes("nodejs")) {
      return false;
    }

    console.log(
      a[0],
      which.status,
      which.stdout.toString().trim(),
      resolvedPath
    );
    a[1].unshift(
      `(system: ${which.stdout.toString().trim()})`
    );
    return true;
  }
  return false;
});

require("fs").writeFileSync(
  "os-collisions.json",
  JSON.stringify(osCollisions, null, 2)
);
