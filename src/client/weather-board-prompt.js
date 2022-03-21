import PointerManager from './util/pointer-manager.js'
import calculateTextSize from './util/calculate-text-size.js'
import Component from './util/component.js'
import DefaultText from './config/default-text.js'
import Style from './config/style.js'
import StyleValue from './config/style-value.js'
import StyleMixin from './config/style-mixin.js'
import WeatherBoardPromptEvent from './weather-board-prompt-event.js'
import PointerManagerEvent from './util/pointer-manager-event.js'

export default class WeatherBoardPrompt extends Component{

    static printButtonLabel = DefaultText.printButtonLabel
    static execButtonLabel = DefaultText.execButtonLabel
    static cancelButtonLabel = DefaultText.cancelButtonLabel
    
    static style = `
        :host {
            display: flex;
            flex-direction: column;
            flex:1;
        }

        ${Style.button}

        .text-container {
            display: flex;
            flex: 1;
            overflow: hidden;
            padding: ${StyleValue.defaultPadding}px;
            background: ${StyleValue.promptBGColor};
        }

        .text-wrapper {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .text-wrapper.hidden {
            display: none;
        }

        .text {
            ${StyleMixin.boldFontMixin}
        }

        .text-input {
            display: flex;
            box-sizing: border-box;
            flex: 1;
            resize: none; 
            border: none;
            overflow: hidden;
            outline: none;
            box-shadow: none;
            background: ${StyleValue.promptBGColor};
            color: ${StyleValue.promptTextColor};
        }

        .button-row {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            background: ${StyleValue.promptFooterColor};

        }
    `

    _lineHeight = 18
    _contentOffset = 0
    
    _textContainer = document.createElement('div')
    _textWrapper = document.createElement('div')
    _textInput = document.createElement('textarea')
    _toolbar = document.createElement('div')
    _cancelButton = document.createElement('button')
    _printButton = document.createElement('button')
    _execButton = document.createElement('button')
    
    _resizeObserver
    
    _pointerManager
    _cancelPointerManager
    _printPointerManager
    _execPointerManager

    _renderFlag = false
    _resizeFlag = false
    _focusFlag = false
    _scrollFlag = false
    _clearFlag = false
    _hiddenFlag = true

    _pointerDownContentOffset


    constructor() {
        super(WeatherBoardPrompt.style)

        this._textContainer.classList.add('text-container')
        this._textWrapper.classList.add('text-wrapper', 'hidden')
        this._textInput.autocorrect = false
        this._textInput.autocomplete = false
        this._textInput.autocapitalize = false
        this._textInput.spellcheck = false
        this._textInput.classList.add('text-input', 'text')
        this._toolbar.classList.add('button-row')
        this._cancelButton.textContent = WeatherBoardPrompt.cancelButtonLabel
        this._execButton.textContent = WeatherBoardPrompt.execButtonLabel
        this._printButton.textContent = WeatherBoardPrompt.printButtonLabel

        this._textWrapper.append(this._textInput)
        this._textContainer.append(this._textWrapper)
        this.shadowRoot.append(this._textContainer)
        this._toolbar.append(this._cancelButton)
        this._toolbar.append(this._execButton)
        this._toolbar.append(this._printButton)
        this.shadowRoot.append(this._toolbar)

        this._resizeObserver = new ResizeObserver(this.bound(this._resize))

        this._pointerManager = new PointerManager(this._textInput)
        this._pointerManager.on(PointerManagerEvent.DOWN, this.bound(this._pointerDown))
        this._pointerManager.on(PointerManagerEvent.MOVE, this.bound(this._pointerMove))
        this._textInput.addEventListener('wheel', this.bound(this._scroll))
        this._textInput.addEventListener('keydown', this.bound(this._keydown))

        this._cancelPointerManager = new PointerManager(this._cancelButton)
        this._cancelPointerManager.on(PointerManagerEvent.CLICK, this.bound(this._dispatchCancel))
       
        this._execPointerManager = new PointerManager(this._execButton, true)
        this._execPointerManager.on(PointerManagerEvent.CLICK, this.bound(this._dispatchExec))
        
        this._printPointerManager = new PointerManager(this._printButton, true)
        this._printPointerManager.on(PointerManagerEvent.CLICK, this.bound(this._dispatchPrint))
    }
 
