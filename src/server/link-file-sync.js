import { lstatSync, symlinkSync } from 'fs'
import { dirname, relative } from 'path'

export default function linkFileSync(from, to) {
    let stats
    try {
        stats = lstatSync(from)
    } catch (err) {
        if(err.code === 'ENOENT') {
            console.log("Symlink does not exist")
        } else {
            console.log(err)
        }
    }
    if (!stats) {
        console.log("Adding Symlink", to)
        const relativeTarget = relative(dirname(from), to)
        try {
            symlinkSync(
                relativeTarget,   
                from
            )
        } catch (err) {
            console.log(err)
        }
    } else {
        console.log("Symlink already exists")
    }
}
