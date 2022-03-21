import makeIndex from '../shared/make-index.js'
import quadrantCoord from '../shared/quadrant-coord.js'
import calculateCellColor from './util/calculate-cell-color.js'
import EventDispatcher from './util/event-dispatcher.js'
import WeatherBoardDataProviderEvent from './weather-board-data-provider-event.js'

export default class WeatherBoardDataProvider extends EventDispatcher {


    _prefetchSurrounding = 2
    _quadrantCacheLimit = 32
    _quadrantCacheThreshold = 64
    _quadrants = new Map()
    _quadrantSize
    _ageLimit
    _api

    constructor(api) {
        super(WeatherBoardDataProviderEvent.ALL)
        this._api = api
    }

    get quadrants() {
        return this._quadrants
    }

    set quadrantSize(value) {
        this._quadrantSize = value
    }
    
    get quadrantSize() {
       return this._quadrantSize
    }

    set ageLimit(value) {
        this._ageLimit = value
    }
    
    get ageLimit() {
       return this._ageLimit
    }

    upsertUser(index, userData) {

        if (this.quadrants.has(index)) {
            const quadrant = this.quadrants.get(index)
            userData.cidx = makeIndex(userData.cx, userData.cy)
            if(quadrant.users.has(userData.id)) {
                const ud = quadrant.users.get(userData.id)
                if (quadrant.userMap.has(ud.cidx)) {
                    quadrant.userMap.get(ud.cidx).delete(ud.id)
                    if (quadrant.userMap.get(ud.cidx).size == 0) {
                        quadrant.userMap.delete(ud.cidx)
                        this.dispatch(WeatherBoardDataProviderEvent.UPDATE_CELL, {x: ud.cx, y: ud.cy})
                    } 
                }
            } 
            if(!quadrant.userMap.has(userData.cidx)) {
                quadrant.userMap.set(userData.cidx, new Set())
            }
            quadrant.userMap.get(userData.cidx).add(userData.id)
            quadrant.users.set(userData.id, userData)

            this.dispatch(WeatherBoardDataProviderEvent.UPDATE_CELL, {x: userData.cx, y: userData.cy})
        }
    }

    
    removeUser(index, userData) {
        if (this.quadrants.has(index)) {
            const quadrant = this.quadrants.get(index)
            if (quadrant.users.has(userData.id)) {
                const prevUser = quadrant.users.get(userData.id)
                if(quadrant.userMap.has(prevUser.cidx)) {
                    const cellSet = quadrant.userMap.get(prevUser.cidx)
                    if(cellSet.has(prevUser.id)) {
                        cellSet.delete(prevUser.id)
                        if (cellSet.size == 0) {
                            quadrant.userMap.delete(prevUser.cidx)
                            this.dispatch(WeatherBoardDataProviderEvent.UPDATE_CELL, {x: prevUser.cx, y: prevUser.cy})
                        }
                    }
                }
                quadrant.users.delete(prevUser.id)
            }
        }
    }

    updateCell(cell) {
        const qid = makeIndex(cell.qx,cell.qy)
        const cid = makeIndex(cell.x,cell.y)
        if (this._quadrants.has(qid)) {
            const quadrant = this._quadrants.get(qid)
            if (quadrant) {
                cell.color = calculateCellColor(cell, this._ageLimit)
                quadrant.map.set(cid, cell)
                this.dispatch(WeatherBoardDataProviderEvent.UPDATE_CELL, {x: cell.x, y: cell.y})
                        
            } 
        }
    }

    deleteCell(cell) {
        const qid = makeIndex(cell.qx,cell.qy)
        const cid = makeIndex(cell.x,cell.y)
        if (this._quadrants.has(qid)) {
            const quadrant = this._quadrants.get(qid)
            if (quadrant) {
                quadrant.map.delete(cid)
                this.dispatch(WeatherBoardDataProviderEvent.UPDATE_CELL, {x: cell.x, y: cell.y})
            } 
        }
    }


    getCell(x,y) {
        const qx = quadrantCoord(x, this._quadrantSize)
        const qy = quadrantCoord(y, this._quadrantSize)
        const qid = makeIndex(qx,qy)
        let char = ''
        let color = 'rgb(0,0,0)'
        let userAtCell = false
        const quadrant = this._quadrants.get(qid)
        if (quadrant) {
            const cid = makeIndex(x,y)
            const qmap = quadrant.map.get(cid)
            if (qmap) {
                char = qmap.char
                color = qmap.color
            }
            userAtCell = (quadrant.userMap.has(cid) && quadrant.userMap.get(cid).size > 0)
        }
        return {
            char,
            color,
            userAtCell
        }            
    }

    clearQuadrants() {
        const entries = Array.from(this._quadrants.entries())
        while (entries.length>0) {
            const [qid, quadrant] = entries.shift()
            this._quadrants.delete(qid)
            this.dispatch(WeatherBoardDataProviderEvent.DELETE_QUADRANT, {qx: quadrant.qx, qy: quadrant.qy})
        }
    }

    gcQadrants() {
        const entries = Array.from(this._quadrants.entries())
        if (entries.length>=this._quadrantCacheThreshold) {
            entries.sort((a,b)=>{
                return (a[1].fetched < b[1].fetched) ? -1 : 1
            })
            while (entries.length>this._quadrantCacheLimit) {
                const [qid, quadrant] = entries.shift()
                this._quadrants.delete(qid)
                this.dispatch(WeatherBoardDataProviderEvent.DELETE_QUADRANT, {qx: quadrant.qx, qy: quadrant.qy})
            }
        }
    }

    async fetchQuadrant(qx, qy) {
        let qid = makeIndex(qx, qy)
        try {
            const result = await this._api.fetchQuadrant(qx, qy)
            if (this._quadrants.has(qid)) {
                const quadrant = this._quadrants.get(qid) 
                result.users.forEach((userData) => {
                    this.upsertUser(quadrant, userData)
                })
                result.cells.forEach((cell)=>{
                    const cid = makeIndex(cell.x, cell.y)
                    cell.color = calculateCellColor(cell, this._ageLimit)
                    quadrant.map.set(cid, cell)
                    this.dispatch(WeatherBoardDataProviderEvent.UPDATE_CELL, {x: cell.x, y: cell.y})
                })
                quadrant.fetched = Date.now()
                this.dispatch(WeatherBoardDataProviderEvent.ADD_QUADRANT, {qx, qy})
            }
        } catch(err) {
            console.warn(err)
            this._quadrants.delete(qid)
        }
    }

    prefetch(vx, vy) {
        vx = vx || 0
        vy = vy || 0
        const rqx = quadrantCoord(vx, this._quadrantSize) 
        const rqy = quadrantCoord(vy, this._quadrantSize)
        let gc = false
        for (let x=-this._prefetchSurrounding; x<=this._prefetchSurrounding; x++) {
            for (let y=-this._prefetchSurrounding; y<=this._prefetchSurrounding; y++) {
                const qx = rqx + x
                const qy = rqy + y
                const qid = makeIndex(qx, qy)
                if (!this._quadrants.has(qid)) {
                    this._quadrants.set(qid, {
                        map: new Map(),
                        users: new Map(),
                        userMap: new Map(),
                        qx,
                        qy
                    })
                    this.fetchQuadrant(qx, qy)
                    gc = true
                }
            }
        }
        if (gc) this.gcQadrants()
    }

}