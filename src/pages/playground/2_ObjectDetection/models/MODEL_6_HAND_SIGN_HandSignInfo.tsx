import { useState, useEffect } from 'react'
import N4LModal from '@components/modal/N4LModal'
import { Container, Row, Col, Button, ButtonGroup, Tabs, Tab } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import { ASL_bibtex, SSL_bibtex } from './MODEL_6_HAND_SIGN_INFO'

export function HandSignInfo() {
  const [showModal, setShowModal] = useState(false)
  const [localLanguage, setLocalLanguage] = useState(localStorage.getItem('language') ?? 'en')

  useEffect(() => {
    function checkUserData() {
      const item = localStorage.getItem('language')
      if (item) {
        setLocalLanguage(item)
      }
    }
    window.addEventListener('storage', checkUserData)
    return () => {
      window.removeEventListener('storage', checkUserData)
    }
  }, [])


  const title = <>
    <h3><Trans i18nKey={'Info Hand sign'} /></h3>
  </>

  const onSelect = (k: string | null) => {
    if (!k) {
      console.error('Error onSelect language tabs')
      return
    }
    setLocalLanguage(k)
  }

  const body = <>
    <Tabs
      defaultActiveKey='en'
      activeKey={localLanguage}
      onSelect={onSelect}
      id="tab-SL"
      className="mb-3">
      <Tab eventKey="en" title={<Trans i18nKey={'ASL'} />}>
        <Container fluid={true}>
          <Row>
            <Col xs={12} md={8}>
              <div className="d-flex justify-content-center">
                <img className="w-100 object-fit-cover border rounded" src={import.meta.env.VITE_PATH + '/assets/handsign/ASL.png'} alt="ASL" />
              </div>
            </Col>
            <Col xs={12} md={4}>
              <pre>{ASL_bibtex}</pre>
            </Col>
          </Row>
        </Container>
      </Tab>
      <Tab eventKey="es" title={<Trans i18nKey={'SSL'} />}>
        <Container fluid={true}>
          <Row>
            <Col xs={12} md={8}>
              <div className="d-flex justify-content-center">
                <img className="w-100 object-fit-cover border rounded" src={import.meta.env.VITE_PATH + '/assets/handsign/SSL.png'} alt="SSL" />
              </div>
            </Col>
            <Col xs={12} md={4}>
              <pre>{SSL_bibtex}</pre>
            </Col>
          </Row>
        </Container>
      </Tab>
    </Tabs>

  </>
  return <>
    <ButtonGroup className="d-flex">
      <Button
        onClick={() => { setShowModal(!showModal) }}
        size={'sm'}
        variant={'outline-primary'}
        className="btn-block mr-1 mt-1 btn-lg"
      >
        <Trans i18nKey={'Info'} />
      </Button>
    </ButtonGroup>
    <N4LModal
      showModal={showModal}
      setShowModal={setShowModal}
      size='xl'
      fullscreen={'md-down'}
      centered={true}
      title={title}
      ComponentBody={body}
      ComponentFooter={<></>}
    />
  </>
}
