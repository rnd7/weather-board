
const makeInteger = (parameter) => {
    const int = parseInt(parameter) || 0
    return () => { return int }
}

const makeString = (parameter) => {
    const str = parameter.replace(/^"/,'').replace(/"$/, '')
    return () => { return str }
}

const makeBool = (parameter) => {
    const bool = (parameter.toLowerCase() === "true")
    return () => { return bool }
}


const parseBool = (scope, parameter) => {
    if (/^true$|^false$/i.test(parameter)) {
        return makeBool(parameter)
    } else if (/^[a-z]+$/i.test(parameter)) { 
        return () => {
            let param = scope.get(parameter)
            if (param !== undefined) return (param.toLowerCase() === "true")
            return false
        }
    }
    return ()=>{return false}
}

const parseString = (scope, parameter) => {
    if (/^[a-z]+$/i.test(parameter)) { 
        return () => {
            let param = scope.get(parameter)
            if (param !== undefined) return param.toString()
            return ''
        }
    } else if (/^".*"$/.test(parameter)) {
        return makeString(parameter)
    }
    return ()=>{return ''}
}

const parseInteger = (scope, parameter) => {
    if (/^[a-z]+$/i.test(parameter)) {  
        return () => {
            let param = scope.get(parameter)
            if (param !== undefined) return parseInt(param)
            return 0
        }
    } else if (/^-?[0-9]+$/.test(parameter)) {
        return makeInteger(parameter)
    }
    return ()=>{return 0}
}

const parse = (scope, parameter) => {
    if (/^true$|^false$/i.test(parameter)) { 
        return () => {
            makeBool(parameter)
            return null
        }
    } else if (/^[a-z]+$/i.test(parameter)) { 
        return () => {
            let param = scope.get(parameter)
            if (param !== undefined) return param
            return null
        }
    } else if (/^".*?"$/.test(parameter)) {
        return makeString(parameter)
    } else if (/^-?[0-9]+$/.test(parameter)) {
        return makeInteger(parameter)
    }
    return ()=>{return null}
}

