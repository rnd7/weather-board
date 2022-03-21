import Component from './util/component.js'
import StyleValue from './config/style-value.js'
import WeatherBoardNotification from './weather-board-notification.js'
import WeatherBoardNotificationType from './weather-board-notification-type.js'

export default class WeatherBoardNotificationStack extends Component {

    static defaultId = 'default'
    static defaultText = ''
    static defaultHeadline = 'Notification'
    static defaultType = WeatherBoardNotificationType.HINT

    static style = `
        :host {
            display: flex;
        }
        .container {
            display: flex;
            flex-direction: column;
            gap: ${StyleValue.defaultPadding}px;
        }
    `
    _entries = new Map()
    _containerEl = document.createElement('div')

    constructor() {
        super(WeatherBoardNotificationStack.style)
        this._containerEl.classList.add('container')
        this.shadowRoot.append(this._containerEl)

    }

    add({
        id = WeatherBoardNotificationStack.defaultId, 
        headline = WeatherBoardNotificationStack.defaultHeadline, 
        text = WeatherBoardNotificationStack.defaultText, 
        type = WeatherBoardNotificationStack.defaultType}
    ) {
        let notification = this._entries.get(id)
        if (!notification) {
            notification = WeatherBoardNotification.create()
            this._entries.set(id, notification)
        }
        notification.headline = headline
        notification.text = text
        notification.type = type
        this._containerEl.append(notification)
        return id
    }

    remove(id) {
        const notification = this._entries.get(id)
        if (notification) {
            this._entries.delete(id)
            notification.remove()
        }
    }
}