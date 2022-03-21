export default class APIEvent {
        
    static connect = 'connect' // native
    static connectError = 'connect_error' // native
    static error = 'error' // native
    static disconnect = 'disconnect' // native
    static reconnect = 'reconnect' // native

    static updateUser = 'updateUser'
    static removeUser = 'removeUser'
    static updateCell = 'updateCell'
    static deleteCell = 'deleteCell'

    static blacklisted = 'blacklisted'
    static requestLimit = 'request-limit'
    static approachingRequestLimit = 'approaching-request-limit'

    static logout = 'logout'
}

