import PointerManager from './util/pointer-manager.js'
import calculateTextSize from './util/calculate-text-size.js'
import Component from './util/component.js'
import StyleValue from './config/style-value.js'
import StyleMixin from './config/style-mixin.js'
import PointerManagerEvent from './util/pointer-manager-event.js'

export default class WeatherBoardRichText extends Component {

    static style = `
        :host {
            display: flex;
            background-color: ${StyleValue.bodyBGColor};
        }
        .text {
            ${StyleMixin.regularFontMixin}
            color: ${StyleValue.richTextColor};
            white-space: pre-wrap;
            line-height: 
            user-select: none; 
            -webkit-user-select: none;
        }
        .text b {
            ${StyleMixin.boldFontMixin}
            color: ${StyleValue.richTextColor};
        }
        .container {
            flex: 1;
            overflow: hidden;
            outline: none;
            border: none;
            display: flex;
        }

        .wrapper {
            flex: 1;
            overflow: hidden;
            outline: none;
            border: none;
        }

        .wrapper.hidden {
            display: none;
        }
    `

    _contentOffset = 0
    _lineHeight = 18
    _textSize

    _container = document.createElement('div')
    _wrapper = document.createElement('div')
    _content = document.createElement('div')

    _resizeObserver
    _pointerManager

    _pointerStartContentOffset
    _renderFlag = false
    _resizeFlag = false
    _scrollFlag = false
    _hiddenFlag = true

    constructor() {
        super(WeatherBoardRichText.style)
        this._container.classList.add('container')
        this._container.setAttribute('tabindex', '1')
        this._wrapper.classList.add('wrapper', 'hidden')
        this._content.classList.add('text')
        
        this._container.append(this._wrapper)
        this._wrapper.append(this._content)
        this.shadowRoot.append(this._container)

        this._resizeObserver = new ResizeObserver((entries)=>{
            for (let entry of entries) {
                return this._resize(entry.contentRect)
            }
        })

        this._keydownHandler = this._keydown.bind(this)

        this._pointerManager = new PointerManager(this._container)
        this._pointerManager.on(PointerManagerEvent.DOWN, this.bound(this._pointerStart))
        this._pointerManager.on(PointerManagerEvent.MOVE, this.bound(this._pointerMove))
        this._container.addEventListener('wheel', this.bound(this._scroll))
        this._container.addEventListener('keydown', this.bound(this._keydown))


    }

    focus() {
        this._container.focus() 
    }

    _pointerStart(sig) {
        this._pointerStartContentOffset  = this.contentOffset
    }

    _pointerMove(sig) {
        let yo =  Math.round(sig.deltaY/this.lineHeight)
        if (Math.abs(yo) > 0) {
            this.contentOffset = this._pointerStartContentOffset - yo
            return true
        }   
    }

    get containerHeight() {
        return this._container.clientHeight
    }

    get contentHeight() {
        return this._content.clientHeight
    }

    get lineHeight() {
        return this._lineHeight
    }

    set contentOffset(value) {
        const min = 0
        const max = Math.max(0, Math.round((this.contentHeight - this.containerHeight)/this._lineHeight))
        this._contentOffset = Math.max(min, Math.min(max, value))
        this._scrollFlag = true
        this._render()
    }

    get contentOffset() {
        return this._contentOffset
    }

    set text(value) {
        this._content.innerHTML = value
    }

    _render() {
        if (this._renderFlag) return
        this._renderFlag = true
        requestAnimationFrame(()=>{
            if (this._resizeFlag) {
                this._textSize = calculateTextSize('0', this.shadowRoot, 'text')
                this._lineHeight = Math.round(this._textSize.height * 1.2)
                this._content.style.lineHeight = `${this._lineHeight}px`
                this._wrapper.style.marginBottom = `${this._container.clientHeight%this._lineHeight}px`
                this._resizeFlag = false
            }
            if (this._scrollFlag) {
                this._content.style.marginTop = `${-this._contentOffset * this._lineHeight}px`
            }
            if (this._hiddenFlag) {
                this._wrapper.classList.remove('hidden')
                this._hiddenFlag = false
            }
            this._renderFlag = false
        })
    }

    _triggerResize() {
        this._resizeFlag = true
        this._render()
    }

    _scroll(ev) {
        this.contentOffset += (ev.deltaY>0)?1:-1
    }

    _resize(cr) {
        this._elementWidth = cr.width
        this._elementHeight = cr.height
        this._triggerResize()
    }

    _keydown(ev) {
        if (ev.key === 'ArrowUp') {
            this.contentOffset--
        } else if (ev.key === 'ArrowDown') {
            this.contentOffset++
        } else if (ev.key === 'Enter') {
            if (evt.shiftKey) {

            }
        }
    }

    connectedCallback() {
        this._resizeObserver.observe(this.parentElement)
    }

    disconnectedCallback() {
        this._resizeObserver.disconnect()
    }
}