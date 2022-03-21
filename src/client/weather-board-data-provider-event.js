
export default class WeatherBoardDataProviderEvent {

    static UPDATE_CELL = 'update-user'
    static DELETE_QUADRANT = 'delete-quadrant'
    static ADD_QUADRANT = 'add-quadrant'

    static ALL = new Set([
        WeatherBoardDataProviderEvent.UPDATE_CELL, 
        WeatherBoardDataProviderEvent.DELETE_QUADRANT, 
        WeatherBoardDataProviderEvent.ADD_QUADRANT
    ])

}