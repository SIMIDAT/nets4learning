import * as tfVis from '@tensorflow/tfjs-vis'
import { Button, Card, Col, Row } from 'react-bootstrap'
import { VERBOSE } from '@/CONSTANTS'

export default function DebugLoadCSV () {
  const _isDebug = import.meta.env.VITE_ENVIRONMENT !== 'production'

  const handleClick_Layers = async () => {

  }

  const handleClick_Compile = async () => {

  }

  const handleClick_Fit = async () => {

  }

  const handleClick_debug_ALL = async () => {

  }

  const handleClick_Download = () => {

  }

  if (VERBOSE) console.debug('render DebugLoadCSV')
  return <>
    {
      (_isDebug) &&
      <Row className={'mt-3'}>
        <Col>
          <Card>
            <Card.Header><h2>Debug</h2></Card.Header>
            <Card.Body>
              <Card.Title>Pruebas modelo</Card.Title>


              <div className="d-grid gap-2 mt-3">
                <Button variant="primary"
                        size={'sm'}
                        type={'button'}
                        onClick={async () => {
                          console.log('TODO')
                        }}>
                  Debug
                </Button>
                <Button variant="primary"
                        type={'button'}
                        onClick={async () => {
                          await handleClick_debug_ALL()
                        }}
                        size={'sm'}>
                  CLEAR DATA
                </Button>
                <hr />

                <Button variant={'outline-primary'}
                        size={'sm'}
                        type={'button'}
                        onClick={() => tfVis.visor().toggle()}
                >
                  Conmutar visor
                </Button>
                <Button variant={'outline-secondary'}
                        size={'sm'}
                        type={'button'}
                        onClick={() => handleClick_Layers}>
                  Definir capas
                </Button>
                <Button variant={'outline-warning'}
                        size={'sm'}
                        type="button"
                        onClick={() => handleClick_Compile}>
                  Compilar
                </Button>
                <Button size={'sm'}
                        variant={'outline-danger'}
                        type={'button'}
                        onClick={() => handleClick_Fit}>
                  Entrenar
                </Button>
                <Button variant={'outline-success'}
                        size={'sm'}
                        type={'button'}
                        onClick={() => handleClick_Download}>
                  Descargar
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    }
  </>
}