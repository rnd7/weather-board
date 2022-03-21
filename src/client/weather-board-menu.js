import Component from './util/component.js'
import PointerManager from './util/pointer-manager.js'
import Style from './config/style.js'
import StyleValue from './config/style-value.js'
import WeatherBoardMenuEvent from './weather-board-menu-event.js'
import PointerManagerEvent from './util/pointer-manager-event.js'

export default class WeatherBoardMenu extends Component {
    static style = `
        ${Style.button}

        .container {
            display: flex;
            flex: 1;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        button.active {
            background-color: ${StyleValue.activeBGColor};
            color: ${StyleValue.activeTextColor};
        }
    `

    _items = []
    _container
    _containerPointerManager
    _renderFlag

    constructor() {
        super(WeatherBoardMenu.style)
        this._container = document.createElement('div')
        this._container.classList.add('container')

        this.shadowRoot.append(this._container)

        this._containerPointerManager = new PointerManager(this._container)
        this._containerPointerManager.on(PointerManagerEvent.CLICK, (sig) => {
            const el = sig.element
            if (el) {
                const value = el.dataset.value
                this.dispatchEvent(
                    new CustomEvent(WeatherBoardMenuEvent.NAVIGATE_EVENT, {
                        detail: {
                            pointerEvent: sig.event,
                            value
                        }
                    })
                )
            }
        })
    }

    set items(value) {
        this._items = value
        this._render()
    }

    get items() {
        return this._items
    }

    _render() {
        if (this._renderFlag) return
        this._renderFlag = true
        requestAnimationFrame(()=>{

            while(this._container.children.length > this._items.length) {
                this._container.firstChild.remove()
            }
            while(this._container.children.length < this._items.length) {
                const button = document.createElement('button')
                this._container.append(button)
            }
            this._items.forEach((item, index)=>{
                let el = this._container.children[index]
                el.textContent = item.label
                el.dataset.value = item.value
                if (item.active) el.classList.add('active')
                else el.classList.remove('active')
            })
            this._renderFlag = false
        })
    }

}