# cjs lexer trick popularity

I've discovered that some packages might be using a trick in their bundler output for cjs that ends up using undeclared variables. The goal of the trick is to help cjs lexer understand what named exports are available from a more complex exporting code.  
The snippet is unreachable at execution time, so it doesn't matter that it's using uninitialized names, but to an AST parser, they look like global references.

It looks like this:
```
0 && (module.exports = {
  SomeNameOfAnExport,
  AnotherExportName
});
```

More details can be found starting from here: https://github.com/evanw/esbuild/issues/4100


I want to find out how popular the pattern `0 && (module.exports = ` is among npm packages. 

The plan is to search for it in every package's exports


- use ../exports-data.json as the source for a list of packages to check.
- for each package, do the following:
  - download the tarball,
  - pass it to ugrep with `-z` option and use `--include` option to only include files with `js` or `cjs` extension that were mentioned in the exports field for that package as listed in exports-data.json
  - if anything is found, append it to ./cjs-zero.md with a h3 heading with the package name.
  - avoid acumulating tarballs on disk
- make a node.js script.
- take a careful look at reference material to mimic the progress tracking 
- put the script in ./search.js file