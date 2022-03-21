import { readFile } from 'fs/promises'
import WeatherBoardServer from "./server/weather-board-server.js"
import { dirname, resolve, isAbsolute} from 'path';
import { fileURLToPath } from 'url';
import WeatherBoardSqlite from './server/weather-board-sqlite.js';

const __dirname = dirname(fileURLToPath(import.meta.url))
const __pkgroot = resolve(__dirname, '..')

console.log('Weather Board startup procedure')
console.log('Process arguments')
console.log(process.argv)

const _args = process.argv.slice(2)

async function init() {
    console.log('Initialization')
    let configPath = _args[0]
    if (!configPath) {
        console.log("Using default config")
        resolve(__pkgroot, 'config/default.json')
    }
    if(!isAbsolute(configPath)) {
        configPath = resolve(process.cwd(), configPath)
    }
    let config
    try {
        console.log(`Loading configuration file ${configPath}`)
        const json = await readFile(configPath)
        config = JSON.parse(json)
        console.log('Configuration file loaded successfully')
    } catch (err){
        console.log('Error loading configuration file')
        console.log(err)
    }
    console.log('')
    const storageAdapter = new WeatherBoardSqlite(config)
    console.log('')
    const server = new WeatherBoardServer(storageAdapter, config)
}

init()