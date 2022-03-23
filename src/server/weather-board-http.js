import express from 'express'
import http from 'http'
import assignPrefixed from '../shared/assign-prefixed.js'
import { dirname, resolve} from 'path'
import { fileURLToPath } from 'url'
import { linkModuleFile } from './linker.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

linkModuleFile('socket.io/client-dist/socket.io.esm.min.js', 'src/lib')
linkModuleFile('socket.io/client-dist/socket.io.esm.min.js.map', 'src/lib')

export default class WeatherBoardHTTP {

    _webroot = resolve(__dirname, '..')
    _port = 3000
    _app
    _server

    constructor(config) {
        assignPrefixed(this, config)
        this._app = express()
        this._server = http.createServer(this._app)
        this._initializeHTTPServer()
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
            res.sendFile(resolve(this._webroot,'index.html'));
        })

        this._app.get('/browserconfig.xml', (req, res) => {
            res.sendFile(resolve(this._webroot,'browserconfig.xml'));
        })

        this._app.get('/site.webmanifest', (req, res) => {
            res.sendFile(resolve(this._webroot,'site.webmanifest'));
        })

        // Serving directories

        this._app.use('/website', express.static(resolve(this._webroot, 'website')))

        this._app.use('/shared', express.static(resolve(this._webroot, 'shared')))

        this._app.use('/client', express.static(resolve(this._webroot, 'client')))
        
        
        this._app.use('/lib', express.static(resolve(this._webroot, 'lib')))

        this._app.use('/files', express.static(resolve(this._webroot, 'files')))
        
        // Listen to configured port
        
        this._server.listen(this._port, () => {
            console.log(`HTTP Server listening on *:${this._port}`);
        })
    }
}
    