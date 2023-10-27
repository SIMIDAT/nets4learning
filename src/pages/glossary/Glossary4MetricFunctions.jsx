import { Accordion, Col, Row, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import Latex from 'react-latex-next'
import React from 'react'

export default function Glossary4MetricFunctions () {

  const { t } = useTranslation()

  return <>
    <Accordion defaultValue={''} defaultActiveKey={''}>
      <Accordion.Item eventKey={'functions-metrics'}>
        <Accordion.Header><h2>{t('pages.glossary.metric-functions.title')}</h2></Accordion.Header>
        <Accordion.Body>
          <Row>
            <Col>
              <p><Trans i18nKey={'pages.glossary.metric-functions.text-1'} /></p>
              <p><Trans i18nKey={'pages.glossary.metric-functions.text-2'} /></p>
              <p><Trans i18nKey={'pages.glossary.metric-functions.text-3'} /></p>
              <p><Trans i18nKey={'pages.glossary.metric-functions.text-4'} /></p>
            </Col>
          </Row>
          <Row>
            <Col>
              <Trans i18nKey={'references'} />
              <ol>
                <li><a target="_blank" rel="noreferrer" className="link-info" href="https://js.tensorflow.org/api/3.14.0/#Metrics">TensorFlow JS. Metrics</a></li>
              </ol>
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
      {process.env.REACT_APP_SHOW_NEW_FEATURE === "true" &&
        <Accordion.Item eventKey={'equation-metric'}>
          <Accordion.Header><h2>{t('equations.title-metrics')}</h2></Accordion.Header>
          <Accordion.Body>
            <Row xs={1} sm={1} md={2} lg={2} xl={2} xxl={2}>
              <Col>
                {/**/}
                <h4 className={'text-lg-center'}>{t('equations.metric-functions.acc-prec-recall-f1.title')}</h4>
                <Latex>{'$$ Accuracy = \\frac{TP+TN}{TP+TN+FP+FN} $$'}</Latex>
                <Latex>{'$$ Precision = \\frac{TP}{TP+FP} $$'}</Latex>
                <Latex>{'$$ Recall = \\frac{TP}{TP+FN} $$'}</Latex>
                <Latex>{'$$ F1 = \\frac{2*Precision*Recall}{Precision+Recall} = \\frac{2*TP}{2*TP+FP+FN} $$'}</Latex>
              </Col>
              <Col>
                <h4 className={'text-lg-center'}>{t('equations.metric-functions.sen-spe-auc.title')}</h4>
                <Latex>{'$$ Sensitivity = Recall = \\frac{TP}{TP+FN} $$'}</Latex>
                <Latex>{'$$ Specificity = \\frac{TN}{FP+TN}\n $$'}</Latex>
                <Latex>{t('equations.metric-functions.sen-spe-auc.text-1')}</Latex>
              </Col>
            </Row>
            <Row>
              <Col>
                <Table>
                  <thead>
                  <tr>
                    <th>Alias</th>
                    <th>Ingles</th>
                    <th>Español</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td><Latex>{'$ TP $'}</Latex></td>
                    <td>True Positive</td>
                    <td>Positivos Verdaderos</td>
                  </tr>
                  <tr>
                    <td><Latex>{'$ TN $'}</Latex></td>
                    <td>True Negative</td>
                    <td>Negativos Verdaderos</td>
                  </tr>
                  <tr>
                    <td><Latex>{'$ FP $'}</Latex></td>
                    <td>False Positive</td>
                    <td>Positivos Falsos</td>
                  </tr>
                  <tr>
                    <td><Latex>{'$ FN $'}</Latex></td>
                    <td>False Negative</td>
                    <td>Negativos Falsos</td>
                  </tr>
                  </tbody>
                </Table>
              </Col>
              <Col></Col>
            </Row>
            <Row>
              <Col>
                <Trans i18nKey={'references'} />
                <ol>
                  <li><a target="_blank" rel="noreferrer" className="link-info" href="https://www.iartificial.net/precision-recall-f1-accuracy-en-clasificacion/">Precision, Recall, F1, Accuracy en clasificación</a></li>
                </ol>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>
      }
    </Accordion>
  </>
}