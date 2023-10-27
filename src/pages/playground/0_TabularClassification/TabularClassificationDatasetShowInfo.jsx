import React from 'react'
import { Col, Row } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'


export default function TabularClassificationDatasetShowInfo ({ datasets, datasetIndex }) {
  const prefix = 'pages.playground.generator.dataset.'

  if (VERBOSE) console.debug('render TabularClassificationDatasetShow')
  return <>
    <Row>
      <Col lg={10}>
        <details>
          <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'attributes.title'} /></summary>
          <main>
            <Row xs={3} sm={3} md={3} lg={4}>
              {datasets[datasetIndex].data_processed.attributes.map((item, i1) => {
                return <Col key={i1}>
                  <p className={'mb-0'}><b>{item.name}</b></p>
                  {item.type === 'int32' && <p className={'mb-0'}><Trans i18nKey={prefix + 'attributes.int32'} /></p>}
                  {item.type === 'float32' && <p className={'mb-0'}><Trans i18nKey={prefix + 'attributes.float32'} /></p>}
                  {item.type === 'label-encoder' && <>
                    <p className={'mb-0'}>LabelEncoder:</p>
                    <ol className={'n4l-ol-label-encoder'} start="0">
                      {item.options.map((option, i2) => {
                        return <li key={i1 + '_' + i2}>{option.text}</li>
                      })}
                    </ol>
                  </>}
                </Col>
              })}
            </Row>
          </main>
        </details>
      </Col>
      <Col lg={2}>
        <details>
          <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'attributes.classes'} /></summary>
          <main>
            <Row>
              <Col>
                <p className={'mb-0'}><b>{datasets[datasetIndex].data_processed.column_name_target}</b></p>
                <p className={'mb-0'}>LabelEncoder:</p>
                <ol className={'n4l-ol-label-encoder'} start="0">
                  {datasets[datasetIndex].data_processed.classes.map((item, index) => {
                    return <li key={index}>{item}</li>
                  })}
                </ol>
              </Col>
            </Row>
          </main>
        </details>
      </Col>
    </Row>
  </>
}