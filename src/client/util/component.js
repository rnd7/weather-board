import debounce from './debounce.js'

export default class Component extends HTMLElement {

    static _prefix = ''
    static _components = new Set()
    
    _styleEl
    _bound = new Map()
    _debounced = new Map()
    constructor(style) {
        super()
        this.attachShadow({mode: 'open'})
        if (style) {
            this.componentStyle = style
        }
    }

    bound(fn) {
        if (!this._bound.has(fn)) {
            this._bound.set(fn, fn.bind(this))
        }
        return this._bound.get(fn)
    }

    debounced(fn, delay = 100) {
        if (!this._debounced.has(fn)) {
            this._debounced.set(fn, debounce(this.bound(fn), delay))
        }
        return this._debounced.get(fn)
    }

    set componentStyle(str) {
        if (this._styleEl) this.shadowRoot.remove(this._styleEl)
        this._styleEl = document.createElement('style')
        this._styleEl.appendChild(document.createTextNode(str))
        this.shadowRoot.append(this._styleEl)
    }


    static toComponentString(str) {
        if (!str) return null
        return str.split(/(?=[A-Z])/).join('-').toLowerCase()
    }
    
    static get componentName() {
        let name = this.toComponentString(this.name)
        if (this.prefix) return `${this.prefix}-${name}`
        return name
    }
    
    static set prefix(value) {
      this._prefix = this.toComponentString(value)
    }
    
    static get prefix() {
        return this._prefix
    }
      
    static define() {
        const name = this.componentName
        if (!this._components.has(name)) {
            customElements.define(name, this)
            this._components.add(name)
        }
        return name
    }

    static create() {
        return document.createElement(this.define())
    }
}