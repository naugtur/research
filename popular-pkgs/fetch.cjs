const { fetch } = require("undici");
require("dotenv").config();
const fs = require("fs");

const key = process.env.TOKEN;

if (!key) {
  console.error("no TOKEN in env", process.env);
  process.exit(1);
}
async function crawl(per) {
  let collection = [];

  function collect(data) {
    data.map((d) => (d.versions = undefined));
    collection = collection.concat(data);
  }

  for (let i = 1; i <= 100; i++) {
    await fetch(
      `https://libraries.io/api/search?per_page=100&page=${i}&order=desc&platforms=npm&sort=${per}&api_key=${key}`
    )
      .then((r) => r.json())
      .then(collect);
    process.stdout.write(i % 10 ? "." : `.${i}\n`);
  }

  fs.writeFileSync(`per-${per}.json`, JSON.stringify(collection));
}

// crawl("rank");
crawl("dependents_count");
