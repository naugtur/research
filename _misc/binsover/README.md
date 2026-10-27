we're seeing collisions between package across packages, like this tsc 
```
{
    "name": "typescript",
    "weekly": 96515834
},
{
    "name": "tsc",
    "weekly": 310870
},
{
    "name": "@redwoodjs/web",
    "weekly": 132421
},
```
If this was a collision that someone is trying to exploit, what are the conditions where the less popular package overrides a more popular package with its bin?

Let's test that across package managers and different configurations of dependency tree shapes.

1. two packages with colliding bins: "typescript" and "tsc"
 - multiplied by the two variants of ordering - maybe sort order matters. try different ways to affect sort order
2. one of the packages is a direct dependency and another is a transitive dependency
 - could sort order affect that at all?

Each combination needs a fixture folder where the `test` script runs install and prints where the .bin entry is pointing to.

## Fixtures

[fixtures](./fixtures) contains 12 cases: four dependency arrangements for each
of npm, pnpm (isolated node linker), and Yarn Modern (node-modules linker).
All dependencies come from the registry: `typescript@5.7.3`, `tsc@2.0.4`,
and `lugga@1.0.0` (which depends on `tsc@^2.0.4`).

Each manager has:

- `typescript` and `tsc`, declared in either order.
- Direct `typescript` and `lugga`, declared in either order, with `tsc`
  installed transitively through Lugga.

Each pair has one alphabetical and one reversed declaration order, so we can
compare package-name ordering against manifest ordering without testing every
pair of colliding packages. No local wrappers, file dependencies, or aliases.
These cases test fresh installs, not upgrades.

## Running

Use a current Node.js and Corepack-backed package-manager launchers, with
registry access. Fixtures pin the latest stable versions checked on
2026-10-22: npm 12.2.1, pnpm 12.15.0, and Yarn 4.18.1.
Each fixture and fresh run directory has an explicit `packageManager` field
so Corepack stops there instead of selecting the parent repository's config.
These versions stay pinned until the fixture manifests are updated.

From this directory, run all fixture test scripts sequentially:

```sh
node run-all.cjs
```

Or run one fixture:

```sh
cd fixtures/npm-direct-typescript-first
node --run test
```

[run-all.cjs](./run-all.cjs) invokes each fixture's test script using Node,
continues after failures, and exits nonzero if any fixture failed.

[test.cjs](./test.cjs) installs without lifecycle scripts in a fresh
fixture-local `.runs` directory. It prints manager/package versions and root
and nested `.bin/tsc` links or shim contents, without executing `tsc`.
Missing root bins and failed installs fail the fixture.
After a successful test, both the fixture and run manifests get a `note` field
identifying the package linked as the root `tsc`, including package and manager
versions. An unrecognized or ambiguous bin target fails rather than recording
a guessed result.
Lugga fixtures also report its resolved transitive `tsc` package and record
the nested `.bin/tsc` winner (or its absence) in the note. Root winner detection
uses the actual target's owning package, including transitive packages.
Run directories and lockfiles are retained for inspection and ignored by Git.

## Recorded results

Notes copied from the fixture manifests. 

| Fixture | Note |
| --- | --- |
| [npm-direct-tsc-first](./fixtures/npm-direct-tsc-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (npm@12.2.0). |
| [npm-direct-typescript-first](./fixtures/npm-direct-typescript-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (npm@12.2.0). |
| [npm-transitive-lugga-first](./fixtures/npm-transitive-lugga-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (npm@12.2.0). Lugga has no nested .bin/tsc entry. |
| [npm-transitive-typescript-first](./fixtures/npm-transitive-typescript-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (npm@12.2.0). Lugga has no nested .bin/tsc entry. |
| [pnpm-direct-tsc-first](./fixtures/pnpm-direct-tsc-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (pnpm@12.15.0). |
| [pnpm-direct-typescript-first](./fixtures/pnpm-direct-typescript-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (pnpm@12.15.0). |
| [pnpm-transitive-lugga-first](./fixtures/pnpm-transitive-lugga-first/package.json) | Root .bin/tsc links to typescript@5.7.3 (pnpm@12.15.0). Lugga's nested .bin/tsc links to tsc@2.0.4. |
| [pnpm-transitive-typescript-first](./fixtures/pnpm-transitive-typescript-first/package.json) | Root .bin/tsc links to typescript@5.7.3 (pnpm@12.15.0). Lugga's nested .bin/tsc links to tsc@2.0.4. |
| [yarn-direct-tsc-first](./fixtures/yarn-direct-tsc-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (yarn@4.18.1). |
| [yarn-direct-typescript-first](./fixtures/yarn-direct-typescript-first/package.json) | Root .bin/tsc links to tsc@2.0.4 (yarn@4.18.1). |
| [yarn-transitive-lugga-first](./fixtures/yarn-transitive-lugga-first/package.json) | Root .bin/tsc links to typescript@5.7.3 (yarn@4.18.1). Lugga has no nested .bin/tsc entry. |
| [yarn-transitive-typescript-first](./fixtures/yarn-transitive-typescript-first/package.json) | Root .bin/tsc links to typescript@5.7.3 (yarn@4.18.1). Lugga has no nested .bin/tsc entry. |

### Observed bin-link selection

- **npm 12.2.0:** `tsc` wins over `typescript` at the root, even when `tsc`
  is only a transitive dependency through Lugga. A direct dependency does not
  get priority in these cases.
- **pnpm 12.15.0 (isolated linker):** When both are direct dependencies,
  `tsc` wins at the root. When `tsc` is transitive through Lugga, the root
  links to the direct `typescript`; Lugga gets a separate nested link to `tsc`.
- **Yarn 4.18.1 (node-modules linker):** When both are direct dependencies,
  `tsc` wins at the root. When `tsc` is transitive through Lugga, the direct
  `typescript` wins at the root. No nested `.bin/tsc` entry was found inside Lugga.

Reversing dependency declaration order did not change any result. The
direct-pair results are consistent with alphabetically earlier `tsc` winning
over `typescript`, but this single pair does not establish a general
alphabetical tie-breaking rule. These are observed outcomes for the tested
versions and layouts, not guarantees for other collisions or configurations.