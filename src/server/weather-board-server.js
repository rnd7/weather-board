import { Server } from 'socket.io'

import randomString from './random-string.js'

import assignPrefixed from '../shared/assign-prefixed.js'
import WeatherBoardHTTP from './weather-board-http.js'
import sanitizeUser from './sanitize-user.js'
import APIEvent from '../shared/api-event.js'
import APIMethod from '../shared/api-method.js'
import quadrantCoord from '../shared/quadrant-coord.js'
import makeIndex from '../shared/make-index.js'
import Cursor from '../shared/cursor.js'


export default class WeatherBoardServer {

    _ipMap = new Map()

    _purgeInterval = 60 * 60 * 1000
    _purgeThreshold = Math.round(29.53 * 24 * 60 * 60 * 1000)
    _purgeTimeout

    _tokenBytes = 32
    _idBytes = 16
    _quadrantSize = 128
    _connectionsPerIP = 20
    _timeWindow = 60*1000
    _warningThreshold = 500
    _ignoreThreshold = 1000
    _blacklistThreshold = 4000
    _blacklistTime = 24*60*60*1000
    _coordMin = -1e15
    _coordMax = 1e15
    _cursorDefaultX = 0
    _cursorDefaultY = 0
    _viewDefaultX = 0
    _viewDefaultY = 0
    _fontsizeMin = 16
    _fontsizeMax = 256
    _fontsizeDefault = 18
    _advanceDefaultX = 1
    _advanceDefaultY = 0

    _app
    _http
    _io
    _db
    
    constructor(storageAdapter, config) {
        if (!storageAdapter) throw new Error('Storage adapter required')
        console.log('Weather Board Server')
        if (config) {
            console.log('Using configuration object')
            console.log(config)
            assignPrefixed(config)
        } else {
            console.log('Continue with default configuration')
        }

        this._db = storageAdapter
        this._http = new WeatherBoardHTTP(config)
        this._io = new Server(this._http.server)

        this._autoPurge()

        this._initializeSocketServer()
    }


    _initializeSocketServer() {
        console.log('Initialize Socket Server')

        this._io.use(this._blacklistMiddleware())

        this._io.on('connection', (socket) => {
            socket.use(this._penaltyMiddleware(socket))
            this._socketConnection(socket)
        })
    }

    async _autoPurge() {
        if (this._purgeTimeout) this._purgeTimeout = clearTimeout(this._purgeTimeout)
        try {
            await this._db.purge(this._purgeThreshold)
        } catch (err) {
            console.log(err)
        }
        
        this._purgeTimeout = setTimeout(
            ()=>{
                this._purgeTimeout = null
                this._autoPurge()
            },
            this._purgeInterval
        )
    }

    _blacklistMiddleware() {
        return async (socket, next) => {
            try {
                // before connection blacklist middleware
                const now = Date.now()
                socket._ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address
                const blacklistEntry = await this._db.selectBlacklistIP(socket._ip)
                socket._blacklisted = !!blacklistEntry
                if (socket._blacklisted) {
                    if (blacklistEntry.modified + this._blacklistTime > now) {
                        console.log(`Connection attempt from blacklisted IP: ${socket._ip}`)
                        next(new Error('IP blacklisted'))
                        socket.disconnect(true)
                        this._db.updateBlacklistIP({ip: socket._ip})
                    } else {
                        console.log(`Blacklist remove IP: ${socket._ip}`)
                        socket._blacklisted = false
                        this._db.deleteBlacklistIP(socket._ip)
                        next()
                    }
                } else {
                    next()
                }
            } catch (err) {
                console.log(err)
            }
        }
    }

