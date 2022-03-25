import Component from './util/component.js'
import PointerManager from './util/pointer-manager.js'
import WeatherBoardMenu from './weather-board-menu.js'
import WeatherBoardDisplay from './weather-board-display.js'
import StyleValue from './config/style-value.js'
import Style from './config/style.js'
import StyleMixin from './config/style-mixin.js'
import DefaultText from './config/default-text.js'
import WeatherBoardHeaderEvent from './weather-board-header-event.js'
import PointerManagerEvent from './util/pointer-manager-event.js'

export default class WeatherBoardHeader extends Component {

    static logoText = DefaultText.logoText
    static menuButtonLabel = DefaultText.menuButtonLabel

    static style = `
        :host {
            display: flex;
            height: ${StyleValue.minInteractiveHeight}px;
        }

        ${Style.button}

        .container {
            display: flex;
            flex: 1;
            width: 100%;
            flex-direction: row;
            align-items: center;
            background-color: ${StyleValue.headerBGColor};
        }

        .logo {
            display: flex;
            flex: 0;
            align-items: center;
            padding-left: ${StyleValue.defaultPadding}px;
            padding-right: ${StyleValue.defaultPadding}px;
            height: 100%;
            ${StyleMixin.boldFontMixin}
            color: ${StyleValue.logoTextColor};
            background-color: ${StyleValue.logoBGColor};
            white-space: nowrap;
        }

        .spacer {
            display: flex;
            flex: 1;
        }

        button.active {
            background-color: ${StyleValue.activeBGColor};
            color: ${StyleValue.activeTextColor};
        }

        button.hidden {
            display: none;
        }

        .display {
            display: none;
            cursor: pointer;
            height: 100%;
            overflow: hidden;
        }
        .menu {
            position: absolute;
            top: ${StyleValue.minInteractiveHeight}px;
            right: -100%;
            transition: right ${StyleValue.menuTransitionTime}s ${StyleValue.menuTransitionFunction};
            max-width: 100%;
        }
        .menu.visible {
            right: 0%;
        }
    `


    _menuVisible = false
    _menuButtonVisible = true
    _displayVisible = false
    _container = document.createElement('div')
    _logoEl = document.createElement('div')
    _spacerEl = document.createElement('div')
    _displayEl = WeatherBoardDisplay.create()
    _menuButton = document.createElement('button')
    _menuEl = WeatherBoardMenu.create()

    _positionElPointerManager
    _menuButtonPointerManager

    _renderFlag

    constructor() {
        super(WeatherBoardHeader.style)
        this._container.classList.add('container')

        this._logoEl.classList.add('logo')
        this._logoEl.textContent = WeatherBoardHeader.logoText

        this._spacerEl.classList.add('spacer')

        this._displayEl.classList.add('display')

        this._menuEl.classList.add('menu')

        this._positionElPointerManager = new PointerManager(this._displayEl, true)
        this._positionElPointerManager.on(PointerManagerEvent.CLICK, (ev)=>{
            this.dispatchEvent(new CustomEvent(WeatherBoardHeaderEvent.DISPLAY_CLICK_EVENT))
        })

        this._menuButton.classList.add('menu-button')
        this._menuButton.textContent = WeatherBoardHeader.menuButtonLabel

        this._container.append(this._logoEl)
        this._container.append(this._displayEl)
        this._container.append(this._spacerEl)
        this._container.append(this._menuButton)
        this._container.append(this._menuEl)
        this.shadowRoot.append(this._container)


        this._menuButtonPointerManager = new PointerManager(this._menuButton, true)
        this._menuButtonPointerManager.on(PointerManagerEvent.CLICK, this.bound(this._menuButtonPointerPress))

    }

    get menu() {
        return this._menuEl
    }

    get display() {
        return this._displayEl
    }
   
    showDisplay() {
        if (this._displayVisible) return
        this._displayVisible = true
        this._render()
    }

    hideDisplay() {
        if (!this._displayVisible) return
        this._displayVisible = false
        this._render()
    }

    showMenuButton() {
        if (this._menuButtonVisible) return
        this._menuButtonVisible = true
        this._render()
    }

    hideMenuButton() {
        if (!this._menuButtonVisible) return
        this._menuButtonVisible = false
        this._render()
    }

    showMenu() {
        if (this._menuVisible) return
        this._menuVisible = true
        this._render()
    }

    hideMenu() {
        if (!this._menuVisible) return
        this._menuVisible = false
        this._render()
    }

    toggleMenu() {
        if (this._menuVisible) this.hideMenu()
        else this.showMenu()
    }

    _render() {
        if (this._renderFlag) return
        this._renderFlag = true
        requestAnimationFrame(()=>{
            if (this._menuVisible) {
                this._menuButton.classList.add('active')
                this._menuEl.classList.add('visible')
            } else {
                this._menuButton.classList.remove('active')
                this._menuEl.classList.remove('visible')
                //this._menuEl.remove()
            }
            if (this._menuButtonVisible) {
                this._menuButton.classList.remove('hidden')
            } else {
                this._menuButton.classList.add('hidden')
            }
            if (this._displayVisible) {
                this._displayEl.style.display = 'flex'
            } else {
                this._displayEl.style.display = 'none'
            }
            this._renderFlag = false
        })
    }

    _menuButtonPointerPress(sig) {
        this.toggleMenu()
    }
}