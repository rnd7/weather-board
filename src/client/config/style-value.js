import Color from './color.js'


export default class StyleValue {
    static logoTextColor = Color.lightGray
    static logoBGColor = Color.blue
    static activeTextColor = Color.lightGray
    static activeBGColor = Color.greenish
    static statusTextColor = Color.lightGray
    static statusBGColor = Color.darkerBlue
    
    static interactiveTextColor = Color.neutralBlue
    static interactiveBGColor = Color.almostWhite
    static hoverTextColor = Color.blue
    static hoverBGColor = Color.lightGray

    static headerBGColor = Color.neutralBlue
    static bodyBGColor = Color.almostBlack

    static cursorColor = Color.deepRed
    static foreignCursorColor = Color.mediumGray

    static richTextColor = Color.almostWhite

    static promptTextColor = Color.almostWhite
    static promptBGColor = Color.darkBlue
    static promptFooterColor = Color.neutralBlue

    static warningTextColor = Color.almostBlack
    static warningBGColor = Color.mellowYellow

    static errorTextColor = Color.almostWhite
    static errorBGColor = Color.deepRed

    static minInteractiveHeight = 48 // px
    static defaultPadding = 18 // px
    static fontFamily = 'monospace'
    static defaultFontSize = 18 // px
    static smallFontSize = 12 // px
    static regulatFontWeight = 300
    static boldFontWeight = 600
    static blinkInterval = 0.6 // s
    static blinkFunction = 'cubic-bezier(.80,0.0,.20,1.0)' 

    static menuTransitionTime = 0.3 //s 
    static menuTransitionFunction = 'ease-out' //s 

}