    _penaltyMiddleware(socket) {
        return (packet, next) => {
            try {
                const now = Date.now()
                let requests = this._ipMap.get(socket._ip) || []
                requests.push(now)
                requests = requests.filter(date => (date > now-this._timeWindow))
                const requestsPerWindow = requests.length 
                this._ipMap.set(socket._ip, requests)
                if (socket._blacklisted) {
                    socket.emit(APIEvent.blacklisted)
                    next(new Error('IP blacklisted'))
                    socket.disconnect(true)
                    // drop and disconnect
                } else if (requestsPerWindow >= this._blacklistThreshold) {
                    socket._blacklisted = true
                    console.log(`Too many requests, blacklisting IP: ${socket._ip}`)
                    this._db.insertBlacklistIP(socket._ip)
                    socket.emit(APIEvent.blacklisted)
                    next(new Error('IP blacklisted'))
                    socket.disconnect(true)
                    // drop and disconnect
                } else if (requestsPerWindow >= this._ignoreThreshold) {
                    socket.emit(APIEvent.requestLimit)
                    next(new Error('Request ignored'))
                } else if (requestsPerWindow >= this._warningThreshold) {
                    socket.emit(APIEvent.approachingRequestLimit)
                    next()
                } else {
                    next()
                }
            } catch (err) {
                console.log(err)
            }
        }
    }

    _updateUser(user, data, fn) {
        try {
            
            if (!user || !data) return fn()
            const prevIndex = makeIndex(user.qx, user.qy)
            user.cx = Math.max(this._coordMin, Math.min(this._coordMax, data.cx || 0))
            user.qx = quadrantCoord(user.cx, this._quadrantSize)
            user.cy = Math.max(this._coordMin, Math.min(this._coordMax, data.cy || 0))
            user.qy = quadrantCoord(user.cy, this._quadrantSize)
            user.rx = Math.max(this._coordMin, Math.min(this._coordMax, data.rx || 0))
            user.ry = Math.max(this._coordMin, Math.min(this._coordMax, data.ry || 0))
            user.moves++
            const curIndex = makeIndex(user.qx, user.qy)
            this._db.updateUserPositionBySocket(user).catch(console.log)
            const sanitizedUser = sanitizeUser(user)
            fn(null, sanitizedUser)
            if (prevIndex !== curIndex) this._io.to(prevIndex).emit(APIEvent.removeUser, prevIndex, sanitizedUser)
            this._io.to(curIndex).emit(APIEvent.updateUser, curIndex, sanitizedUser)
        } catch (err) {
            console.log(err)
        }
    }

    _socketConnection(socket) {
        
        socket.on(APIEvent.error, (err) => {
            console.log('Socket error:', err.message)
        })

        socket.on(APIMethod.register, async(fn) => {
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (user) return fn({message:'user already logged in'})
                const token = randomString(this._tokenBytes)
                const id = randomString(this._idBytes)
                const cx = this._cursorDefaultX
                const cy = this._cursorDefaultY
                const qx = quadrantCoord(cx, this._quadrantSize)
                const qy = quadrantCoord(cy, this._quadrantSize)
                const now = Date.now()
                const data = {
                    qx,
                    qy,
                    cx,
                    cy,
                    rx: cx,
                    ry: cy,
                    vx: this._viewDefaultX,
                    vy: this._viewDefaultY,
                    ax: this._advanceDefaultX,
                    ay: this._advanceDefaultY,
                    fontsize: this._fontsizeDefault,
                    blink: true,
                    id,
                    token,
                    socket: socket.id,
                    moves: 0
                }
                await this._db.insertUser(data)
                const userData = await this._db.selectUserByToken(token)
                if (userData) {
                    const curIndex = makeIndex(qx,qy)
                    this._io.to(curIndex).emit(APIEvent.updateUser, curIndex, userData)
                }
                fn(null, userData)
            } catch (err) {
                console.log(err)
            }
        })
    
        socket.on(APIMethod.login, async(token, fn) => {
            try {
                if (typeof token !== 'string' || token.length != this._tokenBytes * 2) return fn({message:'invalid parameters'})
                const userData = await this._db.selectUserByToken(token)
                //console.log('userData', userData)
                if (userData) {
                    const curIndex = makeIndex(userData.qx,userData.qy)
                    if (userData.socket) {
                        // socket linked to user
                        this._io.in(userData.socket).fetchSockets().then((sockets)=>{
                            // send logout to user socket
                            sockets.forEach(socket=>{
                                socket.emit(APIEvent.logout)
                            })
                            this._db.updateUserSocketByToken(token, socket.id).catch(console.log)
                            const sanitizedUser = sanitizeUser(userData)
                            this._io.to(curIndex).emit(APIEvent.removeUser, curIndex, sanitizedUser)
                            fn(null, userData)
                            this._io.to(curIndex).emit(APIEvent.updateUser, curIndex, sanitizedUser)
                        })
                    } else {
                        // regular login
                        this._db.updateUserSocketByToken(token, socket.id).catch(console.log)
                        fn(null, userData)
                        this._io.to(curIndex).emit(APIEvent.updateUser, curIndex, sanitizeUser(userData))
                    }
                
                } else {
                    fn({message:'user not found'})
                }
            } catch (err) {
                console.log(err)
            }
        })
    
    
        socket.on(APIMethod.logout, () => {
            this._db.resetUserSocket(socket.id).catch(console.log)
        })  
    
