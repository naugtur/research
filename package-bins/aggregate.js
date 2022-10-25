const data = require('./bins1-data.json')

const index = {}
data.forEach(entry => entry.bins.map(bin => {
    index[bin] || (index[bin]=[])
    index[bin].push(entry.name)
}))

const sortIndex = (index, filter) => Object.fromEntries(Object.entries(index).filter(filter).sort((a,b) => b[1].length-a[1].length));

const sortedIndex = sortIndex(index, (a)=>a[1].length>1)

require('fs').writeFileSync('collisions.json',JSON.stringify(sortedIndex, null,2))