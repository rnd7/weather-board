export default function calculateCellColor(cell, ageLimit) {
    const now = Date.now()
    const f = Math.min(1, Math.max(0, 1-((now-cell.modified) / ageLimit)))
    const minBrightness = .1
    const maxBrightness = 1.
    const brightness = Math.floor(0xFF * (minBrightness + f * (maxBrightness-minBrightness)))
    return `rgb(${brightness},${brightness},${brightness})`
}