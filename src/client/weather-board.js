
import WeatherBoardHeader from './weather-board-header.js'
import WeatherBoardLogin from './weather-board-login.js'
import WeatherBoardPrompt from './weather-board-prompt.js'
import WeatherBoardRichText from './weather-board-rich-text.js'
import WeatherBoardGrid from './weather-board-grid.js'
import Component from './util/component.js'
import PointerManager from './util/pointer-manager.js'
import WeatherBoardAPI from './weather-board-api.js'
import compile from './weather-board-script.js'
import WeatherBoardDataProvider from './weather-board-data-provider.js'
import WeatherBoardDataProviderEvent from './weather-board-data-provider-event.js'
import WeatherBoardNotificationStack from './weather-board-notification-stack.js'
import WeatherBoardNotification from './weather-board-notification.js'
import DefaultText from './config/default-text.js'
import StyleValue from './config/style-value.js'
import APIEvent from '../shared/api-event.js'
import makeIndex from '../shared/make-index.js'
import Cursor from '../shared/cursor.js'
import WeatherBoardPage from './weather-board-page.js'
import WeatherBoardPromptEvent from './weather-board-prompt-event.js'
import PointerManagerEvent from './util/pointer-manager-event.js'
import WeatherBoardMenuEvent from './weather-board-menu-event.js'
import WeatherBoardHeaderEvent from './weather-board-header-event.js'
import WeatherBoardNotificationType from './weather-board-notification-type.js'



export default class WeatherBoard extends Component {

    
    static loginText = DefaultText.loginText
    static aboutText = DefaultText.aboutText
    static manualText = DefaultText.manualText
    static initText = DefaultText.initText

    static aboutLabel = DefaultText.aboutLabel
    static manualLabel = DefaultText.manualLabel
    static loginLabel = DefaultText.loginLabel
    static logoutLabel = DefaultText.logoutLabel
    static gridLabel = DefaultText.gridLabel

    static style = `
        :host {
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            width: 320px;
            height: 240px;
        }

        .body {
            z-index: 1;
            flex: 1;
            display: flex;
            overflow: hidden;
            background-color: ${StyleValue.bodyBGColor};
        }
        .header {
            z-index: 2;
        }
        .margin {
            margin: ${StyleValue.defaultPadding}px;
        }

        weather-board-notification-stack {
            z-index: 3;
            position: absolute;
            bottom: 0;
            left: 0;
        }
    `
    
    _user = null
    _page = -1
    _api = new WeatherBoardAPI()
    _initialized = false
    _coordMin // from server
    _coordMax // from server
    _fontsizeMin = 18 // from server
    _fontsizeMax = 18// from server
    _fontsizeDefault = 18// from server
    _errors = new Set()
    _headerEl = WeatherBoardHeader.create()
    _bodyEl = document.createElement('div')
    _initEl = WeatherBoardRichText.create()
    _loginEl = WeatherBoardLogin.create()
    _aboutEl = WeatherBoardRichText.create()
    _manualEl = WeatherBoardRichText.create()
    _promptEl = WeatherBoardPrompt.create()
    _gridEl = WeatherBoardGrid.create()
    _errorEl = WeatherBoardRichText.create()
    _notificationStack = WeatherBoardNotificationStack.create()
    _gridPointerManager

    _processTimeout
    _program

    _renderFlag = false
    _paramsRead = false
    
    _warningTimeout
    _lastRequestTimestamp

    _pointerViewX
    _pointerViewY

    constructor() {
        super(WeatherBoard.style)
        this._init()
    }


    /* Main initialization procedure */

    async _init() {
        if (this._initialized) return
        this._initialized = true


        this._initDataProvider()
        this._initDOM()
        this.page = WeatherBoardPage.INIT_PAGE

        this._registerAPIEventListeners()

        try {
            await this._getConstants()
        } catch(err) {
            console.error(err)
            this._panic('Error loading data.')
        }


        

        try {
            await this._autoLogin()
        } catch(err) {
            console.error(err)
        }
        if (this._user) {
            this._dataProvider.prefetch(this._gridEl.viewX, this._gridEl.viewY)
            this.page = WeatherBoardPage.GRID_PAGE
        } else {
            this.page = WeatherBoardPage.LOGIN_PAGE
        }
    }

