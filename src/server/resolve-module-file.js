import { existsSync } from 'fs'
import { resolve } from 'path'
export default function resolveModuleFile(base, filepath) {
    let result = resolve(base, 'node_modules', filepath)
    if (existsSync(result)) {
        return result
    } else if (base !== '/') {
        return resolveModuleFile(resolve(base, '..'), filepath)
    }
    return null
}
