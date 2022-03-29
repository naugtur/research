const data = require("./data.json");

const search = process.argv[2]
if(!search){
    console.log(`usage: node lookup packagename`)
    process.exit(1)
}
console.log(data.find(({name})=> name === search)?.exports)