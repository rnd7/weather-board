import Component from './util/component.js'
import StyleValue from './config/style-value.js'
import WeatherBoardCell from './weather-board-cell.js'

export default class WeatherBoardGrid extends Component {

    static style = `
        :host {
            display: flex;
            flex: 1;
            outline: none;
            border: none;
        }
        .grid {
            display: grid;
            overflow: hidden;
            background-color: ${StyleValue.bodyBGColor};
            user-select: none; 
            -webkit-user-select: none;
            flex: 1;
            cursor: pointer;
            opacity: 1;
        }

        .grid.hidden {
            opacity: 0;
        } 

        .grid.animate {
            transition: opacity .2s; 
        }

        .cell {
            display: flex;
            text-align: center;
            align-items: center;
            overflow: hidden;
            justify-content: center;
            text-rendering: optimizeSpeed;
            user-select: none;
            -webkit-user-select: none;
            font-family: ${StyleValue.fontFamily};
            font-weight: ${StyleValue.boldFontWeight};
        }

        .cell.user{
            background: ${StyleValue.foreignCursorColor};
        }

        @keyframes cell-cursor {
            from { background-color: ${StyleValue.cursorColor}; }
            to { background-color: ${StyleValue.bodyBGColor}; }
        }
        
        .cell.cursor{
            background-color: ${StyleValue.cursorColor};
        }
        
        .cell.cursor.animated {
            animation-name: cell-cursor;
            animation-duration: ${StyleValue.blinkInterval}s;
            animation-timing-function: ${StyleValue.blinkFunction};
            animation-iteration-count: infinite;
            animation-direction: alternate;*/


        }
    `

    _viewX = 0
    _viewY = 0
    _cursorX = 0
    _cursorY = 0
    _fontsize = 18
    _lineHeight = 1.33
    _zoomFactor = 1.0
    _cellWidthRatio = .66
    _elementHeight = 1
    _elementWidth = 1
    _minRows = 3
    _minCols = 3
    _rows = 3
    _cols = 3
    _cellWidth = 1
    _cellHeight = 1
    _blink = false

    _cells
    _baseFontSize

    _gridEl
    _cursorEl
    _cellCache
    _cellRenderQueue
    _resizeObserver
    _dataProvider = ()=>{return {char:'', color:'black', userAtCell:false}}

    _redrawFlag
    _cursorFlag
    _resizeFlag
    _renderFlag
    
    _ready = false

    constructor() {
        super(WeatherBoardGrid.style)
        this._gridEl = document.createElement('div')
        this._gridEl.classList.add("grid", "hidden")
        this.shadowRoot.append(this._gridEl)
        this._cellCache = []
        this._cellRenderQueue = []
        this._resizeObserver = new ResizeObserver((entries)=>{
            for (let entry of entries) {
                this._elementWidth = entry.contentRect.width
                this._elementHeight = entry.contentRect.height
                this._gridEl.classList.remove("animate")
                this._gridEl.classList.add("hidden")
                this.debounced(this._resize, 300)()
                return
            }
        })
    }

    get ready() {
        return this._ready && this.parentElement
    }

    set dataProvider(fn) {
        this._dataProvider = fn
    }

    get rows() {
        return this._rows
    }

    get cols() {
        return this._cols
    }

    set fontsize(value) {
        this._fontsize = value
        this._resize()
    }

    get fontsize() {
        return this._fontsize
    }

    set lineHeight(value) {
        this._lineHeight = value
        this._resize()
    }

    get lineHeight() {
        return this._lineHeight
    }

    set blink(value) {
        this._blink = value
        this._triggerCursorUpdate()
    }

    get blink() {
        return this._blink
    }

    // cursor

    set cursorX(value) {
        this._cursorX = value
        this._triggerCursorUpdate()
    }

    get cursorX() {
        return this._cursorX
    }

    set cursorY(value) {
        this._cursorY = value
        this._triggerCursorUpdate()
    }

    get cursorY() {
        return this._cursorY
    }

    // view

    set viewX(value) {
        this._viewX = value
        this._triggerRedraw()
    }

    get viewX() {
        return this._viewX
    }

    set viewY(value) {
        this._viewY = value
        this._triggerRedraw()
    }

    get viewY() {
        return this._viewY
    }

    set zoomFactor(value) {
        this._zoomFactor = value
        this._triggerRedraw()
    }

    get zoomFactor() {
        return this._zoomFactor
    }

    get cellWidth() {
        return this._cellWidth
    }

    get cellHeight() {
        return this._cellHeight
    }


