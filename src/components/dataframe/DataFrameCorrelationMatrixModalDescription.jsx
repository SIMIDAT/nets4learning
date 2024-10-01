import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import { Modal } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import React from 'react'

export default function DataFrameCorrelationMatrixModalDescription ({ showDescription, setShowDescription }) {
  const URL = 'https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.corr.html'

  return <>
    <Modal show={showDescription}
           onHide={() => setShowDescription(false)}
           size={'xl'}
           fullscreen={'md-down'}>
      <Modal.Header closeButton>
        <Modal.Title><Trans i18nKey={'dataframe.correlation-matrix.title'} /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.0'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.1'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.2'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.3'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.4'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.5'} /></p>

        <Latex>{'$$ r_{xy} =\n' +
          '  \\frac{ \\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y}) }{%\n' +
          '        \\sqrt{\\sum_{i=1}^{n}(x_i-\\bar{x})^2}\\sqrt{\\sum_{i=1}^{n}(y_i-\\bar{y})^2}} $$'}</Latex>

        <p><Trans i18nKey={'dataframe.correlation-matrix.description.6'} /></p>
        <p><Latex>{'$ x_i $'}</Latex> <Trans i18nKey={'and'} /> <Latex>{'$ y_i $'}</Latex> <Trans i18nKey={'dataframe.correlation-matrix.description.7'} /></p>
        <p><Latex>{'$ \\bar{x} $'}</Latex> <Trans i18nKey={'and'} /> <Latex>{'$ \\bar{y} $'}</Latex> <Trans i18nKey={'dataframe.correlation-matrix.description.8'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.9'} /></p>
      </Modal.Body>
      <Modal.Footer>
        <p className={'text-muted'}>
          <Trans i18nKey={'dataframe.correlation-matrix.link'}
                 components={{
                   link1: <a href={URL} target={'_blank'} rel="noreferrer" className={'text-info'}>link</a>
                 }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}
