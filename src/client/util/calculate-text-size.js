export default function calculateTextSize(text, parent, cls) {
    const el = document.createElement('div')
    parent = parent || document.body
    if (cls) el.classList.add(cls)
    el.style.position = 'absolute'
    el.style.left = 0
    el.style.top = 0
    el.style.opacity = 0
    el.textContent = text
    parent.appendChild(el)
    const width = el.clientWidth
    const height = el.clientHeight
    parent.removeChild(el)
    return {width, height}
}