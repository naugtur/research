const fs = require("fs");
const data = require("./gits-data.json");


function printDeps(data) {
  return data.filter(pkg => pkg.gitdeps).map(pkg => `
### ${pkg.name} 

${pkg.gitdeps?.join("  \n")}

    `
  ).join('');
}

function printDevDeps(data) {
  return data.filter(pkg => pkg.gitdevdeps).map(pkg => `
### ${pkg.name} 
dev deps
${pkg.gitdevdeps?.join("  \n")}

    `
  ).join('');
}

function printNonGithub(data) {
  return data.flatMap(pkg => [].concat([],pkg.gitdeps,pkg.gitdevdeps))
  .filter(i=>i)
  .filter(dep => !dep.includes('github')).map(dep => `- ${dep}`).join("\n");
}

function print(data) {
  return `
# TOC

  [git dependencies](#git-dependencies)  
  [git dev dependencies](#git-dev-dependencies)  
  [non github](#non-github)  

## git dependencies

${printDeps(data)}

## git dev dependencies

${printDevDeps(data)}

## non github

${printNonGithub(data)}
`
}

fs.writeFileSync("gits.md", print(data));
