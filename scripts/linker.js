import { symlink, stat, mkdir } from 'fs/promises'
import path from 'path'

const libPath = 'src/lib/'
const files = [
    'node_modules/socket.io/client-dist/socket.io.esm.min.js',
    'node_modules/socket.io/client-dist/socket.io.esm.min.js.map'
]


async function link(filepath) {
    console.log(`linking ${filepath}`)

    // The actual symlink entity in the file system
    const from = path.resolve(libPath, path.basename(filepath))
    console.log(`Symlink will be created at ${from}`)

    // Where the symlink should point to
    const absoluteTarget = path.resolve(filepath)
    const relativeTarget = path.relative(
        path.dirname(from),
        absoluteTarget
    )
    try {
        await symlink(
            relativeTarget,   
            from
        )
    } catch(err) {
        console.log(`Error creating symlink to ${relativeTarget}`)
    }
}

(async function() {
    console.log("linker started")
    let pathExists = false
    try {
        pathExists = await stat(libPath)
    } catch(err) {
        if (err.code === 'ENOENT') {
            console.log(`${libPath} does not exist`)
        }
    }
    
    if (!pathExists) {
        try {
            await mkdir(libPath)
            pathExists = true
        } catch(err) {
            console.log(`Error creating ${libPath}`)
        }
    }

    if (!pathExists) return

    await Promise.allSettled(files.map(filepath => link(filepath)))
    console.log("linker done")
  
})()