
import crypto from 'crypto'
export default function randomString(len = 48) {
    return crypto.randomBytes(len).toString('hex')
}
