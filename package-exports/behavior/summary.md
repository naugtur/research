# Generated with node.js v16.14.2

[pkg0](./node_modules/pkg0)  
main field

```js
{
  "name": "pkg0",
  "main": "cjs.js"
}
```

importing pkg0 results in:  
> cjs from cjs.js  

----


[pkg1](./node_modules/pkg1)  
main and module - module is ignored

```js
{
  "name": "pkg1",
  "main": "cjs.js",
  "module": "esm.js"
}
```

importing pkg1 results in:  
> cjs from cjs.js  

----


[pkg2](./node_modules/pkg2)  
module is always ignored

```js
{
  "name": "pkg2",
  "main": "cjs.js",
  "module": "esm.js",
  "type": "module"
}
```

importing pkg2 results in:  

<details>
<summary>💥 exports is not defined in ES mod...</summary>
Error: exports is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension and '/home/naugtur/repo/research/package-exports/behavior/node_modules/pkg2/package.json' contains "type": "module". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
</details>  

----


[pkg3](./node_modules/pkg3)  
simple exports, main is ignored

```js
{
  "name": "pkg3",
  "main": "cjs.js",
  "module": "esm.js",
  "type": "module",
  "exports": {
    "import": "./e-esm.js"
  }
}
```

importing pkg3 results in:  
> esm from e-esm.js  

----


[pkg4](./node_modules/pkg4)  
exports.import is not preferred, first matching export is picked

```js
{
  "name": "pkg4",
  "main": "cjs.js",
  "module": "esm.js",
  "type": "module",
  "exports": {
    "node": "./e-cjs.js",
    "import": "./e-esm.js"
  }
}
```

importing pkg4 results in:  

<details>
<summary>💥 exports is not defined in ES mod...</summary>
Error: exports is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension and '/home/naugtur/repo/research/package-exports/behavior/node_modules/pkg4/package.json' contains "type": "module". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
</details>  

----


[pkg5](./node_modules/pkg5)  
main can be esm

```js
{
  "name": "pkg5",
  "main": "esm.js",
  "module": "e-esm.js",
  "type": "module"
}
```

importing pkg5 results in:  
> esm from esm.js  

----


[pkg6](./node_modules/pkg6)  
default gets picked when importing

```js
{
  "name": "pkg6",
  "exports": {
    "default": "./e-cjs.js",
    "import": "./e-esm.js"
  }
}
```

importing pkg6 results in:  
> cjs from e-cjs.js  

----


[pkg7](./node_modules/pkg7)  
require does not get picked when importing

```js
{
  "name": "pkg6",
  "main": "cjs.js",
  "type": "module",
  "exports": {
    "require": "./e-cjs.js",
    "import": "./e-esm.js"
  }
}
```

importing pkg7 results in:  
> esm from e-esm.js  

----


[pkg8](./node_modules/pkg8)  
require does not get picked when importing, independently of type

```js
{
  "name": "pkg6",
  "main": "cjs.js",
  "exports": {
    "require": "./e-cjs.js",
    "import": "./e-esm.mjs"
  }
}
```

importing pkg8 results in:  
> esm from e-esm.mjs  

----


[pkg9](./node_modules/pkg9)  
first option is tried anyway, even if it errors

```js
{
  "name": "pkg9",
  "exports": {
    "import": "./e-esm.js",
    "default": "./e-cjs.js"
  }
}
```

importing pkg9 results in:  

<details>
<summary>💥 Unexpected token 'export'...</summary>
Error: Unexpected token 'export'
</details>  

----


[pkg10](./node_modules/pkg10)  
extension overrides type

```js
{
  "name": "pkg10",
  "type": "commonjs",
  "exports": {
    "import": "./e-esm.mjs",
    "default": "./e-cjs.js"
  }
}
```

importing pkg10 results in:  
> esm from e-esm.mjs  

----


[pkg11](./node_modules/pkg11)  
node field doesn't have any precedence either, just order

```js
{
  "name": "pkg11",
  "exports": {
    "import": "./e-esm.mjs",
    "node": "./e-cjs.js"
  }
}
```

importing pkg11 results in:  
> esm from e-esm.mjs  

----


[pkg12](./node_modules/pkg12)  
if only order matters, array seems safer

```js
{
  "name": "pkg12",
  "exports": {
    "import": [
      "./e-cjs.js",
      "./e-esm.mjs"
    ]
  }
}
```

importing pkg12 results in:  
> cjs from e-cjs.js  

----


[pkg13](./node_modules/pkg13)  
first array item fails to parse

```js
{
  "name": "pkg13",
  "type": "module",
  "exports": {
    "import": [
      "./e-cjs.js",
      "./e-esm.mjs"
    ]
  }
}
```

importing pkg13 results in:  

<details>
<summary>💥 exports is not defined in ES mod...</summary>
Error: exports is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension and '/home/naugtur/repo/research/package-exports/behavior/node_modules/pkg13/package.json' contains "type": "module". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
</details>  

----


[pkg14](./node_modules/pkg14)  
first array item doesn't have supported tags and gets skipped

```js
{
  "name": "pkg14",
  "type": "module",
  "exports": {
    "import": [
      {
        "deno": "./e-cjs.js"
      },
      {
        "node": "./e-esm.mjs"
      }
    ]
  }
}
```

importing pkg14 results in:  
> esm from e-esm.mjs  

----


[pkg15](./node_modules/pkg15)  
require is not taken into account when package is imported

```js
{
  "name": "pkg15",
  "exports": {
    "require": "./e-cjs.js",
    "import": "./e-esm.mjs"
  }
}
```

importing pkg15 results in:  
> esm from e-esm.mjs  

----


[pkg16](./node_modules/pkg16)  
items identified by an unsupported URI get skipped

```js
{
  "name": "pkg16",
  "exports": {
    "import": [
      "https://example.com/notthere.certainly",
      "./e-esm.mjs"
    ]
  }
}
```

importing pkg16 results in:  
> esm from e-esm.mjs  

----


[pkg17](./node_modules/pkg17)  
nested package.json sets type:module

```js
{
  "name": "pkg17",
  "exports": {
    "default": "./esm/nested-esm.js"
  }
}
```

importing pkg17 results in:  
> esm from esm/nested-esm.js  

----


[pkg18](./node_modules/pkg18)  
extension overrides type again

```js
{
  "name": "pkg18",
  "type": "module",
  "module": "./esm.js",
  "exports": {
    "import": "./e-cjs.cjs"
  }
}
```

importing pkg18 results in:  
> cjs from e-cjs.js  

----
