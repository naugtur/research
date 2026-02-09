# Bundled Dependencies with Install/Build Scripts

Generated: 2026-02-09T22:38:37.167Z

Total parent packages analyzed: 74

## Summary

- Parent packages with bundled deps containing scripts: 8
- Bundled deps with install scripts: 16
- Bundled deps with binding.gyp: 8

---

## @-xun

### core-js

 path: @-xun/symbiote/node_modules/core-js

**Install Scripts:**

- `postinstall`: `node -e "try{require('./postinstall')}catch(e){}"`

**NPM:** [packument](https://registry.npmjs.org/core-js/latest) - Has install scripts on npm too

## ganache

### @trufflesuite/bigint-buffer

 path: ganache/node_modules/@trufflesuite/bigint-buffer

**Install Scripts:**

- `install`: `node-gyp-build || echo "Couldn't build bindings. Non-native version used."`

**Native Module:** Contains `binding.gyp`

**NPM:** [packument](https://registry.npmjs.org/@trufflesuite/bigint-buffer/latest) - Has install scripts on npm too

### keccak

 path: ganache/node_modules/keccak

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

**NPM:** [packument](https://registry.npmjs.org/keccak/latest) - Has install scripts on npm too

### leveldown

 path: ganache/node_modules/leveldown

**Install Scripts:**

- `install`: `node-gyp-build`

**Native Module:** Contains `binding.gyp`

**NPM:** [packument](https://registry.npmjs.org/leveldown/latest) - Has install scripts on npm too

### napi-macros-example

 path: ganache/node_modules/napi-macros/example

**Install Scripts:**

- `install`: `node-gyp-build`

**Native Module:** Contains `binding.gyp`

**NPM:** Package not found on npm

### secp256k1

 path: ganache/node_modules/secp256k1

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

**NPM:** [packument](https://registry.npmjs.org/secp256k1/latest) - Has install scripts on npm too

## ganache-cli

### keccak

 path: ganache-cli/node_modules/keccak

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

**NPM:** [packument](https://registry.npmjs.org/keccak/latest) - Has install scripts on npm too

### secp256k1

 path: ganache-cli/node_modules/secp256k1

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

**NPM:** [packument](https://registry.npmjs.org/secp256k1/latest) - Has install scripts on npm too

## ganache-core

### keccak

 path: ganache-core/node_modules/keccak

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

**NPM:** [packument](https://registry.npmjs.org/keccak/latest) - Has install scripts on npm too

## npm-pack-all

### monorepo-symlink-test

 path: npm-pack-all/node_modules/resolve/test/resolver/multirepo

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

**NPM:** [packument](https://registry.npmjs.org/monorepo-symlink-test/latest) - ⚠️ No install scripts on npm

## osrm

### addon

 path: osrm/node_modules/node-cmake/example/node_modules/node-cmake/example

**Install Scripts:**

- `install`: `ncmake rebuild`

**NPM:** [packument](https://registry.npmjs.org/addon/latest) - ⚠️ No install scripts on npm

## projen

### ljharb-monorepo-symlink-test

 path: projen/node_modules/resolve/test/resolver/multirepo

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

**NPM:** [packument](https://registry.npmjs.org/ljharb-monorepo-symlink-test/latest) - ⚠️ No install scripts on npm

## ut-tools

### ljharb-monorepo-symlink-test

 path: ut-tools/node_modules/eslint-import-resolver-node/node_modules/resolve/test/resolver/multirepo

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

**NPM:** [packument](https://registry.npmjs.org/ljharb-monorepo-symlink-test/latest) - ⚠️ No install scripts on npm

### monorepo-symlink-test

 path: ut-tools/node_modules/resolve/test/resolver/multirepo

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

**NPM:** [packument](https://registry.npmjs.org/monorepo-symlink-test/latest) - ⚠️ No install scripts on npm

