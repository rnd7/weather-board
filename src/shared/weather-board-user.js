import assign from "./assign.js"

export default class WeatherBoardUser {

    qx
    qy
    cx
    cy
    rx
    ry
    vx
    vy
    ax
    ay
    fontsize
    id
    token
    socket
    moves

    constructor(opts) {
        assign(this, opts, false, false)
    }

    get public() {
        const {id, qx, qy, cx, cy, rx, ry} = this
        return { id, qx, qy, cx, cy, rx, ry }
    }
    
}