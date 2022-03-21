import Component from './util/component.js'
import DefaultText from './config/default-text.js'
import StyleValue from './config/style-value.js'
import Style from './config/style.js'
import PointerManager from './util/pointer-manager.js'
import WeatherBoardRichText from './weather-board-rich-text.js'
import WeatherBoardLoginEvent from './weather-board-login-event.js'
import PointerManagerEvent from './util/pointer-manager-event.js'

export default class WeatherBoardLogin extends Component {

    static confirmButtonLabel = DefaultText.confirmButtonLabel

    static style = `
        :host {
            display: flex;
            flex: 1;
        }

        ${Style.button}

        .container {
            display: flex;
            flex: 1;
            flex-direction: column;
        }
        .flex {
            flex: 1;
            overflow: hidden;
            margin: ${StyleValue.defaultPadding}px;
        }
        .button-row {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            background-color: ${StyleValue.headerBGColor};
        }
    `
    
    _container
    _textEl
    _buttonRowEl
    _confirmButtonEl

    _confirmPointerManager

    constructor() {
        super(WeatherBoardLogin.style)
        this._container = document.createElement('div')
        this._container.classList.add('container')

        this._textEl = WeatherBoardRichText.create()
        this._textEl.classList.add('flex')
        this._container.append(this._textEl)


        this._buttonRowEl = document.createElement('div')
        this._buttonRowEl.classList.add('button-row')
        this._container.append(this._buttonRowEl)


        this._confirmButtonEl = document.createElement('button')
        this._confirmButtonEl.textContent = WeatherBoardLogin.confirmButtonLabel

        this._confirmPointerManager = new PointerManager(this._confirmButtonEl)
        
        this._confirmPointerManager.on(PointerManagerEvent.CLICK, (sig) => {
            this.dispatchEvent(
                new CustomEvent(WeatherBoardLoginEvent.CONFIRM_EVENT, {
                    detail: {
                        pointerEvent: sig.event
                    }
                })
            )
        })

        this._buttonRowEl.append(this._confirmButtonEl)

        this.shadowRoot.append(this._container)
    }

    set text(value) {
        this._textEl.text = value
    }

    get text() {
        return this._textEl.text
    }
}