# package bins

- List of packages with bin scripts:bins1-data.json
- List of collisions for bin names: collisions.json
- List of collisions for bin names with basic OS commands for linux: os-collisions.json

Run `node aggregate.js` from this directory to regenerate the collision files.
Package entries are `{ "name": "...", "weekly": 123 }`, with weekly downloads
from `../popular-pkgs/npm_packages_results.json`. Missing download counts are
`null`. Packages within each collision group are sorted by weekly downloads,
highest first, with unknown counts last. OS collision lists retain the leading
`(system: ...)` string.