        socket.on(APIMethod.getQuadrantSize, (fn) => {
            if (typeof fn !== 'function') return
            fn(null, {quadrantSize: this._quadrantSize})
        })
    
        socket.on(APIMethod.getCoordMinMax, (fn) => {
            if (typeof fn !== 'function') return
            fn(null, {
                coordMin: this._coordMin,
                coordMax: this._coordMax
            })
        })

        socket.on(APIMethod.getFontSizeMinMax, (fn) => {
            if (typeof fn !== 'function') return
            fn(null, {
                fontsizeMin: this._fontsizeMin,
                fontsizeMax: this._fontsizeMax,
                fontsizeDefault: this._fontsizeDefault
            })
        })

        socket.on(APIMethod.getAgeLimit, (fn) => {
            if (typeof fn !== 'function') return
            fn(null, {
                ageLimit: this._purgeThreshold
            })
        })

        socket.on(APIMethod.fetchQuadrant, async(qx, qy, fn) => {
            if (typeof fn !== 'function') return
            if (typeof qx !== 'number' || typeof qy !== 'number') return fn({message:'invalid parameters'})
            try {
                qx = qx | 0
                qy = qy | 0
                const cells = await this._db.selectCellsByQuadrant(qx, qy)
                const users = await this._db.selectUsersByQuadrant(qx, qy)
                fn(null, {cells, users})
            } catch (err) {
                console.log(err)
            }
        })
    
        socket.on(APIMethod.subscribe, (qx, qy) => {
            if (typeof qx !== 'number' || typeof qy !== 'number') return
            socket.join(makeIndex(qx | 0, qy | 0))
        })
    
        socket.on(APIMethod.unsubscribe, (qx, qy) => {
            if (typeof qx !== 'number' || typeof qy !== 'number') return
            try {
                socket.leave(makeIndex(qx | 0, qy | 0))
            } catch (err) {
                console.log(err)
            }
        })

