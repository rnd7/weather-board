export default class PointerManagerEvent {
    static DOWN = 'down'
    static MOVE = 'move'
    static UP = 'up'
    static CLICK = 'click'
    static LONGPRESS = 'longpress'
    static CANCEL = 'cancel'
    static LEAVE = 'leave'

    static ALL = new Set([
        PointerManagerEvent.DOWN, 
        PointerManagerEvent.MOVE, 
        PointerManagerEvent.UP, 
        PointerManagerEvent.CLICK, 
        PointerManagerEvent.LONGPRESS, 
        PointerManagerEvent.LEAVE, 
        PointerManagerEvent.CANCEL
    ])
}