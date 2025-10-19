# package exports

> I noticed I don't understand what the exports field in package.json does. Reading docs helped. Until I wanted to read exports from an actual package, which didn't match the data shapes described by the docs. Oh well...

So I'm collecting explicitly defined exports form top 10000 npm packages and their dependencies and figuring out their shapes.

Top 10000 packages are coming from `../popular-pkgs`

## result

### [export-shapes.md](./export-shapes.md)

A list of shapes exports can have, along with hints on their popularity.

- expand to see package names
- all custom names (in paths - starting with a dot) were replaced with `a`, so:
  - `./main.js` becomes `./a.a`
  - `./lib/*` becomes `./a/*`
  - exception: `./package.json` doesn't change
- all values are represented by their types (well, just `"string"` tbh)

`exports-data.json` contains raw data of the ~1000 exports collected  
`export-shapes.md` is created by running `node exportshapes.cjs`

To explore the raw data use `node lookup packagename`

You can copy the pakcage list from an expanded block in export-shapes and feed it to lookup to get multiple results

```
node lookup "side-channel,call-bind,es-value-fixtures,is-core-module,get-intrinsic,which-collection"
```

## Usage

```
node runScan.js
```

- Look up package

```
node lookup "packagename"
```

- To regenerate the export-shapes.md:

```
node exportshapes.cjs
```

# Import behavior

I quickly noticed I have no idea what will be loaded out of the exports listed.

So I mocked up some examples and ran tests.

Here's a list of example package.json exports definitions with results of importing them.

### [summary.md](./behavior/summary.md)

- To regenerate the summary.md in behavior:

```
cd behavior
node test.mjs
```
