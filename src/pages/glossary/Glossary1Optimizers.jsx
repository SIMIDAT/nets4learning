import React from 'react'
import Latex from 'react-latex-next'
import { Trans } from 'react-i18next'
import { Accordion, Col, Row, Table } from 'react-bootstrap'

export default function Glossary1Optimizers () {
  return <>
    <Accordion defaultValue={'equations'} defaultActiveKey={'equations'}>
      <Accordion.Item eventKey={'functions-optimizers'}>
        <Accordion.Header>
          <h2><Trans i18nKey={'pages.glossary.optimization-functions.title'} /></h2>
        </Accordion.Header>
        <Accordion.Body>
          <p><Trans i18nKey={'pages.glossary.optimization-functions.text-1'} /></p>
          <p><Trans i18nKey={'pages.glossary.optimization-functions.text-2'} /></p>
          <Table striped bordered hover responsive={true}>
            <thead>
            <tr>
              <th><Trans i18nKey={'pages.glossary.table-head.function'} /></th>
              {/*<th><Trans i18nKey={"pages.glossary.table-head.references"}/</th>*/}
              <th><Trans i18nKey={'pages.glossary.table-head.description'} /></th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <th>SGD</th>
              {/*<td><Trans i18nKey={"pages.glossary.optimization-functions.table.sgd.references"} /></td>*/}
              <td><Trans i18nKey={'pages.glossary.optimization-functions.table.sgd.description'} /></td>
            </tr>
            <tr>
              <th>Momentum</th>
              {/*<td></td>*/}
              <td><Trans i18nKey={'pages.glossary.optimization-functions.table.momentum.description'} /></td>
            </tr>
            <tr>
              <th>AdaGrad</th>
              {/*<td><Trans i18nKey={"pages.glossary.optimization-functions.table.adagrad.references"} /></td>*/}
              <td><Trans i18nKey={'pages.glossary.optimization-functions.table.adagrad.description'} /></td>
            </tr>
            <tr>
              <th>Adadelta</th>
              {/*<td><Trans i18nKey={"pages.glossary.optimization-functions.table.adadelta.references"} /></td>*/}
              <td><Trans i18nKey={'pages.glossary.optimization-functions.table.adadelta.description'} /></td>
            </tr>
            <tr>
              <th>Adam</th>
              {/*<td><Trans i18nKey={"pages.glossary.optimization-functions.table.adam.references"} /></td>*/}
              <td><Trans i18nKey={'pages.glossary.optimization-functions.table.adam.description'} /></td>
            </tr>
            <tr>
              <th>Adamax</th>
              {/*<td><Trans i18nKey={"pages.glossary.optimization-functions.table.adam.references"} /></td>*/}
              <td><Trans i18nKey={'pages.glossary.optimization-functions.table.adamax.description'} /></td>
            </tr>
            <tr>
              <th>RMSProp</th>
              {/*<td><Trans i18nKey={"pages.glossary.optimization-functions.table.rmsprop.references"} /></td>*/}
              <td><Trans i18nKey={'pages.glossary.optimization-functions.table.rmsprop.description'} /></td>
            </tr>
            </tbody>
          </Table>
          <Trans i18nKey={'references'} />
          <ol>
            <li><a target="_blank" rel="noreferrer" className="link-info" href="https://js.tensorflow.org/api/3.14.0/#Training-Optimizers">TensorFlow JS. Training / Optimizers</a></li>
          </ol>

        </Accordion.Body>
      </Accordion.Item>
      {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&
        <Accordion.Item eventKey={'equations-optimization'}>
          <Accordion.Header>
            <h2><Trans i18nKey={'equations.title-optimization'} /></h2>
          </Accordion.Header>
          <Accordion.Body>
            <Row xs={1} sm={1} md={2} lg={2} xl={2} xxl={2}>
              <Col className={'mt-3'}>
                <h4 className={'text-lg-center'}>Adagrad</h4>
                <Latex>{'$$ \\begin{split}g_{t}^{i} = \\frac{\\partial \\mathcal{J}(w_{t}^{i})}{\\partial W} \\\\\n W = W - \\alpha \\frac{\\partial \\mathcal{J}(w_{t}^{i})}{\\sqrt{\\sum_{r=1}^{t}\\left ( g_{r}^{i} \\right )^{2} + \\varepsilon }}\\end{split} $$'}</Latex>
              </Col>
              <Col className={'mt-3'}>
                <h4 className={'text-lg-center'}>Adadelta</h4>
                <Latex>{'$$ \\begin{split}v_t = \\rho v_{t-1} + (1-\\rho) \\nabla_\\theta^2 J( \\theta) \\\\\n \\Delta\\theta &= \\dfrac{\\sqrt{w_t + \\epsilon}}{\\sqrt{v_t + \\epsilon}} \\nabla_\\theta J( \\theta) \\\\\n \\theta &= \\theta - \\eta \\Delta\\theta \\\\\n w_t = \\rho w_{t-1} + (1-\\rho) \\Delta\\theta^2\\end{split} $$'}</Latex>
              </Col>
              <Col className={'mt-3'}>
                <h4 className={'text-lg-center'}>Adam</h4>
                <Latex>{`
                $$ \\begin{split}v_{dW} = \\beta_1 v_{dW} + (1 - \\beta_1) \\frac{\\partial \\mathcal{J} }{ \\partial W } 
                \\\\ s_{dW} = \\beta_2 s_{dW} + (1 - \\beta_2) (\\frac{\\partial \\mathcal{J} }{\\partial W })^2 
                \\\\ v^{corrected}_{dW} = \\frac{v_{dW}}{1 - (\\beta_1)^t} 
                \\\\ s^{corrected}_{dW} = \\frac{s_{dW}}{1 - (\\beta_1)^t} 
                \\\\ W = W - \\alpha \\frac{v^{corrected}_{dW}}{\\sqrt{s^{corrected}_{dW}} + \\varepsilon}\\end{split} $$
                `}</Latex>
              </Col>
              <Col className={'mt-3'}>
                <h4 className={'text-lg-center'}>Momentum</h4>
                <Latex>{'$$ \\begin{split}v_{dW} = \\beta v_{dW} + (1 - \\beta) \\frac{\\partial \\mathcal{J} }{ \\partial W } \\\\\n W = W - \\alpha v_{dW}\\end{split} $$'}</Latex>
              </Col>
              <Col className={'mt-3'}>
                <h4 className={'text-lg-center'}>RMSProp</h4>
                <Latex>{'$$ \\begin{split}s_{dW} = \\beta s_{dW} + (1 - \\beta) (\\frac{\\partial \\mathcal{J} }{\\partial W })^2 \\\\\n W = W - \\alpha \\frac{\\frac{\\partial \\mathcal{J} }{\\partial W }}{\\sqrt{s^{corrected}_{dW}} + \\varepsilon}\\end{split} $$'}</Latex>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>
      }
    </Accordion>
  </>
}
