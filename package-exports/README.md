# package exports

> I noticed I don't understand what the exports field in package.json does. Reading docs helped. Until I wanted to read exports from an actual package, which didn't match the data shapes described by the docs. Oh well...

So I'm collecting explicitly defined exports form top 1000 npm packages and their dependencies and figuring out their shapes.

Top 1000 as of some time in the past, 3 years or so, because that's the last time npm gave access to data allowing peopple to collect this statistic. 

- TODO: ask npm for a fresh list

> Do I feel like I understand package.json's export field better now? Well, not really. 😂

## result

### [export-shapes.md](./export-shapes.md)

A list of shapes exports can have, along with hints on their popularity.

- expand to see package names
- all custom names (in paths - starting with a dot) were replaced with `a`, so:
  -  `./main.js` becomes `./a.a`
  -  `./lib/*` becomes `./a/*`
  -  exception: `./package.json` doesn't change
- all values are represented by their types (well, just `"string"` tbh)



`data.json` contains raw data of the ~1000 exports collected  
`export-shapes.md` is created by running `node exportshapes.cjs`

To explore the raw data use `node lookup packagename`

You can copy the pakcage list from an expanded block in export-shapes and feed it to lookup to get multiple

```
node lookup "side-channel,call-bind,es-value-fixtures,is-core-module,get-intrinsic,which-collection"
```
