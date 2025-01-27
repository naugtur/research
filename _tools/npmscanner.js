const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

function load(jsonfile, fallback) {
  try {
    return JSON.parse(fs.readFileSync(jsonfile));
  } catch (e) {
    console.error(e.message);
    return fallback;
  }
}
const getPackageJsonMaker = (cacheOn) => {
  if (cacheOn) {
    let cacheArray = require("../_cache/cache-data.json");
    const cache = cacheArray.reduce((caches, pkg) => {
      caches.add(pkg.name, pkg);
      return caches;
    }, new Map());
    cacheArray = null;
    return cache.get.bind(cache);
  } else {
    return (i) =>
      fetch(`https://registry.npmjs.org/${i}/latest`).then((r) => {
        if (r.status === 429) {
          console.error("\n\n ==Rate limited==");
          process.exit(1);
        }
        if (r.status >= 400) {
          const err = Error(`HTTP${r.status}`);
          err.status = r.status;
          throw err;
        }
        return r.json();
      });
  }
};

async function promptUser(text) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise((resolve) => {
    rl.question(text, resolve);
  });
  rl.close();
  return answer.toLowerCase() === "y";
}

module.exports = async function recursiveScan({
  seed,
  name,
  dataCallback,
  parallel = 3,
  cache = false,
  forceSeed = true,
}) {
  if (fs.existsSync(path.join(__dirname, "../_cache/cache-data.json"))) {
    const answer = await promptUser(
      "Do you want to use the cache from ../_cache/cache-data.json? (y/n)"
    );
    if (answer) {
      cache = true;
    }
  }

  const getPackageJson = getPackageJsonMaker(cache);
  const state = load(`./${name}-progress.json`, {
    currentPass: seed,
    visited: [],
  });
  let nextPass = new Set(state.currentPass); //recover from a crash
  if (forceSeed) {
    seed.forEach((pkg) => nextPass.add(pkg));
  }
  let currentPass;
  const errors = state.errors || [];
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
        errors,
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
                  return getPackageJson(i).then(cb, (err) => {
                    errors.push({ name: i, error: err.message });
                    process.stdout.write(`X${err.status || ""}`);
                  });
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

  return {
    matches,
    visited,
    errors,
  };
};
