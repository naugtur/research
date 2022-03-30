const data = require("./data.json");

const search = process.argv[2];
if (!search) {
  console.log(`usage: node lookup packagenames`);
  process.exit(1);
}
const lookup = search.split(",").map(a=>a.trim());
function print({ name, exports }) {
  console.log(name, "------------");
  console.log(exports);
}
data.filter(({ name }) => lookup.includes(name)).map(print);
