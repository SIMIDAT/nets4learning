import { Card, Col, Container, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import N4LLatex from '@components/latex/N4LLatex'

const prefix = 'pages.regression-description.'

/** Qué es la regresión lineal, con un ejemplo y su ecuación (/playground/description-regression) */
export default function DescriptionRegression() {
  const { t } = useTranslation()
  // Varios párrafos por clave; sin traducciones (cargando, en las pruebas) i18next devuelve la clave: nada que listar
  const list = (key: string): string[] => {
    const value: unknown = t(prefix + key, { returnObjects: true })
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }

  return <>
    <Container className={'mt-3 mb-3'} data-testid={'Test-DescriptionLinearRegression'}>
      <Row>
        <Col>
          <h1>{t(prefix + 'title')}</h1>
          <Card className={'mt-3'}>
            <Card.Header>
              <h2>{t(prefix + 'subtitle')}</h2>
            </Card.Header>
            <Card.Body>
              {list('paragraphs').map((text) => <p key={text}>{text}</p>)}
              <hr />
              <p><N4LLatex>{t(prefix + 'example')}</N4LLatex></p>
              <N4LLatex>{'$$ Y = \\beta_0 + \\beta_1 * x + \\epsilon $$'}</N4LLatex>
              <p className={'mb-1'}>{t(prefix + 'where')}</p>
              <ul className={'list-unstyled'}>
                {list('terms').map((text) => <li key={text}><N4LLatex>{text}</N4LLatex></li>)}
              </ul>
              {list('closing').map((text) => <p key={text}><N4LLatex>{text}</N4LLatex></p>)}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  </>
}
