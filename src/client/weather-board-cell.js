import Component from './util/component.js'

export default class WeatherBoardCell extends Component {
   

    _text = ""
    _index = 0

    constructor() {
        super()
    }

    set text(value) {
       if (this._text === value) return
       this._text = value 
       this.shadowRoot.textContent = this._text
    }
    
    get text() {
        return this._text
    }

    set index(value) {
        this._index = value
    }

    get index() {
        return this._index
    }
}