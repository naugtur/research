const seed = require('./seed.json')
const { fetch } = require('undici')
const fs = require('fs')
const state = require('./state.json')
const data = new Set(require('./data.json'));
let nextPass = new Set(state.nextPass)
let prevSize = data.size;
const visited = new Set(state.visited);

function saveState() {
    if (prevSize < data.size) {
        prevSize = data.size
        process.stdout.write('' + data.size)

        fs.writeFileSync('data.json', JSON.stringify(Array.from(data)))
    }
    fs.writeFileSync('state.json', JSON.stringify({
        visited: Array.from(visited),
        nextPAss: Array.from(nextPass)
    }))
}

async function main(dataHook) {
    console.log(data.size, visited.size, seed.length)
    if(!nextPass.size){
        seed.forEach(a => nextPass.add(a))
    }
    let bailout = 0;
    while (nextPass.size > 0 && bailout < 100) {
        const current = Array.from(nextPass);
        nextPass = new Set()

        await scan(current, pkg => {
            visited.add(pkg.name)
            Object.keys(pkg.dependencies || {}).forEach(a => nextPass.add(a))
            Object.keys(pkg.devDependencies || {}).forEach(a => nextPass.add(a))
            const item = dataHook(pkg)
            if (item !== undefined) {
                data.add(items)
                process.stdout.write('+')
            }
            saveState()
            process.stdout.write('=')
        })

        bailout++
        console.log('>')

    }

}

async function scan(items, cb) {
    return items.reduce((queue, i) => queue.then(() => {
        if (!visited.has(i)) {
            return fetch(`https://registry.npmjs.org/${i}/latest`)
                .then(re => re.json())
                .then(cb)
        }
        process.stdout.write('-')
    }), Promise.resolve()).then(() => {
        savedata()
    }, console.error)
}

main(require('./data.js'))