import './CookiesModal.css'
import React, { useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { Trans } from 'react-i18next'

export default function CookiesModal () {
  const [show, setShow] = useState(false)

  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return false
  }

  const setCookie = (name, value, expiration_days) => {
    const d = new Date()
    d.setTime(d.getTime() + (expiration_days * 24 * 60 * 60 * 1000))
    let expires = 'expires=' + d.toUTCString()
    document.cookie = name + '=' + value + ';' + expires + ';path=/'
  }

  const installCookie = () => {
    setCookie('n4l-accept-cookies', 'true', 120)
  }

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)
  const handleAccept = () => {
    installCookie()
    handleClose()
  }

  useEffect(() => {
    if (!(getCookie('n4l-accept-cookies') === 'true')) handleShow()
  }, [])

  return (
    <>
      <Modal show={show}
             className={'n4l-cookies'}
             onHide={handleClose}
             backdrop="static"
             size="lg">
        <Modal.Header>
          <Modal.Title>
            <Trans i18nKey={'cookies-policies.title'} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Trans i18nKey={'cookies-policies.text-0'} />
          <br />
          <br />
          <Trans i18nKey={'cookies-policies.text-1'} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant={'primary'}
                  onClick={handleAccept}>
            <Trans i18nKey={'cookies-policies.accept'} />
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}