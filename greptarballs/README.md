# scan tarballs for matching code

Requires `ugrep` (Linux).

Put grep patterns in a text file (one basic regular expression per line), then run:

```sh
node greptarballs/runScan.js 100 /path/to/patterns.txt
```

Scans the latest versions of the first N packages from
`popular-pkgs/names-per-dependents_count.json`, sequentially. Runs
`ugrep -zn -f` directly on each cached tarball, without extracting members.

- `_cache/`: cached tarballs, reused even if the registry's latest version changes.
- `greptarballs-progress.json`: current pass, visited names, and errors, managed by `../_tools/npmscanner`.
-- `greptarballs-data.json`: matching packages as `{ name, file }`, where `file` is the tarball path reported by `ugrep -zn`.

Searches the decompressed tar stream, including archive headers, not individual
member files. Member paths and matching lines are not reported.

Rerun the same command to resume. Only the selected seed is scanned, not its
dependencies. Progress belongs to one pattern; changing the pattern does not
automatically rescan visited packages. Existing progress can also include names
from earlier runs with a larger N. Run only one scanner at a time.