    updateCell(x,y) {
        const relX = x - this._viewX
        const relY = y - this._viewY
        if (
            relX >= 0 
            && relX < this.cols 
            && relY >= 0 
            && relY < this.rows
        ) {
            this._addToCellRenderQueue(()=>{
                this._drawCell(relX, relY)
            })
        }
    }

    updateGrid() {
        this._triggerRedraw()
    }

    _drawCell(x, y) {
        const index = y * this._cols + x
        const {char, color, userAtCell} = this._dataProvider(this._viewX + x, this._viewY + y)
        const cellEl = this._cellCache[index]
        if (!cellEl) return
        cellEl.style.color = color
        cellEl.text = char
        if (userAtCell) cellEl.classList.add('user')
        else cellEl.classList.remove('user')
    }

    _drawGrid() {
        const len = this._cellCache.length
        for (let index = 0; index<len; index++) {
            const x = (index%this._cols)
            const y = ((index/this._cols)|0)
            this._drawCell(x,y)
        }
    }

    _triggerCursorUpdate() {
        this._cursorFlag = true
        this._render()
    }

    _triggerViewUpdate() {
        this._redrawFlag = true
        this._render()
    }

    _triggerRedraw() {
        this._redrawFlag = true
        this._render()
    }

    _triggerResize() {
        this._resizeFlag = true
        this._render()
    }

    _addToCellRenderQueue(fn) {
        this._cellRenderQueue.push(fn)
        this._render()
    }
 
    _render() {
        if (this._renderFlag) return
        this._renderFlag = true
        requestAnimationFrame(()=>{
            if (this._resizeFlag) {
                this._resizeFlag = false
                this._resizeGrid()
                this._redrawFlag = true
            }
            if (this._redrawFlag) {
                this._redrawFlag = false
                this._drawGrid()
                this._cursorFlag = true
                this._cellRenderQueue = []
            } 
            if (this._cursorFlag) {
                if (this._cursorEl) {
                    this._cursorEl.classList.remove('cursor','animated')
                }
                const x = this._cursorX - this._viewX
                const y = this._cursorY - this._viewY
                this._cursorEl = this._cellCache[y*this._cols+x]
                if (this._cursorEl) {
                    this._cursorEl.classList.add('cursor')
                    if (this._blink) this._cursorEl.classList.add('animated')
                }
                this._cursorFlag = false
            }
            while (this._cellRenderQueue.length) this._cellRenderQueue.shift()()
            this._renderFlag = false
        })
    }

    _limitedZoomFactor() {
        let cellHeight = this._fontsize * this._lineHeight
        let cellWidth = cellHeight * this._cellWidthRatio
        const maxCellWidth = this._elementWidth / this._minCols
        const maxCellHeight = this._elementHeight / this._minRows
        const wf = maxCellWidth / cellWidth
        const hf = maxCellHeight / cellHeight
        return Math.min(this._zoomFactor, wf, hf)
    }

    _resizeGrid() {
        while(this._gridEl.children.length > this._cells) {
            this._gridEl.firstChild.remove()
        }
        while(this._gridEl.children.length < this._cells) {
            const cellEl = WeatherBoardCell.create()
            cellEl.classList.add('cell')
            this._gridEl.append(cellEl)
        }
        this._gridEl.style.fontSize = `${this._baseFontSize}px`
        this._gridEl.style.gridTemplateRows = `repeat(${this._rows},1fr)`
        this._gridEl.style.gridTemplateColumns = `repeat(${this._cols},1fr)`
        this._cellCache = Array.from(this._gridEl.children)

        const len = this._cellCache.length
        for (let index = 0; index<len; index++) {
            const cellEl = this._cellCache[index]
            cellEl.classList.remove('user', 'cursor', 'animated')
            cellEl.index = index
        }
        
        this._gridEl.classList.remove("hidden")

        this.dispatchEvent(new CustomEvent("resize"))
    }

    _resize() {
        const zoom = this._limitedZoomFactor()
        let cellHeight = this._fontsize * this._lineHeight * zoom
        let cellWidth = cellHeight * this._cellWidthRatio
        this._baseFontSize = Math.floor(this._fontsize * zoom)

        this._cols = Math.floor(this._elementWidth/cellWidth)
        this._rows = Math.floor(this._elementHeight/cellHeight)
        this._cells = this._rows * this._cols

        this._cellWidth = this._elementWidth / this._cols
        this._cellHeight = this._elementHeight / this._rows
        
        this._ready = true

        this._triggerResize()
    }

    /* Webcomponent lifecycle */

    connectedCallback() {
        this._resizeObserver.observe(this.parentElement)
    }

    disconnectedCallback() {
        this._resizeObserver.disconnect()
    }
}
