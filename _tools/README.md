# tools that download the data for scans

`_cache` folder is used to avoid downloading a lot of stuff many times over. 

- `npmscanner` - the main tool in the repo, used in runScan in experiments

- `pkgfetch` - tiny tool to fetch package.json files from npm registry

- `prepopulateCache` - run it in the `_cache` folder to fill the cache without running an actual scan