import React from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'

export default function TermsAndConditions () {

  if(VERBOSE) console.debug('render TermsAndConditions')
  return <>
    <main className={'mt-3 mb-3'} data-title={'TermsAndConditions'}>
      <Container>
        <Row>
          <Col><h1><Trans i18nKey={'pages.terms.title'} /></h1></Col>
        </Row>
        <Row>
          <Col className={'mt-3'}>

            <Card>
              <Card.Header><h2><Trans i18nKey={'pages.terms.privacy-title'} /></h2></Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={'pages.terms.privacy-text'} />
                </Card.Text>
              </Card.Body>
            </Card>

            <Card className={'mt-3'}>
              <Card.Header><h2><Trans i18nKey={'pages.terms.cookies-title'} /></h2></Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={'pages.terms.cookies-text'} />
                </Card.Text>
              </Card.Body>
            </Card>

          </Col>
        </Row>
      </Container>
    </main>
  </>

}