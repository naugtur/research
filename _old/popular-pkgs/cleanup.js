const fs = require("fs");
const perRank = require("./per-rank.json");
const perDeps = require("./per-dependents_count.json");

fs.writeFileSync(`per-dependents_count.json`, JSON.stringify(perDeps.map(p => {
    p.versions = undefined;
    return p;
})))

fs.writeFileSync(`per-rank.json`, JSON.stringify(perRank.map(p => {
    p.versions = undefined;
    return p;
})))