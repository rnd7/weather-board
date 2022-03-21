export default class EventDispatcher {

    _all = new Set()
    _listeners = new Map()
    _ignore = new Set()

    constructor(signals) {
        this._all.add(...signals)
    }
    

    on(signals, listener) {
        if (typeof listener !== 'function') return
        let iterable
        if (typeof signals === 'string') iterable = [signals]
        else if (Symbol.iterator in Object(signals)) iterable = signals
        else iterable = this._all
        for (let signal of iterable) {
            if (!this._listeners.has(signal)) {
                this._listeners.set(signal, new Set([listener]))
            } else {
                this._listeners.get(signal).add(listener)
            }
        }
    }

    off(signals, listener) {
        if (signals === undefined && listener  === undefined) return this._listeners.clear()
        if (typeof listener !== 'function') return
        let iterable
        if (typeof signals === 'string') iterable = [signals]
        else if (Symbol.iterator in Object(signals)) iterable = signals
        else iterable = this._all
        for (let signal of iterable) {
            if (this._listeners.has(signal)) {
                if (this._listeners.get(signal).has(listener)) {
                    this._listeners.get(signal).delete(listener)
                }
                if (!this._listeners.get(signal).size) this._listeners.delete(signal)
            }
        }
    }

    ignore(signals) {
        let iterable
        if (!signals) iterable = this._all
        else if (typeof signals === 'string') iterable = [signals]
        else iterable = signals
        for (let signal of iterable) {
            this._ignore.add(signal)
        }
    }

    resetIgnore() {
        this._ignore.clear()
    }


    dispatch(signal, opts = {}) {
        if (this._ignore.has(signal)) return
        if (this._listeners.has(signal)) {
            const listeners = this._listeners.get(signal)
            for (let listener of listeners) {
                listener({...opts, signal})
            }
        }
    }
}