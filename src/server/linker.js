import { existsSync, lstatSync, mkdirSync, readlinkSync, statSync, symlinkSync } from 'fs'
import { dirname, resolve, relative, basename } from 'path'
import { fileURLToPath } from 'url'


const __dirname = dirname(fileURLToPath(import.meta.url))
const __pkgroot = resolve(__dirname, '../..')

function resolveModuleFile(filepath, base) {
    let result = resolve(base, 'node_modules', filepath)
    if (existsSync(result)) {
        return result
    } else if (base !== '/') {
        return resolveModuleFile(filepath, resolve(base, '..'))
    }
    return null
}


export function linkModuleFile(filepath, libPath) {

    // ensure libPath
    if (!existsSync(libPath)) {
        mkdirSync(resolve(__pkgroot, libPath))
    }

    const resolvedPath = resolveModuleFile(filepath, __pkgroot)
    console.log(`Check for symlink ${resolvedPath}`)
    if (resolvedPath) {
        const from = resolve(__pkgroot, libPath, basename(filepath))
        let stats
        try {
            stats = lstatSync(from)
        } catch (err) {
            if(err.code === 'ENOENT') {
                console.log("symlink does not exist")
            } else {
                console.log(err)
            }
        }
      
        if (!stats) {
            console.log("Adding symlink")
            const relativeTarget = relative(
                dirname(from),
                resolvedPath
            )
            try {
                symlinkSync(
                    relativeTarget,   
                    from
                )
            } catch (err) {
                console.log(err)
            }
        } else {
            console.log("symlink exists")
        }
    }
}
