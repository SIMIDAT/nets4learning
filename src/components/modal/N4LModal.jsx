import { Modal } from 'react-bootstrap'

export default function N4LModal ({ showModal, setShowModal, title = '', ComponentBody = <></>, ComponentFooter = <></> }) {
  return <>
    <Modal show={showModal}
           size={'lg'}
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