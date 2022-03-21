export default function debounce(fn, delay) {
	let timeout
	return () => {
        let args = arguments
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(()=>{
            fn(...args)
            timeout = null
        }, delay)
	}
}