import Component from './util/component.js'
import StyleMixin from './config/style-mixin.js'
import StyleValue from './config/style-value.js'

export default class WeatherBoardDisplay extends Component {

    static style = `
        :host {
            display: flex;
        }
        .container {
            display: flex;
            overflow: hidden;
            flex-direction: column;
            justify-content: center;
            white-space: nowrap;
            padding-left: ${StyleValue.defaultPadding}px;
            padding-right: ${StyleValue.defaultPadding}px;
            background-color: ${StyleValue.statusBGColor};
            color: ${StyleValue.statusTextColor};

            ${StyleMixin.smallFontMixin}
        }

        .container > * {
            text-overflow: ellipsis;
            overflow: hidden;
        }
    `

    _entries = []
    _containerEl = document.createElement('div')
    _renderFlag = false
    constructor() {
        super(WeatherBoardDisplay.style)
        this._containerEl.classList.add('container')
        this.shadowRoot.append(this._containerEl)

    }

    setup(entries) {
        this._entries = []
        entries.forEach((entry)=> {
            Object.keys(entry).forEach((key)=>{
                this._entries.push({key, value: entry[key]})
            })
        })
        this._render()
    }

    update(key, value) {
        const entry = this._entries.forEach(entry => {
            if (entry.key === key) entry.value = value
        })
        this._render()
    }


    _render() {
        if (this._renderFlag) return
        this._renderFlag = true
        requestAnimationFrame(()=>{
            while(this._containerEl.children.length > this._entries.length) {
                this._containerEl.firstChild.remove()
            }
            while(this._containerEl.children.length < this._entries.length) {
                const div = document.createElement('div')
                this._containerEl.append(div)
            }
            this._entries.forEach((entry, index)=>{
                let el = this._containerEl.children[index]
                el.textContent = `${entry.key}: ${entry.value}`
            })
            this._renderFlag = false
        })
    }

}