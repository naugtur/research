const fs = require("fs");
const data = require("./data.json");

const results = {};
// random sample
// const sample = Array(10)
//   .fill()
//   .map(() => data[~~(Math.random() * data.length)]);
//full content
sample = data;

sample.forEach(({ name, exports }) => {
  const sig = signature(exports);
  if (!results[sig]) {
    results[sig] = [];
  }
  results[sig].push(name);
});

function print(res) {
  return Object.entries(res).sort((a,b)=> b[1].length - a[1].length).map(
    ([shape, list]) => `

<details>
<summary>${list.length} packages (expand)</summary>

> ${list.join()}

</details>

\`\`\`js
${shape}
\`\`\`

----

    `
  ).join('');
}

fs.writeFileSync("export-shapes.md", print(results));

function signature(obj) {
  return JSON.stringify(obj, (key, v) => {
    const isRoot = !key;
    if (v && v.constructor === Array) {
      return v.sort();
    }
    if (v && typeof v === "object") {
      return uniqueTypesObj(v, isRoot);
    }
    return typeof v;
  }, 2);
}
function uniqueTypesObj(obj, isRoot) {
  const mem = new Set();
  const uniq = (item) => {
    let key = typeof item;
    if (item && key === "object") {
      key += Object.keys(item).sort().join("+");
      if (!mem.has(key)) {
        mem.add(key);
        return true;
      }
    } else {
      return true;
    }
  };
  const anonkey = (key) => {
    if (key === "./package.json") {
      return key;
    }
    if (key.substr(0, 1) === ".") {
      return key.replace(/[0-9a-z-_]+/gi, "a");
    }
    return key;
  };
  let entries = Object.entries(obj).filter(([k, v]) => uniq(v));
  if (isRoot) {
    entries = entries.map(([k, v]) => [anonkey(k), v]);
  }
  return Object.fromEntries(entries.sort());
}