    _initDataProvider() {
        this._dataProvider = new WeatherBoardDataProvider(this._api)
        this._dataProvider.on(WeatherBoardDataProviderEvent.UPDATE_CELL, (signal)=>{
            this._gridEl.updateCell(signal.x, signal.y)
        })
        this._dataProvider.on(WeatherBoardDataProviderEvent.DELETE_QUADRANT, (signal)=>{
            this._api.unsubscribe(signal.qx, signal.qy)
        })
        this._dataProvider.on(WeatherBoardDataProviderEvent.ADD_QUADRANT, (signal)=>{
            this._api.subscribe(signal.qx, signal.qy)
        })
    }

    async _getConstants() {
        const {quadrantSize} = await this._api.getQuadrantSize()
        const {coordMin, coordMax} = await this._api.getCoordMinMax()
        const {fontsizeMin, fontsizeMax, fontsizeDefault} = await this._api.getFontsizeMinMax()
        const {ageLimit} = await this._api.getAgeLimit()
        this._coordMin = coordMin
        this._coordMax = coordMax
        this._fontsizeMin = fontsizeMin
        this._fontsizeMax = fontsizeMax
        this._fontsizeDefault = fontsizeDefault
        this._dataProvider.quadrantSize = quadrantSize
        this._dataProvider.ageLimit = ageLimit
        console.log('got constants')
    }

    /* Auto Login */

    async _autoLogin() {
        const storedToken = localStorage.getItem('token')
        if (storedToken) {
            await this.login(storedToken)
        }
    }


