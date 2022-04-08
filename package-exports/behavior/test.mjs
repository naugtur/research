import fs from "fs";

let i = 0;
let markdowns = [
  `# Generated with node.js ${process.version}`
];
do {
  let message = "",
    errorMessage = "";
  try {
    const pkg = await import(`pkg${i}`);
    message = `${pkg.type}`;
  } catch (e) {
    if (e.message.includes(`Cannot find package 'pkg${i}'`)) break;
    errorMessage = e.message;
    message = `💥 ${e.message.substring(0, 32).replace("\n", "") + "..."}`;
  }
  console.log(`pkg${i}\t`, message);
  const p = packgeJson(`pkg${i}`);
  const { version, license, description, ...noteworthy } = p;
  markdowns.push(`

[pkg${i}](./node_modules/pkg${i})  
${description}

\`\`\`js
${JSON.stringify(noteworthy, null, 2)}
\`\`\`

importing pkg${i} results in:  
${printMsg(message, errorMessage)}  

----
`);
} while (i++ < 100);

fs.writeFileSync("./summary.md", markdowns.join(""));

function printMsg(message,errorMessage){
  if(errorMessage){
    return `
<details>
<summary>${message}</summary>
Error: ${errorMessage}
</details>`
  } else {
    return '> '+message
  }
}
function packgeJson(pkgname) {
  const path = `./node_modules/${pkgname}/package.json`;
  const pkgStr = fs.readFileSync(path);
  const p = JSON.parse(pkgStr);
  return p;
}
