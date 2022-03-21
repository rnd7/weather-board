import EventDispatcher from './event-dispatcher.js'
import PointerManagerEvent from './pointer-manager-event.js'

export default class PointerManager extends EventDispatcher{
    
    static _contextMenuRegistered = false

    static preventContextMenu() {
        if (!this._contextMenuRegistered) {
            this._contextMenuRegistered = true
            window.addEventListener('contextmenu', this._onContextMenu, true)
        }  
    }

    static allowContextMenu() {
        if (this._contextMenuRegistered) {
            window.removeEventListener('contextmenu', this._onContextMenu, true)
            this._contextMenuRegistered = false
        }
    }

    static _onContextMenu(event) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
    }


    _domElement = null
    _longpressTime = 600
    _longpressTimeout = null
    _pointerRegistered = false
    _pointerLive = false
    _pointerMoveRegistered = false
    _pointerId = null
    _pointerTarget = null
    _pointerElement = null
    _pointerDownX = null
    _pointerDownY = null

    _pointerDownHandler
    _pointerUpHandler
    _pointerMoveHandler
    _pointerCancelHandler
    _pointerLeaveHandler

    constructor(domElement, opts = {}) {
        super(PointerManagerEvent.ALL)
        this._domElement = domElement || document.body
        this._domElement.style.touchAction = 'none'
        this._pointerDownHandler = this._onPointerDown.bind(this)
        this._pointerUpHandler = this._onPointerUp.bind(this)
        this._pointerMoveHandler = this._onPointerMove.bind(this)
        this._pointerCancelHandler = this._onPointerCancel.bind(this)
        this._pointerLeaveHandler = this._onPointerLeave.bind(this)
        if (opts.longpressTime) this.longpressTime = opts.longpressTime
    }

    set longpressTime(value) {
        this._longpressTime = value
    }

    get longpressTime() {
        return this._longpressTime
    }

    on(signals, listener) {
        super.on(signals, listener)
        if (!this._pointerRegistered) this._domElement.addEventListener('pointerdown', this._pointerDownHandler, false)
    }

    off(signals, listener) {
        super.off(signals, listener)
        if (!this._listeners.get(signal).size && this._pointerRegistered) {
            this._domElement.removeEventListener('pointerdown', this._onPointerDown, false)
        } 
    }

    stop() {
        if (this._pointerLive) {
            this._deactivate()
            this._reset()
        }
    }

    _activate() {
        if (this._pointerLive) return
        this._pointerLive = true
        this._domElement.removeEventListener('pointerdown', this._pointerDownHandler, false)

        this._domElement.setPointerCapture(this._pointerId)

        if (this._listeners.has(PointerManagerEvent.MOVE)) {
            this._pointerMoveRegistered = true
            this._domElement.addEventListener('pointermove', this._pointerMoveHandler, false)
        }

        this._domElement.addEventListener('pointerup', this._pointerUpHandler, false)
        this._domElement.addEventListener('pointercancel', this._pointerCancelHandler, false)
        this._domElement.addEventListener('pointerleave', this._pointerLeaveHandler, false)
    }

    _deactivate() {
        if (!this._pointerLive) return
        
        if (this._longpressTimeout) this._cancelLongpress()

        this._domElement.releasePointerCapture(this._pointerId)

        if (this._pointerMoveRegistered) {
            this._domElement.removeEventListener('pointermove', this._pointerMoveHandler, false)
            this._pointerMoveRegistered = false
        }

        this._domElement.removeEventListener('pointerup', this._pointerUpHandler, false)
        this._domElement.removeEventListener('pointercancel', this._pointerCancelHandler, false)
        this._domElement.removeEventListener('pointerleave', this._pointerLeaveHandler, false)

        this._domElement.addEventListener('pointerdown', this._pointerDownHandler, false)
        this._pointerLive = false
    }

    _reset() {
        this._pointerId = null
        this._pointerTarget = null
        this._pointerElement = null
        this._pointerDownX = null
        this._pointerDownY = null
        this.resetIgnore()
    }

    _dispatch(signal, event) {
        super.dispatch(signal, {  
            event,
            target: this._pointerTarget,
            element: this._pointerElement,
            downX: this._pointerDownX,
            downY: this._pointerDownY,
            deltaX: event.clientX - this._pointerDownX,
            deltaY: event.clientY - this._pointerDownY
        })
    }

    _cancelLongpress() {
        if (!this._longpressTimeout) return
        clearTimeout(this._longpressTimeout)
        this._longpressTimeout = null
    }

    _scheduleLongpress(event) {
        if (this._longpressTimeout) return
        this._longpressTimeout = setTimeout(()=>{
            this._dispatch(PointerManagerEvent.LONGPRESS, event)
            this._longpressTimeout = null
        }, this._longpressTime)
    }

    _onPointerDown(event) {
        if (this._pointerId != null && this._pointerId != event.pointerId) return
        this._pointerId = event.pointerId
        this._pointerTarget = event.target
        this._pointerElement = event.composedPath()[0]
        this._pointerDownX = event.clientX
        this._pointerDownY = event.clientY
        if (this._listeners.has(PointerManagerEvent.LONGPRESS)) {
            this._scheduleLongpress(event)
        }
        this._activate()
        this._dispatch(PointerManagerEvent.DOWN, event)
    }

    _onPointerMove(event) {
        if (event.pointerId != this._pointerId) return
        this._dispatch(PointerManagerEvent.MOVE, event)
    }

    _onPointerUp(event) {
        if (event.pointerId != this._pointerId) return
        this._deactivate()
        this._dispatch(PointerManagerEvent.UP, event)
        this._dispatch(PointerManagerEvent.CLICK, event)
        this._reset()
    }

    _onPointerCancel(event) {
        if (event.pointerId != this._pointerId) return
        this._deactivate()
        this._dispatch(PointerManagerEvent.CANCEL, event)
        this._reset()
    }

    _onPointerLeave(event) {
        if (event.pointerId != this._pointerId) return
        this._deactivate()
        this._dispatch(PointerManagerEvent.LEAVE, event)
        this._reset()
    }
}