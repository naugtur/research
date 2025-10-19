require("dotenv").config();
const fs = require("fs");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const key = process.env.TOKEN;

if (!key) {
  console.error("no TOKEN in env", process.env);
  process.exit(1);
}

// last time I checked the API was throttling to 60 calls per minute, so this will make sure we wait whenever a fetch took less than a second.
let throttleFrom = Date.now();
async function nextSecondThrottle() {
  const throttleTo = throttleFrom + 1000;
  const now = Date.now();
  if (now < throttleTo) {
    await sleep(throttleTo - now);
  }
  throttleFrom = Date.now();
}
const ONE_MINUTE = 60 * 1000;

const fetchPagePer = (per) => {
  async function fetchPage(i) {
    return fetch(
      `https://libraries.io/api/search?per_page=100&page=${i}&order=desc&platforms=npm&sort=${per}&api_key=${key}`
    ).then(async (r) => {
      if (!r.ok) {
        console.error(`Failed to fetch ${i} ${r.status}`);
        sleep(ONE_MINUTE);
        // 1 retry should suffice
        r = await fetchPage(i);
      }
      return r;
    });
  }
  return fetchPage;
};

async function crawl(per) {
  let collection = [];

  function collect(data) {
    data.map((d) => (d.versions = undefined));
    collection = collection.concat(data);
  }

  const fetchPage = fetchPagePer(per);

  for (let i = 1; i <= 100; i++) {
    await fetchPage(i)
      .then((r) => {
        return r.json();
      })
      .then(collect);
    process.stdout.write(i % 10 ? "." : `.${i}\n`);
    await nextSecondThrottle();
  }

  fs.writeFileSync(`per-${per}.json`, JSON.stringify(collection));
}

crawl("rank");
// crawl("dependents_count");