    _readParams() {
        if (this._paramsRead) return
        this._paramsRead = true
        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop)
        })
        if (params.x || params.y) {
            
            const x = parseInt(params.x) || 0
            const y = parseInt(params.y) || 0
            this.goto(x, y)
        }
        if (window.history.replaceState) {
            const url = new URL(location.href)
            window.history.replaceState({}, document.title, url.origin);
         }
    }

    getCursorURL() {
        const url = new URL(location.href)
        url.searchParams.set('x', this._gridEl.cursorX)
        url.searchParams.set('y', this._gridEl.cursorY)
        return url
    }

    async _copyPageUrl() {
        try {
            const url = this.getCursorURL()
            await navigator.clipboard.writeText(url.href)
        } catch (err) {
            console.error('Failed to copy: ', err)
        }
    }

    /* Initialization procecures */

    _initDOM() {

        this._headerEl.classList.add('header')
        this._headerEl.menu.addEventListener(WeatherBoardMenuEvent.NAVIGATE_EVENT, (ev)=>{
            if (ev.detail.value == WeatherBoardPage.GRID_PAGE) {
                this.page = WeatherBoardPage.GRID_PAGE
            } else if (ev.detail.value == WeatherBoardPage.ABOUT_PAGE) {
                this.page = WeatherBoardPage.ABOUT_PAGE
            } else if (ev.detail.value == WeatherBoardPage.MANUAL_PAGE) {
                this.page = WeatherBoardPage.MANUAL_PAGE
            } else if (ev.detail.value == WeatherBoardPage.LOGIN_PAGE) {
                this.page = WeatherBoardPage.LOGIN_PAGE
            } else if (ev.detail.value === 'logout') {
                this.logout()
                this.page = WeatherBoardPage.LOGIN_PAGE
            }
        })

        this._headerEl.display.setup([
            {x: 0}, 
            {y: 0}
        ])

        this._headerEl.addEventListener(WeatherBoardHeaderEvent.DISPLAY_CLICK_EVENT, (ev)=>{
            this._copyPageUrl()
        })
        
        this.shadowRoot.append(this._headerEl)

        this._bodyEl.classList.add('body')
        this.shadowRoot.append(this._bodyEl)

        this.shadowRoot.append(this._notificationStack)
        

        this._initEl.classList.add('margin')
        this._initEl.text = WeatherBoard.initText

        this._errorEl.classList.add('margin')

        this._loginEl.text = WeatherBoard.loginText
        this._loginEl.addEventListener('confirm', async (ev)=>{
            try {
                await this.register()
                this.page = WeatherBoardPage.GRID_PAGE
            } catch(err) {
                console.warn(err)
            }
        })

        this._aboutEl.classList.add('margin')
        this._aboutEl.text = WeatherBoard.aboutText

        this._manualEl.classList.add('margin')
        this._manualEl.text = WeatherBoard.manualText

        this._gridEl.classList.add('margin')
        this._gridEl.dataProvider = (x, y) => {
            return this._dataProvider.getCell(x, y)
        }
        this._gridEl.addEventListener('resize', (ev) => {
            this._keepViewRectAtCursor()
        })


        PointerManager.preventContextMenu()
        this._gridPointerManager = new PointerManager(this._gridEl)
        this._gridPointerManager.on(PointerManagerEvent.DOWN, this.bound(this._gridPointerStart))
        this._gridPointerManager.on(PointerManagerEvent.MOVE, this.bound(this._gridPointerMove))
        this._gridPointerManager.on(PointerManagerEvent.LONGPRESS, this.bound(this._gridPointerLongPress))
        this._gridPointerManager.on(PointerManagerEvent.CLICK, this.bound(this._gridPointerPress))

        this._gridEl.addEventListener('wheel', this.bound(this._gridScroll))
        this._gridEl.setAttribute('tabindex', '1')

        this._gridEl.addEventListener('keydown', this.bound(this._gridKeydown))

        this._promptEl.addEventListener(WeatherBoardPromptEvent.EXEC_EVENT, (ev)=>{
            const program = ev.detail.text
            this._promptEl.clear()
            this.page = WeatherBoardPage.GRID_PAGE
            this.exec(program)
        })

        this._promptEl.addEventListener(WeatherBoardPromptEvent.PRINT_EVENT, (ev)=>{
            const query = ev.detail.text
            this._promptEl.clear()
            this.page = WeatherBoardPage.GRID_PAGE
            this.print(query)
        })

        this._promptEl.addEventListener(WeatherBoardPromptEvent.CANCEL_EVENT, (ev)=>{
            this.page = WeatherBoardPage.GRID_PAGE
            this._promptEl.clear()
        })
        
    }

    _panic(id) {
        this._errors.add(id)
        this.page = WeatherBoardPage.ERROR_PAGE
    }

    _registerAPIEventListeners() {
        
        this._api.on(APIEvent.connect, (err) => {
            console.log('connect', err)
        })

        this._api.on(APIEvent.connectError, (err) => {
            console.log('connect errir', err)
            this._user = null
            this._dataProvider.clearQuadrants()
            this._panic('Error connecting server.')
        })

        this._api.on(APIEvent.reconnect, async (attempt) => {
            this._user = null
            this._dataProvider.clearQuadrants()
            try {
                await this._autoLogin()
            } catch(err) {
                console.error(err)
            }

            if (this._user) {
                this.page = WeatherBoardPage.GRID_PAGE
            } else {
                this.page = WeatherBoardPage.LOGIN_PAGE
            }
        })

        this._api.on(APIEvent.disconnect, () => {
            this._user = null
            this._dataProvider.clearQuadrants()
            this._page = ERROR_PAGE
        })

        this._api.on(APIEvent.updateUser, (index, userData) => {
            if (this._user && this._user.id === userData.id) return
            this._dataProvider.upsertUser(index, userData)
        })

        this._api.on(APIEvent.removeUser, (index, userData) => {
            if (this._user && this._user.id === userData.id) return
            this._dataProvider.removeUser(index, userData)
        })

        this._api.on(APIEvent.updateCell, (cell) => {
            this._dataProvider.updateCell(cell)
        })


        this._api.on(APIEvent.deleteCell, (cell) => {
            this._dataProvider.deleteCell(cell)
        })



        let requestLimitTimeout
        this._api.on(APIEvent.approachingRequestLimit, () => {
            console.log('APPROACHING_REQUEST_LIMIT')
            this._notificationStack.add({
                id: APIEvent.approachingRequestLimit,
                headline: 'Warning',
                text: 'Approaching request limit.',
                type: WeatherBoardNotificationType.WARNING
            })
            if (requestLimitTimeout) clearTimeout(requestLimitTimeout)
            requestLimitTimeout = setTimeout(
                ()=>{
                    this._notificationStack.remove(APIEvent.approachingRequestLimit)
                }, 
                10000
            )
        }) 

        this._api.on(APIEvent.requestLimit, () => {
            console.log('REQUEST_LIMIT')
            this._notificationStack.remove(APIEvent.approachingRequestLimit)
            this._panic('Request Limit reached. Try again later.')
        }) 

        this._api.on(APIEvent.blacklisted, () => {
            console.log('Blacklisted')
            this._notificationStack.remove(APIEvent.approachingRequestLimit)
            this._panic(`Your IP is blacklisted. You'll have to wait some time.`)
        }) 
        
        this._api.on(APIEvent.logout, (attempt) => {
            this._user = null
        })
    }

    /*
        API Error

            this._notificationStack.add({
                id: API_EVENT.REQUEST_LIMIT,
                headline: 'Error',
                text: 'Reached request limit.',
                type: WeatherBoardNotification.ERROR,
            })
    */

    set page(value) {
        console.log('set page', value)
        if (this._page != value) {
            this._page = value
            this.kill()
            this._render()
            this._headerEl.hideMenu()
        }
    }

    get page() {
        return this._page
    }

    _render() {
        if (this._renderFlag) return
        this._renderFlag = true
        requestAnimationFrame(()=>{    
            this._emptyBody()
            if (this._page == WeatherBoardPage.INIT_PAGE) {
                this._bodyEl.append(this._initEl)
                this._headerEl.hideDisplay()
            } else if (this._page == WeatherBoardPage.LOGIN_PAGE) {
                this._bodyEl.append(this._loginEl)
                this._loginEl.focus()
                this._headerEl.hideDisplay()
            } else if (this._page == WeatherBoardPage.ABOUT_PAGE) {
                this._bodyEl.append(this._aboutEl)
                this._aboutEl.focus()
                this._headerEl.hideDisplay()
            } else if (this._page == WeatherBoardPage.MANUAL_PAGE) {
                this._bodyEl.append(this._manualEl)
                this._manualEl.focus()
                this._headerEl.hideDisplay()
            } else if (this._page == WeatherBoardPage.GRID_PAGE) {
                this._bodyEl.append(this._gridEl)
                this._gridEl.focus()
                this._headerEl.showDisplay()
            } else if (this._page == WeatherBoardPage.PROMPT_PAGE) {
                this._bodyEl.append(this._promptEl)
                this._promptEl.focus()
                this._headerEl.showDisplay()
            } else if (this._page == WeatherBoardPage.ERROR_PAGE) {
                this._errorEl.text = Array.from(this._errors).join('\n')
                this._bodyEl.append(this._errorEl)
                this._headerEl.hideDisplay()
                console.log('ERROR_PAGE')
            }
            this._updateMenu()
            this._renderFlag = false
        })
    }

    _updateMenu() {
        this._headerEl.menu.items = this._getMenu()
        if (!this._headerEl.menu.items.length) {
            this._headerEl.hideMenuButton()
        } else {
            this._headerEl.showMenuButton()
        }
    }

    _getMenu() {
        const menu = []
        if (this._page == WeatherBoardPage.INIT_PAGE ) return menu
        if (!this._user) menu.push({
            label: WeatherBoard.loginLabel, 
            value: WeatherBoardPage.LOGIN_PAGE, 
            active: this.page === WeatherBoardPage.LOGIN_PAGE
        })

        if (this._user) menu.push({
            label: WeatherBoard.gridLabel, 
            value: WeatherBoardPage.GRID_PAGE, 
            active: this.page === WeatherBoardPage.GRID_PAGE
        })
        menu.push({
            label: WeatherBoard.aboutLabel, 
            value: WeatherBoardPage.ABOUT_PAGE, 
            active: this.page === WeatherBoardPage.ABOUT_PAGE
        })

        if (this._user) menu.push({
            label: WeatherBoard.manualLabel, 
            value: WeatherBoardPage.MANUAL_PAGE, 
            active: this.page === WeatherBoardPage.MANUAL_PAGE
        })
        if (this._user) menu.push({
            label: WeatherBoard.logoutLabel, 
            value:'logout'
        })
        
        return menu
    }

    _emptyBody() {
        while(this._bodyEl.children.length) this._bodyEl.firstChild.remove()
    }

    /* View data utilites */
    
    _keepCursorInView() {
        if (!this._user || !this._gridEl.ready) return
        let x = Math.max(
            this._gridEl.viewX,
            Math.min(
                this._gridEl.viewX + this._gridEl.cols - 1, 
                this._gridEl.cursorX
            )
        )
        let y = Math.max(
            this._gridEl.viewY,
            Math.min(
                this._gridEl.viewY + (this._gridEl.rows - 1), 
                this._gridEl.cursorY
            )
        )
        if (
            x != this._gridEl.cursorX
            || y != this._gridEl.cursorY
        ) {
            this.goto(x, y, false)
        }
    }

    _keepViewRectAtCursor() {
        if (!this._user || !this._gridEl.ready) return
        let x = Math.min(
            this._gridEl.cursorX,
            Math.max(
                this._gridEl.cursorX - this._gridEl.cols + 1, 
                this._gridEl.viewX
            )
        )
        let y = Math.min(
            this._gridEl.cursorY,
            Math.max(
                this._gridEl.cursorY - (this._gridEl.rows -1), 
                this._gridEl.viewY
            )
        )
        if (this._gridEl.viewX != x || this._gridEl.viewY != y) {
            this._gridEl.viewX = x
            this._gridEl.viewY = y
            this._dataProvider.prefetch(
                this._gridEl.viewX,
                this._gridEl.viewY
            )
            this._api.setView(x, y)
        }
    }

    _updateUser(user) {
        this._user = {...this._user, ...user}
        this._gridEl.cursorX = this._user.cx
        this._gridEl.cursorY = this._user.cy
        this._headerEl.display.update('x', this._user.cx)
        this._headerEl.display.update('y', this._user.cy)
        this._keepViewRectAtCursor()
        this._dataProvider.prefetch(this._gridEl.viewX, this._gridEl.viewY)
    }


    /* Scripting */

    async _process() {
        if (this._processTimeout || !this._program) return
        this._processTimeout = true
        if(await this._program()) {
            this._processTimeout = setTimeout(
                () => {
                    this._processTimeout = null
                    this._process()
                }, 
                60
            )
        } else {
            this._processTimeout = null
        }
    }

    kill() {
        if(this._processTimeout) {
            clearTimeout(this._processTimeout)
            this._processTimeout = null
            this._program = null
        }
    }

    /* User API calls */

    async register() {
        const user = await this._api.register()
        localStorage.setItem('token', user.token)
        const qid = makeIndex(user.qx,user.qy)
        this._dataProvider.removeUser(qid, user)
        this._gridEl.viewX = user.vx
        this._gridEl.viewY = user.vy
        if (this._gridEl.fontsize != user.fontsize) {
            this._gridEl.fontsize = user.fontsize
        }

        if (this._gridEl.blink != user.blink) {
            this._gridEl.blink = user.blink
        }
        this._updateUser(user)
    }

    async login(token) {
        const user = await this._api.login(token)
        localStorage.setItem('token', user.token)
        const qid = makeIndex(user.qx,user.qy)
        this._dataProvider.removeUser(qid, user)
        this._gridEl.viewX = user.vx
        this._gridEl.viewY = user.vy
        if (this._gridEl.fontsize != user.fontsize) {
            this._gridEl.fontsize = user.fontsize
        }
        if (this._gridEl.blink != user.blink) {
            this._gridEl.blink = user.blink
        }
        this._updateUser(user)
        this._readParams()
    }

    async logout() {
        localStorage.removeItem('token')
        this._user = null
        await this._api.logout()
    }

    moveView(x, y, keepInView=true) {
        if (this._gridEl.viewX == y && this._gridEl.viewY == y) return
        x =  Math.max(this._coordMin, Math.min(this._coordMax-this._gridEl.cols, x))
        y =  Math.max(this._coordMin, Math.min(this._coordMax-this._gridEl.rows, y))
        this._gridEl.viewX = x
        this._gridEl.viewY = y
        if (keepInView) this._keepCursorInView()
        this._dataProvider.prefetch(this._gridEl.viewX, this._gridEl.viewY)
        if (this._user) this._api.setView(this._gridEl.viewX, this._gridEl.viewY)
        return Promise.resolve()
    }

    fontsize(f) {
        this._gridEl.fontsize = Math.min(this._fontsizeMax, Math.max(this._fontsizeMin, f))
        if (this._user) this._api.setFontsize(this._gridEl.fontsize)
        return Promise.resolve()
    }
    
    blink(b) {
        this._gridEl.blink = !!b
        if (this._user) this._api.setBlink(this._gridEl.blink)
        return Promise.resolve()
    }

    reset() {
        this.restore()
        this.goto(0, 0)
        return Promise.resolve()
    }

    restore() {
        this.fontsize(this._fontsizeDefault)
        this.feed(1, 0)
        return Promise.resolve()
    }

    goto(x, y) {
        if (!this._user) return
        x = Math.max(this._coordMin, Math.min(this._coordMax, x))
        y = Math.max(this._coordMin, Math.min(this._coordMax, y))
        let tim = Date.now()
        this._lastRequestTimestamp = tim
        this._api.goto(x,y).then((user)=>{
            if (this._lastRequestTimestamp == tim) this._updateUser(user)
        })
        this._updateUser(Cursor.goto(this._user, x, y))
        return Promise.resolve()
    }

    move(x, y) {
        if (!this._user) return
        x =  Math.max(this._coordMin, Math.min(this._coordMax, this._user.cx + x)) - this._user.cx
        y =  Math.max(this._coordMin, Math.min(this._coordMax, this._user.cy + y)) - this._user.cy
        let tim = Date.now()
        this._lastRequestTimestamp = tim
        this._api.move(x,y).then((user)=>{
            if (this._lastRequestTimestamp == tim) this._updateUser(user)
        })
        this._updateUser(Cursor.move(this._user, x, y))
        return Promise.resolve()
    }

    print(str) {
        this.exec(str.split(/\n/g).map((line)=>`print "${line}"`).join('\ncrlf\n'))
    }
    
    exec(source) {
        if (!this._user) return
        this._program = compile(this, source) 
        this._process()
    }

    feed(x, y) {
        if (!this._user) return
        x = Math.max(-1, Math.min(1, x))
        y = Math.max(-1, Math.min(1, y))
        this._api.setFeed(x, y)
        this._updateUser({ax: x, ay: y})
        return Promise.resolve()
    }

    async read() {
        if (!this._user) return
        const cell = await this._api.read()
        if (cell) return cell.char
        return ' '
    }

    type(char) {
        if (!this._user) return
        if (!/^\S$/.test(char)) return
        let tim = Date.now()
        this._lastRequestTimestamp = tim
        this._api.type(char).then((user)=>{
            if (this._lastRequestTimestamp == tim) this._updateUser(user)
        })
        this._updateUser(Cursor.forward(this._user))
        return Promise.resolve()
    }

    space() {
        if (!this._user) return
        let tim = Date.now()
        this._lastRequestTimestamp = tim
        this._api.space().then((user)=>{
            if (this._lastRequestTimestamp == tim) this._updateUser(user)
        })
        this._updateUser(Cursor.forward(this._user))
        return Promise.resolve()
    }

    crlf() {
        if (!this._user) return
        let tim = Date.now()
        this._lastRequestTimestamp = tim
        this._api.crlf().then((user)=>{
            if (this._lastRequestTimestamp == tim) this._updateUser(user)
        })
        this._updateUser(Cursor.crlf(this._user))
        return Promise.resolve()
    }

    cr() {
        if (!this._user) return
        let tim = Date.now()
        this._lastRequestTimestamp = tim
        this._api.cr().then((user)=>{
            if (this._lastRequestTimestamp == tim) this._updateUser(user)
        })
        this._updateUser(Cursor.cr(this._user))
        return Promise.resolve()
    }

    backspace() {
        if (!this._user) return
        let tim = Date.now()
        this._lastRequestTimestamp = tim
        this._api.backspace().then((user)=>{
            if (this._lastRequestTimestamp == tim) this._updateUser(user)
        })
        this._updateUser(Cursor.reverse(this._user))
        return Promise.resolve()
    }



    /* Modal interaction methods */


    _gridScroll(ev) {  
        if (ev.shiftKey) {
            this.move(ev.deltaX>0?1:-1, 0)
        } else {
            this.move(0, ev.deltaY>0?1:-1)
        }
    }

    _gridPointerLongPress(sig) {
        this._gridPointerManager.stop()
        const el = sig.element
        if (el) {
            let index = el.index
            if (index>=0) {
                const x = this._gridEl.viewX+(index%this._gridEl.cols)
                const y = this._gridEl.viewY+((index/this._gridEl.cols)|0)
                this.goto(x, y)
            }
        }
        this.page = WeatherBoardPage.PROMPT_PAGE
    }

    _gridPointerStart(sig) {
        this.kill()
        this._pointerViewX = this._gridEl.viewX
        this._pointerViewY = this._gridEl.viewY
    }

    _gridPointerMove(sig) {
        let w = this._gridEl.cellWidth
        let h = this._gridEl.cellHeight
        let xo = Math.round(sig.deltaX/w)
        let yo =  Math.round(sig.deltaY/h)
        if (Math.abs(xo) > 0 || Math.abs(yo) > 0) {
            this.moveView(this._pointerViewX - xo, this._pointerViewY - yo)
            this._gridPointerManager.ignore([PointerManagerEvent.CLICK, PointerManagerEvent.LONGPRESS])
        }    
    }

    _gridPointerPress(sig) {
        const el = sig.element
        if (el) {
            let index = el.index
            if (index>=0) {
                const x = this._gridEl.viewX+(index%this._gridEl.cols)
                const y = this._gridEl.viewY+((index/this._gridEl.cols)|0)
                this.goto(x, y)
            }
        }
    }

    /* Event Handlers */

    _gridKeydown(ev) {
        if (this._page == WeatherBoardPage.GRID_PAGE) {

            this.kill()
            if (ev.isComposing || ev.keyCode === 229) return
            if (ev.key === 'ArrowRight') {
                if (ev.shiftKey) {
                    ev.preventDefault()
                    this.move(10, 0)
                } else {
                    this.move(1, 0)
                }
            } else if (ev.key === 'ArrowLeft') {
                if (ev.shiftKey) {
                    ev.preventDefault()
                    this.move(-10, 0)
                } else {
                    this.move(-1, 0)
                }
            } else if (ev.key === 'ArrowUp') {
                if (ev.shiftKey) {
                    ev.preventDefault()
                    this.move(0, -10)
                } else {
                    this.move(0, -1)
                }
            } else if (ev.key === 'ArrowDown') {
                if (ev.shiftKey) {
                    ev.preventDefault()
                    this.move(0, 10)
                } else {
                    this.move(0, 1)
                }
            } else if (ev.key === 'Tab') {
                ev.preventDefault()
                this.page = WeatherBoardPage.PROMPT_PAGE
            } else if (ev.key === 'Backspace') {
                this.backspace()
            } else if (ev.key === 'Enter') {
                this.crlf()
            } else if (ev.key === ' ') {
                this.space()
            } else {
                this.type(ev.key)
            }
        }
    }
}
