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


Research question: how popular the pattern `0 && (module.exports = ` is among npm packages?

The exports-data.json file above contains packages and the paths they export. 
I checked each path to see whether it contains the sequence.

Results:

[cjs-zero.md](./cjs-zero.md)
