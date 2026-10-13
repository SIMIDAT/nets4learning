import type React from 'react'
import { useId } from 'react'
import { Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

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
export default function N4LModal(props: N4LModalProps_t = DEFAULT_MODAL_PROPS) {
  const { t } = useTranslation()
  // El diálogo se llama como su título (WCAG 4.1.2) y su botón de cerrar, en el idioma de la página
  const titleId = useId()

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
    <Modal aria-labelledby={titleId}
      show={showModal}
      size={size}
      fullscreen={fullscreen}
      centered={centered}
      onHide={() => { setShowModal(false) }}>
      {/*<Modal.Dialog>*/}

      <Modal.Header closeButton closeLabel={t('modal.close')}>
        <Modal.Title id={titleId}>
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
