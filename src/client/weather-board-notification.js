import Component from './util/component.js'
import StyleMixin from './config/style-mixin.js'
import StyleValue from './config/style-value.js'
import WeatherBoardNotificationType from './weather-board-notification-type.js'

export default class WeatherBoardNotification extends Component {

    static style = `
        :host {
            display: flex;
        }
        .container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: ${StyleValue.defaultPadding}px;
            background-color: ${StyleValue.statusBGColor};
            color: ${StyleValue.statusTextColor};
        }
        .container.warning {
            background-color: ${StyleValue.warningBGColor};
            color: ${StyleValue.warningTextColor};
        }
        .container.error {
            background-color: ${StyleValue.errorBGColor};
            color: ${StyleValue.errorTextColor};
        }
        h2 {
            margin: 0;
            ${StyleMixin.boldFontMixin}
        }
        p {
            margin: 0;
            ${StyleMixin.smallFontMixin}
        }
    `
    
    _type = WeatherBoardNotificationType.HINT
    _containerEl = document.createElement('div')
    _headlineEl = document.createElement('h2')
    _textEl = document.createElement('p')

    constructor() {
        super(WeatherBoardNotification.style)
        this._containerEl.classList.add('container')
        this._containerEl.append(this._headlineEl)
        this._containerEl.append(this._textEl)
        this.shadowRoot.append(this._containerEl)
    }

    set text(value) {
        if (this._textEl.textContent === value) return
        this._textEl.textContent = value
    }

    get text() {
        return this._textEl.textContent
    }


    set headline(value) {
        if (this._headlineEl.textContent === value) return
        this._headlineEl.textContent = value
    }

    get headline() {
        return this._headlineEl.textContent
    }

    set type(value) {
        if (this._type === value) return
        this._type = value
        this._updateContainer()
    }

    get type() {
        return this._type
    }

    _updateContainer() {
        if (this._type == WeatherBoardNotificationType.ERROR) {
            this._containerEl.classList.remove('warning')
            this._containerEl.classList.add('error')
        } else if (this._type == WeatherBoardNotificationType.WARNING) {
            this._containerEl.classList.add('warning')
            this._containerEl.classList.remove('error')
        } else {
            this._containerEl.classList.remove('warning')
            this._containerEl.classList.remove('error')
        }
    }
}