    _dispatchPrint() {
        this.dispatchEvent(
            new CustomEvent(WeatherBoardPromptEvent.PRINT_EVENT, {
                detail: {
                    text: this._textInput.value
                }
            })
        )
    }
    _dispatchExec() {
        this.dispatchEvent(
            new CustomEvent(WeatherBoardPromptEvent.EXEC_EVENT, {
                detail: {
                    text: this._textInput.value
                }
            })
        )
    }
    _dispatchCancel() {
        this.dispatchEvent(
            new CustomEvent(WeatherBoardPromptEvent.CANCEL_EVENT, {
                detail: {
                    text: this._textInput.value
                }
            })
        )
    }


    get lineHeight() {
        return this._lineHeight
    }

    set contentOffset(value) {
        const min = 0
        const max = Math.max(
            0, 
            Math.floor((this._textInput.scrollHeight - this._textInput.clientHeight)/this._lineHeight)
        )
        this._contentOffset = Math.max(min, Math.min(max, value))
        this._scrollFlag = true
        this._render()
    }

    get contentOffset() {
        return this._contentOffset
    }

    focus() {
        this._focusFlag = true
        this._render()
    }

    clear() {
        this._contentOffset = 0
        this._scrollFlag = true
        this._clearFlag = true
        this._render()
    }

    _render() {
        if (this._renderFlag) return
        this._renderFlag = true
        requestAnimationFrame(()=>{
            if (this._resizeFlag) {
                this._textSize = calculateTextSize('0', this.shadowRoot, 'text')
                this._lineHeight = Math.round(this._textSize.height * 1.2)
                const computedStyle = getComputedStyle(this._textContainer)
                const textHeight = this._textContainer.clientHeight - parseFloat(computedStyle.paddingTop) - parseFloat(computedStyle.paddingBottom)
                this._textInput.style.lineHeight = `${this._lineHeight}px`
                this._textWrapper.style.marginBottom = `${textHeight%this._lineHeight}px`
            }
            if (this._clearFlag) {
                this._textInput.value = ''
                this._clearFlag = false
            }
            if (this._scrollFlag) {
                this._textInput.scrollTop = this._contentOffset * this._lineHeight
                this._scrollFlag = false
            }
            if (this._focusFlag) {
                this._textInput.focus()
                this._focusFlag = false
            }
            if (this._hiddenFlag) {
                this._textWrapper.classList.remove('hidden')
                this._hiddenFlag = false
            }
            this._renderFlag = false
        })
    }

    _resize() {
        this._resizeFlag = true
        this._render()
    }

    _pointerDown(sig) {
        this._pointerDownContentOffset  = this.contentOffset || 0
    }

    _pointerMove(sig) {
        let yo =  Math.round(sig.deltaY/this.lineHeight)
        if (Math.abs(yo) > 0) {
            this.contentOffset = this._pointerDownContentOffset - yo
            this._pointerManager.ignore(PointerManagerEvent.CLICK)
        }   
    }

    _scroll(ev) {
        console.log('scroll', ev.deltaY)
        this.contentOffset += (ev.deltaY>0)?1:-1
    }

    _keydown(ev) {
        if (ev.key === 'Enter') {
            if (ev.shiftKey) {
                ev.preventDefault()
                this._dispatchPrint()
            } else if (ev.ctrlKey || ev.metaKey){
                ev.preventDefault()
                this._dispatchExec()
            } 
        } else if (ev.key === 'Tab') {
            ev.preventDefault()
            this._dispatchCancel()
        }
    }

    connectedCallback() {
        this._resizeObserver.observe(this.parentElement)
        
    }

    disconnectedCallback() {
        this._resizeObserver.disconnect()
    }
}