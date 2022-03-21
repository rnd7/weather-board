export default function sanitizeUser(userData) {
        return {
            id: userData.id, 
            qx: userData.qx, 
            qy: userData.qy, 
            cx: userData.cx, 
            cy: userData.cy,
            rx: userData.rx,
            ry: userData.ry
        }
    }