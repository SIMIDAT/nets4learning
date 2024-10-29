import React from 'react'
import { Modal } from 'react-bootstrap'

/**
 * @typedef N4LModalProps_t
 * @property {boolean} showModal
 * @property {Function} [setShowModal]
 * @property {string | 'lg'| 'sm' | 'xl'} [size = 'lg']
 * @property {boolean} [fullscreen = false]
 * @property {boolean} [centered = false]
 * @property {string | JSX.Element} [title = '']
 * @property {JSX.Element} [ComponentBody = []]
 * @property {JSX.Element} [ComponentFooter = []]
 */

/**
 * 
 * @param {N4LModalProps_t} props
 * @returns 
 */
export default function N4LModal (props) {

  const { 
    showModal, 
    setShowModal, 
    size = 'lg', 
    fullscreen = false, 
    centered = false, 
    title = '', 
    ComponentBody = <></>, 
    ComponentFooter = <></> 
  } = props

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
