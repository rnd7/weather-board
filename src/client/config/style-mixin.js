import StyleValue from './style-value.js'

export default class StyleMixin {
    static boldFontMixin =  `
        font-family: ${StyleValue.fontFamily};
        font-weight: ${StyleValue.boldFontWeight};
        font-size: ${StyleValue.defaultFontSize}px;
    `

    static regularFontMixin =  `
        font-family: ${StyleValue.fontFamily};
        font-weight: ${StyleValue.boldFontWeight};
        font-size: ${StyleValue.defaultFontSize}px;
    `

    static smallFontMixin =  `
        font-family: ${StyleValue.fontFamily};
        font-weight: ${StyleValue.regulatFontWeight};
        font-size: ${StyleValue.smallFontSize}px;
    `

}
