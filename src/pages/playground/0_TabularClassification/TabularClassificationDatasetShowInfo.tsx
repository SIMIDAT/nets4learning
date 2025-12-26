import { Col, Row } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'
import type * as _Types from '@core/types'


type TabularClassificationDatasetShowInfoProps = {
  datasets: { index: number, datasets: _Types.DatasetProcessed_t[] }
}

export default function TabularClassificationDatasetShowInfo({ datasets }: TabularClassificationDatasetShowInfoProps) {
  const prefix = 'pages.playground.generator.dataset.'

  const dataProcessed = datasets.datasets[datasets.index]?.data_processed
  if (!dataProcessed) {
    console.warn('TabularClassificationDatasetShowInfo: data_processed not found')
    return
  }

  const attributes = dataProcessed.attributes ?? []
  const classes = dataProcessed.classes ?? []

  if (VERBOSE) console.debug('render TabularClassificationDatasetShow')
  return <>
    <Row>
      <Col lg={10}>
        <details>
          <summary className={'n4l-summary-1-25'}><Trans i18nKey={prefix + 'attributes.title'} /></summary>
          <main>
            <Row xs={3} sm={3} md={3} lg={4}>
              {attributes.map((item: any, i1: number) => {
                return <Col key={i1}>
                  <p className={'mb-0'}><b>{item.name}</b></p>
                  {item.type === 'int32' && <p className={'mb-0'}><Trans i18nKey={prefix + 'attributes.int32'} /></p>}
                  {item.type === 'float32' && <p className={'mb-0'}><Trans i18nKey={prefix + 'attributes.float32'} /></p>}
                  {item.type === 'label-encoder' && <>
                    <p className={'mb-0'}>LabelEncoder:</p>
                    <ol className={'n4l-ol-label-encoder'} start={0}>
                      {item.options.map((option: any, i2: number) => {
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
          <summary className={'n4l-summary-1-25'}><Trans i18nKey={prefix + 'attributes.classes'} /></summary>
          <main>
            <Row>
              <Col>
                <p className={'mb-0'}><b>{dataProcessed.column_name_target}</b></p>
                <p className={'mb-0'}>LabelEncoder:</p>
                <ol className={'n4l-ol-label-encoder'} start={0}>
                  {classes.map((item: string, index: number) => {
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