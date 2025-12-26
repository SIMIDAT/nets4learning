import './CookiesModal.css'
import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { Trans } from 'react-i18next'

// Constante para evitar errores de escritura
const COOKIE_NAME = 'n4l-accept-cookies'
const COOKIE_EXPIRATION_DAYS = 120

// Utilidad para obtener cookies de forma segura en TS
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  if (match) return match[2]
  return null
}

// Utilidad para establecer cookies
const setCookie = (name: string, value: string, days: number) => {
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + d.toUTCString()
  // SameSite=Lax es recomendable hoy en día para seguridad básica
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`
}

export default function CookiesModal() {
  // Inicializamos el estado comprobando la cookie directamente.
  // Esto se ejecuta solo una vez al montar el componente.
  const [show, setShow] = useState<boolean>(() => {
    const cookieValue = getCookie(COOKIE_NAME)
    return cookieValue !== 'true'
  })

  const handleAccept = () => {
    setCookie(COOKIE_NAME, 'true', COOKIE_EXPIRATION_DAYS)
    setShow(false)
  }

  // Si la cookie ya existe y es true, no renderizamos nada (opcional, pero limpio)
  if (!show) return null

  return (
    <Modal
      show={show}
      className="n4l-cookies"
      // Evita cerrar al hacer clic fuera
      backdrop="static"
      // Evita cerrar con la tecla ESC (opcional, para forzar acción)
      keyboard={false}
      // Eliminamos onHide si queremos forzar al usuario a dar clic en "Aceptar"
      // Si quieres permitir cerrar sin aceptar, descomenta la siguiente línea:
      // onHide={() => setShow(false)} 
      size="lg"
      centered // Centra el modal verticalmente (buena práctica visual)
    >
      <Modal.Header>
        <Modal.Title>
          <Trans i18nKey="cookies-policies.title" />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          <Trans i18nKey="cookies-policies.text-0" />
        </p>
        <p>
          <Trans i18nKey="cookies-policies.text-1" />
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={handleAccept}>
          <Trans i18nKey="cookies-policies.accept" />
        </Button>
      </Modal.Footer>
    </Modal>
  )
}