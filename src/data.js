const fs = require('fs')

const DATA_FILE = 'data.json'

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}))
}

function getData() {
    const text = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(text)
    return parsed
}

function writeData(data) {
    const text = JSON.stringify(data)
    fs.writeFileSync(DATA_FILE, text, 'utf-8')
}

module.exports = { getData, writeData }
