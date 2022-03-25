import { existsSync, mkdirSync } from 'fs'
export default function ensureDirectorySync(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir)
    }
}