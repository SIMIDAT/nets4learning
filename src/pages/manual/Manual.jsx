import 'katex/dist/katex.min.css'
import React, { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Col, Container, Row } from 'react-bootstrap'

import N4LDivider from '@components/divider/N4LDivider'
import N4LMarkdownDownloader from '@components/markdown/N4LMarkdownDownloader'

import ManualDescription from '@pages/manual/ManualDescription'
import { VERBOSE } from '@/CONSTANTS'
import { MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'

const DEFAULT_LAYOUT = [
  {
    i18n_hr: 'hr.tutorial-00-tabular-classification',
    files  : [
      {
        key   : '00-tabular-classification-upload-and-process',
        action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS,
        file  : {
          i18n_title: 'pages.manual.00-tabular-classification.upload-and-process.title',
          file_name : '00. Tabular Classification - Step 0. Upload and process dataset.md',
        },
      },
      {
        key   : '00-tabular-classification-dataset',
        action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET,
        file  : {
          i18n_title: 'pages.manual.00-tabular-classification.dataset.title',
          file_name : '00. Tabular Classification - Step 1. Dataset.md',
        },
      },
      {
        key   : '00-tabular-classification-layer-design',
        action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN,
        file  : {
          i18n_title: 'pages.manual.00-tabular-classification.layer-design.title',
          file_name : '00. Tabular Classification - Step 2. Layer Design.md',
        },
      },
      {
        key   : '00-tabular-classification-editor-layers',
        action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_LAYERS,
        file  : {
          i18n_title: 'pages.manual.00-tabular-classification.editor-layers.title',
          file_name : '00. Tabular Classification - Step 3. Editor Layers.md',
        },
      },
      {
        key   : '00-tabular-classification-editor-hyperparameters',
        action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_4_HYPERPARAMETERS,
        file  : {
          i18n_title: 'pages.manual.00-tabular-classification.editor-hyperparameters.title',
          file_name : '00. Tabular Classification - Step 4. Editor Hyperparameters.md',
        },
      },
      {
        key   : '00-tabular-classification-table-models',
        action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_5_TABLE_OF_MODELS,
        file  : {
          i18n_title: 'pages.manual.00-tabular-classification.table-models.title',
          file_name : '00. Tabular Classification - Step 5. Table models.md',
        },
      },
      {
        key   : '00-tabular-classification-predict',
        action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_6_PREDICT,
        file  : {
          i18n_title: 'pages.manual.00-tabular-classification.prediction.title',
          file_name : '00. Tabular Classification - Step 6. Predict.md',
        },
      },
    ],
  },
]
export default function Manual () {

  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [accordionActiveManual, setAccordionActiveManual] = useState([])

  const toggleAccordionActiveManual = useCallback((itemActive) => {
    if (VERBOSE) console.debug('useCallback -> toggleAccordionActiveManual')
    setAccordionActiveManual((prevActive) => {
      if (prevActive.includes(itemActive)) {
        return prevActive.filter((item) => item !== itemActive)
      } else {
        return [...prevActive, itemActive]
      }
    })
  }, [setAccordionActiveManual])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[history, toggleAccordionActiveManual]')
    const openManualInSection = (action) => {
      for (const { files } of DEFAULT_LAYOUT) {
        for (const file of files) {
          if (file.action === action) {
            toggleAccordionActiveManual(file.key)
          }
        }
      }
    }
    console.log({s: location})
    if (location.state?.action) {
      openManualInSection(location.state.action)
    }
  }, [location, toggleAccordionActiveManual])

  if (VERBOSE) console.debug('render Manual')
  return (<>
    <main className={'mb-3'} data-title={'Manual'}>
      <Container>
        <Row className={'mt-3'}>
          <Col>
            <h1><Trans i18nKey={'pages.manual.title'} t={t} /></h1>
          </Col>
        </Row>
        <Row className={'mt-3'}>
          <Col>
            <ManualDescription />
            <N4LDivider i18nKey={'hr.tasks'} />
            <Accordion className={'mt-3'}>
              <Accordion.Item eventKey={'manual-0-tabular-classification'}>
                <Accordion.Header><h2><Trans i18nKey={'pages.manual.0-tabular-classification.title'} /></h2>
                </Accordion.Header>
                <Accordion.Body>
                  <h4><Trans i18nKey={'pages.manual.0-tabular-classification.1-title'} /></h4>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.1-description-1'} /></p>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.1-description-2'} /></p>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.1-description-3'} /></p>
                  <hr />
                  <h4><Trans i18nKey={'pages.manual.0-tabular-classification.2-title'} /></h4>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.2-description-1'} /></p>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.2-description-2'} /></p>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.2-description-3'} /></p>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.2-description-4'} /></p>
                  <p><Trans i18nKey={'pages.manual.0-tabular-classification.2-description-5'} /></p>
                </Accordion.Body>
              </Accordion.Item>
              {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' && <Accordion.Item eventKey={'manual-1-regression'}>
                <Accordion.Header><h2><Trans i18nKey={'pages.manual.1-regression.title'} /></h2>
                </Accordion.Header>
                <Accordion.Body>
                  <h4><Trans i18nKey={'pages.manual.1-regression.1-title'} /></h4>
                  <p><Trans i18nKey={'pages.manual.1-regression.1-description.0'} /></p>
                  {/*TODO*/}
                  {/*<p><Trans i18nKey={'pages.manual.1-regression.1-description.1'} /></p>*/}
                  {/*<p><Trans i18nKey={'pages.manual.1-regression.1-description.2'} /></p>*/}
                  <hr />
                  <h4><Trans i18nKey={'pages.manual.1-regression.2-title'} /></h4>
                  <p><Trans i18nKey={'pages.manual.1-regression.2-description.0'} /></p>
                  <p><Trans i18nKey={'pages.manual.1-regression.2-description.1'} /></p>
                  <p><Trans i18nKey={'pages.manual.1-regression.2-description.2'} /></p>
                  <p><Trans i18nKey={'pages.manual.1-regression.2-description.3'} /></p>
                  <p><Trans i18nKey={'pages.manual.1-regression.2-link'}
                            components={{
                              link1: <a href={'https://www.ugr.es/~jsalinas/apuntes/C5.pdf'}
                                        target={'_blank'}
                                        rel={'noreferrer'}
                                        className={'text-info'}>link</a>,
                            }} /></p>
                </Accordion.Body>
              </Accordion.Item>}
              <Accordion.Item eventKey={'manual-2-object-identification'}>
                <Accordion.Header><h2><Trans i18nKey={'pages.manual.2-object-identification.title'} /></h2>
                </Accordion.Header>
                <Accordion.Body>
                  <h4><Trans i18nKey={'pages.manual.2-object-identification.1-title'} /></h4>
                  <p><Trans i18nKey={'pages.manual.2-object-identification.1-description-1'} /></p>
                  <p><Trans i18nKey={'pages.manual.2-object-identification.1-description-2'} /></p>
                  <ol>
                    <li><Trans i18nKey={'pages.manual.2-object-identification.1-list.0'} /></li>
                    <li><Trans i18nKey={'pages.manual.2-object-identification.1-list.1'} /></li>
                    <li><Trans i18nKey={'pages.manual.2-object-identification.1-list.2'} /></li>
                    <li><Trans i18nKey={'pages.manual.2-object-identification.1-list.3'} /></li>
                  </ol>
                  <p><Trans i18nKey={'pages.manual.2-object-identification.1-description-3'} /></p>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey={'manual-3-image-classification'}>
                <Accordion.Header><h2><Trans i18nKey={'pages.manual.3-image-classification.title'} /></h2>
                </Accordion.Header>
                <Accordion.Body>
                  <h4><Trans i18nKey={'pages.manual.3-image-classification.1-title'} /></h4>
                  <p><Trans i18nKey={'pages.manual.3-image-classification.1-description-1'} /></p>
                  <ol>
                    <li><Trans i18nKey={'pages.manual.3-image-classification.1-list.0'} /></li>
                    <li><Trans i18nKey={'pages.manual.3-image-classification.1-list.1'} /></li>
                  </ol>
                  <p><Trans i18nKey={'pages.manual.3-image-classification.1-description-2'} /></p>
                  <p><Trans i18nKey={'pages.manual.3-image-classification.1-description-3'} /></p>
                  <p><Trans i18nKey={'pages.manual.3-image-classification.1-description-4'} /></p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {DEFAULT_LAYOUT.map(({ i18n_hr, files }, index) => {
              return <Row key={index}>
                <Col>
                  <N4LDivider i18nKey={i18n_hr} />
                  <Accordion className={'mt-3'} defaultActiveKey={[]} activeKey={accordionActiveManual}>
                    {files.map(({ key, file }, index_2) => {
                      return <Accordion.Item key={index_2} eventKey={key}>
                        <Accordion.Header onClick={() => toggleAccordionActiveManual(key)}>
                          <h2><Trans i18nKey={file.i18n_title} /></h2>
                        </Accordion.Header>
                        <Accordion.Body>
                          <N4LMarkdownDownloader base={`${process.env.REACT_APP_PATH}/docs/${i18n.language}/`}
                                                 file_name={file.file_name} />
                        </Accordion.Body>
                      </Accordion.Item>
                    })}
                  </Accordion>
                </Col>
              </Row>
            })}

          </Col>
        </Row>
      </Container>
    </main>
  </>)
}
