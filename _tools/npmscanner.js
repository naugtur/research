const { fetch } = require("undici");
const fs = require("fs");

function load(jsonfile, fallback) {
  try {
    return JSON.parse(fs.readFileSync(jsonfile));
  } catch (e) {
    console.error(e.message);
    return fallback;
  }
}
module.exports = async function recursiveScan({
  seed,
  name,
  dataCallback,
  parallel = 3,
}) {
  const state = load(`./${name}-progress.json`, {
    currentPass: seed,
    visited: [],
  });
  let nextPass = new Set(state.currentPass); //recover from a crash
  let currentPass;
  const visited = new Set(state.visited);
  const matches = load(`./${name}-data.json`, []);
  let prevMatches = matches.length;
  console.log(
    `Starting. matches: ${matches.length} visited: ${visited.size} nextPass: ${nextPass.size}`
  );

  function save() {
    if (prevMatches < matches.length) {
      prevMatches = matches.length;
      process.stdout.write("" + matches.length);
      fs.writeFileSync(
        `./${name}-data.json`,
        JSON.stringify(Array.from(matches))
      );
    }
    fs.writeFileSync(
      `./${name}-progress.json`,
      JSON.stringify({
        currentPass: Array.from(currentPass),
        visited: Array.from(visited),
      })
    );
  }

  async function scan(items, cb) {
    const groupedItems = items.reduce(
      (grouped, item) => {
        if (grouped[grouped.length - 1].length >= parallel) {
          grouped.push([]);
        }
        grouped[grouped.length - 1].push(item);
        return grouped;
      },
      [[]]
    );
    return groupedItems
      .reduce(
        (queue, group) =>
          queue.then(() => {
            return Promise.allSettled(
              group.map((i) => {
                if (!visited.has(i)) {
                  return fetch(`https://registry.npmjs.org/${i}/latest`)
                    .then((re) => re.json())
                    .then(cb);
                } else {
                  process.stdout.write("-");
                }
              })
            );
          }),
        Promise.resolve()
      )
      .then(() => {
        save();
      }, console.error);
  }

  while (nextPass.size > 0) {
    currentPass = Array.from(nextPass);
    nextPass = new Set();

    await scan(currentPass, (pkg) => {
      Object.keys(pkg.dependencies || {}).forEach((a) => nextPass.add(a));
      Object.keys(pkg.devDependencies || {}).forEach((a) => nextPass.add(a));
      visited.add(pkg.name);
      const match = dataCallback(pkg);
      if (match) {
        matches.push(match);
        process.stdout.write("+");
        save();
      } else {
        process.stdout.write("=");
      }
    });
    console.log(">");
  }

  console.log(
    `Finished. matches: ${matches.length} visited: ${visited.size} nextPass: ${nextPass.size}`
  );
};
