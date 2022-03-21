export default class Cursor {
    static crlf(user) {
        const {cx, cy, ax, ay, rx, ry} = user
        let xo = 0
        let yo = 0
        if (Math.abs(ax)) {
            yo = 1
        } else if (Math.abs(ay)) {
            xo = 1
        }
        return {
            cx: rx + xo, 
            cy: ry + yo,
            rx: rx + xo,
            ry: ry + yo
        }
    }
    
    static cr(user) {
        const {cx, cy, ax, ay, rx, ry} = user
        return {
            cx: rx, 
            cy: ry,
            rx,
            ry
        }
    }
    
    static reverse(user) {
        const {cx, cy, ax, ay, rx, ry} = user
        let rxl = rx
        let ryl = ry
        if (ax > 0) {
            rxl = Math.min(rx, cx-ax)
        } else if(ax < 0) {
            rxl = Math.max(rx, cx-ax)
        }
        if (ay > 0) {
            ryl = Math.min(ry, cy-ay)
        } else if(ay < 0) {
            ryl = Math.max(ry, cy-ay)
        }
        return {
            cx: cx - ax,
            cy: cy - ay,
            rx: rxl,
            ry: ryl
        }
    }
    static forward(user) {
        const {cx, cy, ax, ay, rx, ry} = user
        return {
            cx: cx + ax,
            cy: cy + ay,
            rx,
            ry
        }
    }
    
    static move(user, x, y) {
        const {cx, cy, ax, ay, rx, ry} = user
        return {
            cx: cx + x,
            cy: cy + y,
            rx: cx + x,
            ry: cy + y
        }
    }
    
    static goto(user, x, y) {
        const {cx, cy, ax, ay, rx, ry} = user
        return {
            cx: x,
            cy: y,
            rx: x,
            ry: y
        }
    }
    
}