        socket.on(APIMethod.read, async (fn) => {
            if (typeof fn !== 'function') return
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                const x = user.cx
                const y = user.cy
                let cell = await this._db.selectCellByPosition(x, y)
                fn(null, cell)
            } catch (err) {
                console.log(err)
            }
        })
    
        socket.on(APIMethod.type, async (char, fn) => {
            if (typeof fn !== 'function') return
            if (!/^\S$/.test(char)) return fn({message:'invalid parameters'})
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                const x = user.cx
                const y = user.cy
                const qx = user.qx
                const qy = user.qy
                let cell = await this._db.selectCellByPosition(x, y)
                if (cell) {
                    // assuming update succeeds
                    this._db.updateCellByPosition(x, y, char).catch(console.log)
                    cell.char = char
                } else {
                    // assuming insert succeeds
                    cell = {qx, qy, x, y, char, modified: Date.now()}
                    this._db.insertCell(qx, qy, x, y, char).catch(console.log)
                }
                this._io.to(makeIndex(qx, qy)).emit(APIEvent.updateCell, cell)
                this._updateUser(user, Cursor.forward(user), fn)
            } catch (err) {
                console.log(err)
            }
        })
    
        socket.on(APIMethod.space, async (fn) => {
            if (typeof fn !== 'function') return
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                const x = user.cx
                const y = user.cy
                const qx = user.qx
                const qy = user.qy
                let cell = await this._db.selectCellByPosition(x, y)
                if (cell) {
                    this._db.deleteCellByPosition(x, y).catch(console.log)
                    this._io.to(makeIndex(qx, qy)).emit(APIEvent.deleteCell, cell);
                }
                this._updateUser(user, Cursor.forward(user), fn)
            } catch (err) {
                console.log(err)
            }
        })
    
        socket.on(APIMethod.backspace, async (fn) => {
            if (typeof fn !== 'function') return
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                const target = Cursor.reverse(user)
                const qx = user.qx
                const qy = user.qy
                this._updateUser(user, target, fn)
                let cell = await this._db.selectCellByPosition(target.cx, target.cy)
                if (cell) {
                    this._db.deleteCellByPosition(cell.x, cell.y).catch(console.log)
                    this._io.to(makeIndex(qx, qy)).emit(APIEvent.deleteCell, cell);
                }
            } catch (err) {
                console.log(err)
            }
        })
    
        socket.on(APIMethod.crlf, async (fn) => {
            if (typeof fn !== 'function') return
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                this._updateUser(user, Cursor.crlf(user), fn)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on(APIMethod.cr, async (fn) => {
            if (typeof fn !== 'function') return
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                this._updateUser(user, Cursor.cr(user), fn)
            } catch (err) {
                console.log(err)
            }
            
        })
    
        socket.on(APIMethod.move, async (x, y, fn) => {
            if (typeof fn !== 'function') return
            if (typeof x !== 'number' || typeof y !== 'number') return fn({message:'invalid parameters'})
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                this._updateUser(user, Cursor.move(user, x, y), fn) 
            } catch (err) {
                console.log(err)
            }
            
        })
    
        socket.on(APIMethod.goto, async (x, y, fn) => {
            if (typeof fn !== 'function') return
            if (typeof x !== 'number' || typeof y !== 'number') return fn({message:'invalid parameters'})
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                this._updateUser(user, Cursor.goto(user, x, y), fn)
            } catch (err) {
                console.log(err)
            }
        })


        socket.on(APIMethod.setView, async (x, y, fn) => {
            if (typeof fn !== 'function') return
            if (typeof x !== 'number' || typeof y !== 'number') return fn({message:'invalid parameters'})
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                x = Math.max(this._coordMin, Math.min(this._coordMax, x || 0))
                y = Math.max(this._coordMin, Math.min(this._coordMax, y || 0))
                this._db.updateUserViewPositionBySocket(user.socket, x, y)
                fn(null)
            } catch (err) {
                console.log(err)
            }
          
        })

        socket.on(APIMethod.setFontsize, async (fontsize, fn) => {
            if (typeof fn !== 'function') return
            if (typeof fontsize !== 'number') return fn({message:'invalid parameters'})
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                user.fontsize = Math.max(this._fontsizeMin, Math.min(this._fontsizeMax, fontsize))
                this._db.updateUserFontsizeBySocket(user.socket, fontsize).catch(console.log)
                fn(null)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on(APIMethod.setFeed, async (x, y, fn) => {
            if (typeof fn !== 'function') return
            if (typeof x !== 'number' || typeof y !== 'number') return fn({message:'invalid parameters'})
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                x = Math.max(-1, Math.min(1, x))
                y = Math.max(-1, Math.min(1, y))
                this._db.updateUserFeedBySocket(user.socket, x, y).catch(console.log)
                fn(null)
            } catch (err) {
                console.log(err)
            }
        })
            
        socket.on(APIMethod.setBlink, async (b, fn) => {
            if (typeof fn !== 'function') return
            if (typeof b !== 'boolean') return fn({message:'invalid parameters'})
            try {
                const user = await this._db.selectUserBySocket(socket.id)
                if (!user) return fn({message:'invalid user'})
                this._db.updateUserBlinkBySocket(user.socket, b)
                fn(null)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on(APIEvent.disconnect, async () => {
            try {
                console.log(`Disconnected IP: ${socket._ip}, Socket: ${socket.id}`)
                const user = await this._db.selectUserBySocket(socket.id)
                if (user) {
                    const curIndex = makeIndex(user.qx, user.qy)
                    this._db.resetUserSocket(socket.id).catch(console.log)
                    this._io.to(curIndex).emit(APIEvent.removeUser, curIndex, sanitizeUser(user))
                }
            } catch (err) {
                console.log(err)
            }
    
        })
    }

}