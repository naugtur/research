# Bundled Dependencies with Install/Build Scripts

Generated: 2026-02-09T20:48:48.935Z

Total parent packages analyzed: 74

## Summary

- Parent packages with bundled deps containing scripts: 8
- Bundled deps with install scripts: 16
- Bundled deps with binding.gyp: 8

---

## @-xun

### core-js

**Install Scripts:**

- `postinstall`: `node -e "try{require('./postinstall')}catch(e){}"`

## ganache

### @trufflesuite/bigint-buffer

**Install Scripts:**

- `install`: `node-gyp-build || echo "Couldn't build bindings. Non-native version used."`

**Native Module:** Contains `binding.gyp`

### keccak

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

### leveldown

**Install Scripts:**

- `install`: `node-gyp-build`

**Native Module:** Contains `binding.gyp`

### napi-macros-example

**Install Scripts:**

- `install`: `node-gyp-build`

**Native Module:** Contains `binding.gyp`

### secp256k1

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

## ganache-cli

### keccak

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

### secp256k1

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

## ganache-core

### keccak

**Install Scripts:**

- `install`: `node-gyp-build || exit 0`

**Native Module:** Contains `binding.gyp`

## npm-pack-all

### monorepo-symlink-test

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

## osrm

### addon

**Install Scripts:**

- `install`: `ncmake rebuild`

## projen

### ljharb-monorepo-symlink-test

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

## ut-tools

### ljharb-monorepo-symlink-test

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

### monorepo-symlink-test

**Install Scripts:**

- `postinstall`: `lerna bootstrap`

