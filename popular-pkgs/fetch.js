//@ts-check

const fs = require("fs").promises;
const path = require("path");

const RESULTS_FILE = "npm_packages_results.json";
const SEARCH_CACHE_DIR = "search-cache";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
const LIMIT = 250; // can't do more than 250 at a time

async function searchNpmPackages(text, pages = 1) {
  let allResults = [];
  for (let page = 0; page < pages; page++) {
    const results = await npmSearch(text, page);
    allResults = allResults.concat(results);
    if (results.length < LIMIT) {
      break;
    }
  }
  return allResults;
}

/**
 *
 * @param {string} text
 * @param {number} page - which page to grab
 * @returns {Promise<Array>} - returns an array of npm packages
 */
async function npmSearch(text, page = 0) {
  const from = page * LIMIT;
  const cacheFile = path.join(SEARCH_CACHE_DIR, `${text}_${page}.json`);

  process.stdout.write(`.`);
  try {
    const cachedData = await fs.readFile(cacheFile, "utf8");
    return JSON.parse(cachedData);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Error reading cache for "${text}":`, error);
    }
  }

  await nextSecondThrottle();

  const url = `https://registry.npmjs.org/-/v1/search?text=${text}&from=${from}&size=${LIMIT}&popularity=1.0&quality=0.0&maintenance=0.0`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        console.error(" Rate LIMITed! Waiting for 1 minute");
        await sleep(ONE_MINUTE);
        return npmSearch(text, page);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    await fs.mkdir(SEARCH_CACHE_DIR, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(data.objects));
    return data.objects;
  } catch (error) {
    console.error(` Error fetching data for "${text}":`, error);
    return [];
  }
}

async function loadExistingResults() {
  try {
    const data = await fs.readFile(RESULTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

async function saveResults(packages) {
  await fs.writeFile(RESULTS_FILE, JSON.stringify(packages, null, 2));
}

const FILLED_RECTANGLE = "█";
function displayProgress(progress) {
  const progressPercent = Math.round(progress * 100);
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  const bits = Math.floor(progressPercent / 2)
  process.stdout.write(
    `${progressPercent}% [${FILLED_RECTANGLE.repeat(bits)}${" ".repeat(50 - bits)}]`
  );
}

const validChars = "abcdefghijklmnopqrstuvwxyz0123456789-_".split("");
const total = validChars.length * validChars.length;
// generator function creating all two-character combinations from the validChars set
function* genPairs() {
  for (let i = 0; i < validChars.length; i++) {
    for (let j = 0; j < validChars.length; j++) {
      const progress = (i * validChars.length + j + 1) / total;
      displayProgress(progress);
      yield validChars[i] + validChars[j];
    }
  }
}

async function getAllTopPackages(pagesDeep = 1) {
  let packages = await loadExistingResults();

  for (const searchText of genPairs()) {
    process.stdout.write(`  searching: ${searchText}`);
    const newPackages = await searchNpmPackages(searchText, pagesDeep);
    newPackages.forEach((pkg) => {
      const name = pkg.package.name;
      if (!packages[name]) {
        packages[name] = {
          name,
          dl: pkg.downloads,
          dp: pkg.dependents,
        };
      }
    });
    await saveResults(packages);
  }

  return packages;
}

const depth = process.argv[2] ? parseInt(process.argv[2], 10) : 1;

getAllTopPackages(depth)
  .then((packages) => {
    const sorted = Object.values(packages).sort(
      (a, b) => b.dl.monthly - a.dl.monthly
    );

    console.log("got:", sorted.length);
    console.log("top:", sorted[0]);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
