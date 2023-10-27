import { Card, Col, Container, Row } from 'react-bootstrap'
import { useParams } from 'react-router'
import TestComponentAdvanced from '@components/TestComponentAdvanced'

export default function TestPageAdvanced () {

  const { id, option, example } = useParams()
  return <>
    <Container className={'mt-3'}>
      <Row>
        <Col>

          <Card>
            <Card.Header><h2>TestPage-Advanced</h2></Card.Header>
            <Card.Body>
              <p><span data-testid={'Test-TestPageAdvanced-id'}>{id}</span></p>
              <p><span data-testid={'Test-TestPageAdvanced-option'}>{option}</span></p>
              <p><span data-testid={'Test-TestPageAdvanced-example'}>{example}</span></p>

              <TestComponentAdvanced />

            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  </>
}