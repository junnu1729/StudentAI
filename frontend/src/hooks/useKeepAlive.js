import { useEffect } from 'react'

const BACKEND = 'https://studentai-pkmj.onrender.com'

// Ping the backend every 5 minutes to prevent Render free tier from sleeping
export default function useKeepAlive() {
  useEffect(() => {
    const ping = () => fetch(`${BACKEND}/api/notes/`).catch(() => {})
    ping() // ping immediately on load
    const interval = setInterval(ping, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
}
