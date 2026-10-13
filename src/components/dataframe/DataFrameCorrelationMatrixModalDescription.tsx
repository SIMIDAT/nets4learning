import { useId } from 'react'
import { Modal } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import N4LLatex from '@components/latex/N4LLatex'

type DataFrameCorrelationMatrixModalDescriptionProps = {
  showDescription   : boolean
  setShowDescription: (show: boolean) => void
}
export default function DataFrameCorrelationMatrixModalDescription(props: DataFrameCorrelationMatrixModalDescriptionProps) {
  const { t } = useTranslation()
  // El diálogo se llama como su título (WCAG 4.1.2) y su botón de cerrar, en el idioma de la página
  const titleId = useId()
  const { showDescription, setShowDescription } = props
  const URL = 'https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.corr.html'

  return <>
    <Modal aria-labelledby={titleId}
      show={showDescription}
      onHide={() => setShowDescription(false)}
      size={'xl'}
      fullscreen={'md-down'}>
      <Modal.Header closeButton closeLabel={t('modal.close')}>
        <Modal.Title id={titleId}><Trans i18nKey={'dataframe.correlation-matrix.title'} /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.0'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.1'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.2'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.3'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.4'} /></p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.5'} /></p>

        <N4LLatex>
          {'$$ r_{xy} =\n' +
            '  \\frac{ \\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y}) }{%\n' +
            '        \\sqrt{\\sum_{i=1}^{n}(x_i-\\bar{x})^2}\\sqrt{\\sum_{i=1}^{n}(y_i-\\bar{y})^2}} $$'}
        </N4LLatex>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.6'} /></p>
        <p>
          <N4LLatex>{'$ x_i $'}</N4LLatex> <Trans i18nKey={'and'} />
          <N4LLatex>{'$~y_i $'}</N4LLatex> <Trans i18nKey={'dataframe.correlation-matrix.description.7'} />
        </p>
        <p>
          <N4LLatex>{'$ \\bar{x} $'}</N4LLatex> <Trans i18nKey={'and'} />
          <N4LLatex>{'$~\\bar{y} $'}</N4LLatex> <Trans i18nKey={'dataframe.correlation-matrix.description.8'} />
        </p>
        <p><Trans i18nKey={'dataframe.correlation-matrix.description.9'} /></p>
      </Modal.Body>
      <Modal.Footer>
        <p className={'text-muted'}>
          <Trans i18nKey={'dataframe.correlation-matrix.link'}
            components={{
              link1: <a href={URL} target={'_blank'} rel="noreferrer">link</a>
            }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}
