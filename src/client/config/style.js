import StyleMixin from './style-mixin.js'
import StyleValue from './style-value.js'

export default class Style {

    static button = ` 
        button {
            outline: none;
            border: none;
            margin: 0;
        
            ${StyleMixin.boldFontMixin}
        
            min-height: ${StyleValue.minInteractiveHeight}px;
        
            padding-left: ${StyleValue.defaultPadding}px;
            padding-right: ${StyleValue.defaultPadding}px;
            background-color: ${StyleValue.interactiveBGColor};
            color: ${StyleValue.interactiveTextColor};
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
        
        }
        button:hover {
            background-color: ${StyleValue.hoverBGColor};
            color: ${StyleValue.hoverTextColor};
        }
    `

}
