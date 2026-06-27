import { useEffect, useState } from 'react'

// Jam lokal Yogyakarta (WIB) yang jalan tiap detik.
export default function Clock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="nav__clock" aria-hidden="true">
      <span className="nav__clock-dot" />
      Yogyakarta · {time} WIB
    </span>
  )
}
