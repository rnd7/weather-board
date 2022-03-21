export default function assignPrefixed(target, source, prefix = '_', force = false) {
    if (source && typeof source !== 'object') return
    if (target && typeof source !== 'object') return
    Object.keys(source).forEach((key)=>{
        const local = `${prefix}${key}`
        if (
            force
            || (
                target.hasOwnProperty(local)
                && typeof target[local] === typeof source[key]
            )
        ) {
            target[local] = source[key]
        } 
    })
}
