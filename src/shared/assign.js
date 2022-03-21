export default function assign(target, source, force = false, match = true) {
    if (source && typeof source !== 'object') return
    if (target && typeof source !== 'object') return
    Object.keys(source).forEach((key)=>{
        if (
            force
            || (
                target.hasOwnProperty(key)
                && (!match || typeof target[key] === typeof source[key])
            )
        ) {
            target[key] = source[key]
        } 
    })
}
