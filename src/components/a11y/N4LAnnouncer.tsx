import { useEffect, useState } from 'react'

import { subscribeAnnouncements } from '@core/a11y/announce'

/** Lo que se espera entre vaciar la región y poner el mensaje: así se anuncia también uno igual al anterior */
const RESET_MS = 100

/**
 * La región (oculta) en la que el lector de pantalla oye lo que se anuncia con `announce()`. Lo que llega casi a la vez
 * (borrar una capa y que se arregle su aviso) se dice junto: si no, el último taparía a los demás
 */
export default function N4LAnnouncer() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    let timer = 0
    let pending: string[] = []
    const unsubscribe = subscribeAnnouncements((next) => {
      if (pending.at(-1) !== next) pending.push(next)
      setMessage('')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        setMessage(pending.join(' '))
        pending = []
      }, RESET_MS)
    })
    return () => {
      unsubscribe()
      window.clearTimeout(timer)
    }
  }, [])
  return (
    <div className={'visually-hidden'} role={'status'} aria-live={'polite'} aria-atomic={true} data-testid={'Test-Announcer'}>
      {message}
    </div>
  )
}
