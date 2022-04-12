const fs = require("fs");
const perRank = require("./per-rank.json");
const perDeps = require("./per-dependents_count.json");

fs.writeFileSync(`names-per-dependents_count.txt`, perDeps.map(p => p.name).join('\n'))

fs.writeFileSync(`names-per-rank.txt`, perRank.map(p => p.name).join('\n'))