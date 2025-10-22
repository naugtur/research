const fs = require("fs");
const minutes = (ms) => (ms / 1000 / 60).toFixed(2) + " minutes";
const printStatus = (s) => {
  process.stdout.clearLine(); // clear current text
  process.stdout.cursorTo(0); // move cursor to beginning of line
  process.stdout.write(s);
};

// const vm = require("vm");
const range = { start: 0, end: 256 * 256 };
range.total = range.end - range.start;
let results = [];

function saveProgress(index) {
  fs.writeFileSync(
    "results.json",
    JSON.stringify(
      {
        results,
        current: index,
      },
      null,
      2
    )
  );
}
function loadProgress() {
  try {
    const data = fs.readFileSync("results.json", "utf8");
    const { results: r, current } = JSON.parse(data);
    results = r;
    range.start = current;
  } catch (err) {
    console.warn(err.message);
  }
}

for (let index = range.start; index <= range.end; index++) {
  try {
    eval(`${String.fromCharCode(index)}--> ;; `);
    results.push([index, String.fromCharCode(index)]);
  } catch (err) {}
}

loadProgress();

const t0 = performance.now();
for (let index1 = range.start; index1 <= range.end; index1++) {
  printStatus(
    `${index1}\t/ ${range.end} results: ${results.length} ETA: ${minutes(
      ((performance.now() - t0) / (index1 - range.start)) * (range.end - index1)
    )}`
  );
  for (let index2 = range.start; index2 <= range.end; index2++) {
    const subject = `${String.fromCharCode(index1)}${String.fromCharCode(
      index2
    )}-->`;
    try {
      eval(`${subject} ;; `);
      results.push([index1, index2, subject]);
    } catch (err) {}
  }
  if (index1 % 10 === 0) {
    saveProgress(index1);
  }
}

console.log("\n\nresults", results.length, results);
