import 'katex/dist/katex.min.css'
import React from 'react'
import { Accordion, Col, Container, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import Glossary1Optimizers from './Glossary1Optimizers'
import Glossary2ActivationFunctions from './Glossary2ActivationFunctions'
import Glossary3LossFunctions from './Glossary3LossFunctions'
import Glossary4MetricFunctions from './Glossary4MetricFunctions'
import { VERBOSE } from '@/CONSTANTS'
import N4LDivider from '@components/divider/N4LDivider'
import GlossaryEditor from '@pages/glossary/GlossaryEditor'

export default function Glossary () {

  const { t } = useTranslation()

  if (VERBOSE) console.debug('render Glossary')
  return <>
    <main className={'mb-3'} data-title={'Glossary'}>
      <Container>
        <Row className={'mt-3'}>
          <Col>
            <h1><Trans i18nKey={'pages.glossary.title'} t={t} /></h1>
          </Col>
        </Row>

        {/* INFORMACIÓN */}
        <Row className={'mt-3'}>
          <Col>
            <N4LDivider i18nKey={'hr.tasks'} />

            <Accordion defaultValue={'classification-tabular'}>
              <Accordion.Item eventKey={'classification-tabular'}>
                <Accordion.Header><h2><Trans i18nKey={'pages.glossary.tabular-classification.title'} /></h2></Accordion.Header>
                <Accordion.Body>
                  <p><Trans i18nKey={'pages.glossary.tabular-classification.text-1'} /></p>
                  <p><Trans i18nKey={'pages.glossary.tabular-classification.text-2'} /></p>
                  <p><Trans i18nKey={'pages.glossary.tabular-classification.text-3'} /></p>
                  <p><Trans i18nKey={'pages.glossary.tabular-classification.text-4'} /></p>
                </Accordion.Body>
              </Accordion.Item>
              {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&
                <Accordion.Item eventKey={'linear-regression'}>
                  <Accordion.Header><h2><Trans i18nKey={'pages.glossary.linear-regression.title'} /></h2></Accordion.Header>
                  <Accordion.Body>
                    <p><Trans i18nKey={'pages.glossary.linear-regression.text.0'} /></p>
                    <p><Trans i18nKey={'pages.glossary.linear-regression.text.1'} /></p>
                    <p><Trans i18nKey={'pages.glossary.linear-regression.text.2'} /></p>
                    <p><Trans i18nKey={'pages.glossary.linear-regression.text.3'} /></p>
                  </Accordion.Body>
                </Accordion.Item>
              }
              <Accordion.Item eventKey={'classification-imagen'}>
                <Accordion.Header><h2><Trans i18nKey={'pages.glossary.image-classification.title'} /></h2></Accordion.Header>
                <Accordion.Body>
                  <p><Trans i18nKey={'pages.glossary.image-classification.text-1'} /></p>
                  <p><Trans i18nKey={'pages.glossary.image-classification.text-2'} /></p>
                  <p><Trans i18nKey={'pages.glossary.image-classification.text-3'} /></p>
                  <p><Trans i18nKey={'pages.glossary.image-classification.text-4'} /></p>
                  <p><Trans i18nKey={'pages.glossary.image-classification.text-5'} /></p>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey={'objects-detection'}>
                <Accordion.Header><h2><Trans i18nKey={'pages.glossary.object-identification.title'} /></h2></Accordion.Header>
                <Accordion.Body>
                  <p><Trans i18nKey={'pages.glossary.object-identification.text-1'} /></p>
                  <p><Trans i18nKey={'pages.glossary.object-identification.text-2'} /></p>
                  <p><Trans i18nKey={'pages.glossary.object-identification.text-3'} /></p>
                  <p><Trans i18nKey={'pages.glossary.object-identification.text-4'} /></p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            <N4LDivider i18nKey={'hr.editor'} />
            <GlossaryEditor />

             {/* Funciones de optimización */}
            <N4LDivider i18nKey={'hr.optimization-function'} />
            <Glossary1Optimizers />

            {/* Funciones de activación */}
            <N4LDivider i18nKey={'hr.activation-functions'} />
            <Glossary2ActivationFunctions />

            {/* Funciones de perdida */}
            <N4LDivider i18nKey={'hr.loss-functions'} />
            <Glossary3LossFunctions />

            {/* Funciones de métricas */}
            <N4LDivider i18nKey={'hr.metric-function'} />
            <Glossary4MetricFunctions />

            {/* Layers */}
            {/*<Glossary5Layers />*/}
          </Col>
        </Row>
      </Container>
    </main>
  </>

}