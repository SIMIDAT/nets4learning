import React from 'react'
import { Modal } from 'react-bootstrap'

export default function N4LModal ({ showModal, setShowModal, size='lg', fullscreen=false, centered=false, title = '', ComponentBody = <></>, ComponentFooter = <></> }) {
  return <>
    <Modal show={showModal}
           size={size}
           fullscreen={fullscreen}
           centered={centered}
           onHide={() => {setShowModal(false)}}>
      {/*<Modal.Dialog>*/}

      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {ComponentBody}
      </Modal.Body>

      <Modal.Footer>
        {ComponentFooter}
      </Modal.Footer>

      {/*</Modal.Dialog>*/}
    </Modal>
  </>
}
