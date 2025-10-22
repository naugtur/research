const fs = require("fs");
const data = require("./gits-data.json");


function printDeps(data) {
  return data.filter(pkg => pkg.gitdeps?.length).map(pkg => `
### ${pkg.name} 

${pkg.gitdeps?.join("  \n")}

    `
  ).join('');
}

function printDevDeps(data) {
  return data.filter(pkg => pkg.gitdevdeps?.length).map(pkg => `
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

  [${data.filter(pkg => pkg.gitdeps?.length).length} packages with git dependencies](#git-dependencies)  
  [${data.filter(pkg => pkg.gitdevdeps?.length).length} packages with git dev dependencies](#git-dev-dependencies)  
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
