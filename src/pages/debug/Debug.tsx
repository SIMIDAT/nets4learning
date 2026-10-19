import { Col, Container, Row } from 'react-bootstrap'
import { VERBOSE } from '@/CONSTANTS'
import BackendDiagnostics from './BackendDiagnostics'

export default function Debug() {

  if (VERBOSE) console.debug('render Debug')
  return (
    <>
      <Container className={'n4l-container-wide'}>
        <Row>
          <Col>
            <h1>Debug</h1>
            <BackendDiagnostics />
          </Col>
        </Row>
      </Container>
    </>
  )
}
