const { fetch } = require("undici");
const util = require("util");
module.exports = async (name) =>
  await fetch(`https://registry.npmjs.org/${name}/latest`).then((re) =>
    re.json()
  );
const arg = process.argv[2];
if (arg) {
  module.exports(arg).then(
    (pkg) =>
      console.log(
        util.inspect(pkg, {
          showHidden: false,
          depth: Infinity,
          colors: true,
        })
      ),
    console.error
  );
}
