import io from '../module/socket.io.js'
import APIEvent from '../shared/api-event.js'
import APIMethod from '../shared/api-method.js'

export default class WeatherBoardAPI {

    _socket
    _connected

    constructor() {
        this._socket = io()
        this._bindSocketEvents()
    }

    get connected() {
        return this._connected
    }

    _bindSocketEvents() {
    
        this._socket.on(APIEvent.connect, () => {
            console.log('connect')
            this._connected = true
        })

        this._socket.on(APIEvent.connectError , (err) => {
            console.log('connect-error')
            this._connected = false
        })

        this._socket.on(APIEvent.disconnect, () => {
            console.log('disconnect')
            this._connected = false
        })

        this._socket.io.on(APIEvent.reconnect, (attempt) => {
            console.log('reconnect')

        })
    }

    on(event, fn) {
        this._socket.on(event, fn)
    }

    off(event, fn) {
        this._socket.off(event, fn)
    }

    register() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.register, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    login(token) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.login, token, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }


    logout() {
        this._socket.emit(APIMethod.logout)
        return Promise.resolve()
    }


    read() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.read, (error, cell) => {
                if (error) reject(error)
                else resolve(cell)
            })
        })
    }

    setView(x, y) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.setView, x, y, (error) => {
                if (error) reject(error)
                else resolve()
            })
        })
    }

    setFontsize(factor) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.setFontsize, factor, (error) => {
                if (error) reject(error)
                else resolve()
            })
        })
    }
    
    setFeed(x, y) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.setFeed, x, y, (error) => {
                if (error) reject(error)
                else resolve()
            })
        })
    }

    setBlink(b) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.setBlink, b, (error) => {
                if (error) reject(error)
                else resolve()
            })
        })
    }
    
    unsubscribe(qx, qy) {
        this._socket.emit(APIMethod.unsubscribe, qx, qy) 
        return Promise.resolve()
    }

    subscribe(qx, qy) {
        this._socket.emit(APIMethod.subscribe, qx, qy) 
        return Promise.resolve()
    }

    fetchQuadrant(qx, qy) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.fetchQuadrant, qx, qy, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    getQuadrantSize() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.getQuadrantSize, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })

    }

    getCoordMinMax() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.getCoordMinMax, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    getFontsizeMinMax() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.getFontSizeMinMax, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    getAgeLimit() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.getAgeLimit, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    move(x, y) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.move, x, y, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    goto(x, y) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.goto, x, y, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    type(char) {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.type, char, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    space() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.space, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    crlf() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.crlf, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    cr() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.cr, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }

    backspace() {
        return new Promise((resolve, reject) => {
            this._socket.emit(APIMethod.backspace, (error, result) => {
                if (error) reject(error)
                else resolve(result)
            })
        })
    }
}