export default function compile(api, src) {
    return (() => {

        let sequenceStart = [{index: 0, indent: -1}]
        let targets = new Map()

        let global = new Map()
        let proc = new Map()

        let bytecode = []
        let index = 0

        let previousRowIndent = 0

        const begin = (index, indent) => {  
            console.log('begin', index, indent)
            sequenceStart.push({index, indent})
        }

        const end = (index, indent) => {
            console.log('end', index, indent)
            while (sequenceStart.length && sequenceStart[sequenceStart.length-1].indent >= indent) {
                const b = sequenceStart.pop()
                targets.set(b.index, index)
            }
        }

        const findSequenceStart = (indent) => {
            console.log('find begin', sequenceStart)
            let i = sequenceStart.length-1
            for (i; i>0; i--) {
                if(sequenceStart[i].indent<indent) return sequenceStart[i].index
            }
            return sequenceStart[0].index  
        }

        const rows = src.split(/\n+/g)
        rows.forEach((row)=>{
            const match = row.match(/^(\s*)(\S+)\s*(.*)$/)
            if (match && match.length == 4) {
                const currentIndex = bytecode.length
                const indent = match[1].length
                const cmd = match[2].toLowerCase()
                const paramString = match[3].trim()
                const params = paramString.match(/"[^"]*"|\S+/g) || []
                let addSequence = false
                if (cmd === 'reset') {
                    bytecode.push(async () => {
                        await api.reset()
                        return 1
                    })
                } else if (cmd === 'restore') {
                    bytecode.push(async () => {
                        await api.restore()
                        return 1
                    })
                } else if (cmd === 'goto') {
                    const x = parseInteger(global, params[0])
                    const y = parseInteger(global, params[1])
                    bytecode.push(async () => {
                        await api.goto(x(),y())
                        return 1
                    })
                } else if (cmd === 'move') {
                    const x = parseInteger(global, params[0])
                    const y = parseInteger(global, params[1])
                    bytecode.push(async () => {
                        await api.move(x(),y())
                        return 1
                    })
                } else if (cmd === 'crlf') {
                    bytecode.push(async () => {
                        await api.crlf()
                        return 1
                    })
                } else if (cmd === 'cr') {
                    bytecode.push(async () => {
                        await api.cr()
                        return 1
                    })
                } else if (cmd === 'read') {
                    const k = params[0]
                    let limit
                    let counter = 0
                    if (params[1]) {
                        limit = parseInteger(global, params[1])
                    }
                    bytecode.push(async () => {
                        const char = await api.read()
                        if (!limit) {
                            global.set(k, char)
                            counter = 0
                            return 1
                        }  else if (counter >= limit()) {
                            await api.move(-(limit()), 0)
                            counter = 0
                            return 1
                        } else {
                            if (counter == 0) {
                                global.set(k, char)
                            } else {
                                let t = global.get(k) || ''
                                global.set(k, `${t}${char}`)
                            }
                            await api.move(1, 0)
                        }   
                        counter++
                        return 0
                    })
                } else if (cmd === 'prepend') {
                    const k = params[0]
                    const p = parseString(params[1])
                    bytecode.push(async () => {
                        let val = ''
                        if (global.has(k)) val = global.get(k) || ''
                        global.set(k, `${p()}${val}`)
                        return 1
                    })
                } else if (cmd === 'append') {
                    const k = params[0]
                    const p = parseString(global, params[1])
                    bytecode.push(async () => {
                        let val = ''
                        if (global.has(k)) val = global.get(k) || ''
                        global.set(k, `${val}${p()}`)
                        return 1
                    })
                } else if (cmd === 'lt') {
                    const a = parse(global, params[0])
                    const b = parse(global, params[1])
                    addSequence = true
                    bytecode.push(async () => {
                        if (a() < b()) return 1
                        console.log('not lt',currentIndex, targets.get(currentIndex))
                        index = targets.get(currentIndex)
                        return 0
                    })
                } else if (cmd === 'lte') {
                    const a = parse(global, params[0])
                    const b = parse(global, params[1])
                    addSequence = true
                    bytecode.push(async () => {
                        if (a() <= b()) return 1
                        index = targets.get(currentIndex)
                        return 0
                    })
                } else if (cmd === 'gt') {
                    const a = parse(params[0])
                    const b = parse(params[1])
                    addSequence = true
                    bytecode.push(async () => {
                        if (a() > b()) return 1
                        index = targets.get(currentIndex)
                        return 0
                    })
                } else if (cmd === 'gte') {
                    const a = parse(global, params[0])
                    const b = parse(global, params[1])
                    addSequence = true
                    bytecode.push(async () => {
                        if (a() >= b()) return 1
                        index = targets.get(currentIndex)
                        return 0
                    })
                } else if (cmd === 'eq') {
                    const a = parse(global, params[0])
                    const b = parse(global, params[1])
                    addSequence = true
                    bytecode.push(async () => {
                        if (a().toString() === b().toString()) return 1
                        index = targets.get(currentIndex)
                        return 0
                    })
                } else if (cmd === 'neq') {
                    const a = parse(global, params[0])
                    const b = parse(global, params[1])
                    addSequence = true
                    bytecode.push(async () => {
                        if (a().toString() !== b().toString()) return 1
                        index = targets.get(currentIndex)
                        return 0
                    })
                } else if (cmd === 'add') {
                    const k = params[0]
                    const b = parseInteger(global, params[1])
                    bytecode.push(async () => {
                        let val = 0
                        if (global.has(k)) val = parseInt(global.get(k)) || 0
                        val += parseInt(b())
                        global.set(k, val.toString())
                        return 1
                    })
                } else if (cmd === 'sub') {
                    const k = params[0]
                    const b = parseInteger(global, params[1])
                    bytecode.push(async () => {
                        let val = 0
                        if (global.has(k)) val = parseInt(global.get(k)) || 0
                        val -= b()
                        global.set(k, val.toString())
                        return 1
                    })
                } else if (cmd === 'mult') {
                    const k = params[0]
                    const b = parseInteger(global, params[1])
                    bytecode.push(async () => {
                        let val = 0
                        if (global.has(k)) val = parseInt(global.get(k)) || 0
                        console.log('mult', k, val, b())
                        val *= b()
                        global.set(k, val.toString())
                        return 1
                    })
                } else if (cmd === 'div') {
                    const k = params[0]
                    const b = parseInteger(global, params[1])
                    bytecode.push(async () => {
                        let val = 0
                        if (global.has(k)) val = parseInt(global.get(k)) || 0
                        val /= b()
                        global.set(k, Math.round(val).toString())
                        return 1
                    })
                } else if (cmd === 'fontsize') {
                    const f = parseInteger(global, params[0])
                    bytecode.push(async () => {
                        await api.fontsize(f())
                        return 1
                    })
                } else if (cmd === 'blink') {
                    const b = parseBool(global, params[0])
                    bytecode.push(async () => {
                        await api.blink(b())
                        return 1
                    })
                } else if (cmd === 'feed') {
                    const x = parseInteger(global, params[0])
                    const y = parseInteger(global, params[1])
                    bytecode.push(async () => {
                        await api.feed(x(), y())
                        return 1
                    })
                } else if (cmd === 'set') {
                    const k = params[0]
                    const v = parse(global, params[1])
                    bytecode.push(async () => {
                        global.set(k, v())
                        return 1
                    })
                } else if (cmd === 'proc') {
                    const k = params[0]
                    addSequence = true
                    if (k) proc.set(k, currentIndex)
                    bytecode.push(async () => {
                        return 1    
                    })
                } else if (cmd === 'jump') {
                    const k = params[0]
                    bytecode.push(async () => {
                        if (proc.has(k)) {
                            index = proc.get(k)
                            return 0
                        } 
                        return 1
                    })
                } else if (cmd === 'wait') {
                    if (params[0]) {
                        let time = parseInteger(global, params[0])
                        bytecode.push(async () => {
                            const timeout = ()=>{return new Promise(resolve => setTimeout(resolve, time()))}
                            await timeout()
                            return 1
                        })
                    }
                } else if (cmd === 'repeat') {
                    const infinite = !params[0]
                    let limit
                    let counter = 0
                    if (!infinite) {
                        limit = parseInteger(global, params[0]) 
                    }
                    const target = findSequenceStart(indent)
                    bytecode.push(async () => {
                        if (!infinite && ++counter >= limit()) {
                            counter = 0
                            return 1
                        }
                        index = target
                        return 0
                    })
                } else if (cmd === 'print') {
                    const s = parse(global, paramString)
                    let printIndex = 0
                    bytecode.push(async () => {
                        const str = s().toString()
                        if (printIndex >= str.length) {
                            printIndex = 0
                            return 1
                        }
                        const char = str[printIndex]
                        if (char === ' ') await api.space()
                        else if (/^\S$/.test(char)) await api.type(char)
                        printIndex++
                        return 0
                    })
                }
                if (indent < previousRowIndent) {
                    end(currentIndex, indent)
                }
                if (addSequence) {
                    begin(currentIndex, indent)
                } 
                previousRowIndent = indent
            }
        }) 
        end(bytecode.length, -1)    
        return async () => {    
            if (index >= bytecode.length) return false
            const it = await bytecode[index]()
            index += it
            return true
        }
    })()
}