export default function quadrantCoord(val, size) {
    return Math.round((val-size/2)/size)
}