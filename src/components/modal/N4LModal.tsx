import type React from 'react'
import { Modal } from 'react-bootstrap'

/**
 * @typedef N4LModalProps_t
 * @property {boolean} showModal
 * @property {React.Dispatch<React.SetStateAction<boolean>>} [setShowModal]
 * @property {string | 'lg'| 'sm' | 'xl'} [size = 'lg']
 * @property {boolean} [fullscreen = false]
 * @property {boolean} [centered = false]
 * @property {string | JSX.Element} [title = '']
 * @property {JSX.Element} [ComponentBody = []]
 * @property {JSX.Element} [ComponentFooter = []]
 */

type N4LModalProps_t = {
  showModal      : boolean,
  setShowModal   : React.Dispatch<React.SetStateAction<boolean>>,
  size           : 'lg' | 'sm' | 'xl',
  fullscreen?    : string | true | 'sm-down' | 'md-down' | 'lg-down' | 'xl-down' | 'xxl-down',
  centered?      : boolean,
  title          : React.ReactNode,
  ComponentBody  : React.ReactNode,
  ComponentFooter: React.ReactNode
}
const DEFAULT_MODAL_PROPS: N4LModalProps_t = {
  showModal      : false,
  setShowModal   : () => {},
  size           : 'lg',
  fullscreen     : 'lg-down',
  centered       : false,
  title          : <></>,
  ComponentBody  : <></>,
  ComponentFooter: <></>
}
/**
 * 
 * @param {N4LModalProps_t} props
 * @returns 
 */
export default function N4LModal(props: N4LModalProps_t = DEFAULT_MODAL_PROPS) {

  const {
    showModal,
    setShowModal,
    size = 'lg',
    fullscreen = 'lg-down',
    centered = false,
    title = '',
    ComponentBody = <></>,
    ComponentFooter = <></>
  } = props

  return <>
    <Modal
      show={showModal}
      size={size}
      fullscreen={fullscreen}
      centered={centered}
      onHide={() => { setShowModal(false) }}>
      {/*<Modal.Dialog>*/}

      <Modal.Header closeButton>
        <Modal.Title>
          {title}
        </Modal.Title>
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
