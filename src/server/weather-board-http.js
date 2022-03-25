import express from 'express'
import http from 'http'
import assignPrefixed from '../shared/assign-prefixed.js'
import { dirname, resolve, join} from 'path'
import { fileURLToPath } from 'url'
import linkFileSync from './link-file-sync.js'
import ensureDirectorySync from './ensure-directory-sync.js'
import resolveModuleFile from './resolve-module-file.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const __webroot = resolve(__dirname, '..')

export default class WeatherBoardHTTP {
    static defaultModules =  {
        'socket.io': {
            'socket.io.js': 'client-dist/socket.io.esm.min.js',
            'socket.io.js.map': 'client-dist/socket.io.esm.min.js.map',
        }
    }
    _indexPath = resolve(__webroot, 'index.html')
    _modulePath = resolve(__webroot, 'module')
    _sharedPath = resolve(__webroot, 'shared')
    _clientPath = resolve(__webroot, 'client')
    _filesPath = resolve(__webroot, 'files')
    _contentPath = resolve(__webroot, 'content')
    _modules = {}
    _port = 3000
    _app
    _server

    constructor(config) {
        assignPrefixed(this, config)
        this._modules = {...WeatherBoardHTTP.defaultModules, ...this._modules}
        this._linkModules()
        this._app = express()
        this._server = http.createServer(this._app)
        this._initializeHTTPServer()
    }

    _linkModules() {
        ensureDirectorySync(resolve(this._modulePath))
        Object.keys(this._modules).forEach((moduleName)=>{
            console.log("Linking module", moduleName)
            const module = this._modules[moduleName]
            Object.keys(module).forEach((fileName)=>{
                const relativeFilePath = module[fileName]
                console.log("Linking file", fileName)
                const filePath = resolveModuleFile(
                    resolve(this._modulePath),
                    join(moduleName, relativeFilePath)
                )
                console.log("Found file", filePath)
                if (filePath) {
                    linkFileSync(
                        resolve(this._modulePath, fileName),
                        filePath
                    )
                }
            })
        })
    }

    get server() {
        return this._server
    }
    
    get app() {
        return this._app
    }

    _initializeHTTPServer() {
        console.log(`Initialize HTTP Server`)
        console.log(`Serving files relative to ${this._webroot}`)


        this._app.set('trust proxy', true)

        // Serving files

        this._app.get('/', (req, res) => {
            res.sendFile(resolve(this._indexPath));
        })

        this._app.get('/browserconfig.xml', (req, res) => {
            res.sendFile(resolve(this._filesPath, 'browserconfig.xml'));
        })

        this._app.get('/site.webmanifest', (req, res) => {
            res.sendFile(resolve(this._filesPath, 'site.webmanifest'));
        })

        // Serving directories

        this._app.use('/content', express.static(resolve(this._contentPath)))
        this._app.use('/shared', express.static(resolve(this._sharedPath)))
        this._app.use('/client', express.static(resolve(this._clientPath)))
        this._app.use('/files', express.static(resolve(this._filesPath)))
        this._app.use('/module', express.static(resolve(this._modulePath)))
        
        // Listen to configured port
        
        this._server.listen(this._port, () => {
            console.log(`HTTP Server listening on *:${this._port}`);
        })
    }
}
    