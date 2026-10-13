import { useId } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Modal } from 'react-bootstrap'

type DataFrameDescribeModalDescriptionProps = {
  showDescription   : boolean
  setShowDescription: (show: boolean) => void
}
export default function DataFrameDescribeModalDescription (props: DataFrameDescribeModalDescriptionProps) {
  const { t } = useTranslation()
  // El diálogo se llama como su título (WCAG 4.1.2) y su botón de cerrar, en el idioma de la página
  const titleId = useId()
  const { showDescription, setShowDescription } = props

  const URL = 'https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.describe.html'
  return <>
    <Modal aria-labelledby={titleId} show={showDescription}
           onHide={() => setShowDescription(false)}
           size={'xl'}
           fullscreen={'md-down'}>
      <Modal.Header closeButton closeLabel={t('modal.close')}>
        <Modal.Title id={titleId}><Trans i18nKey={'dataframe.describe.title'} /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><Trans i18nKey={'dataframe.describe.description.0'} /></p>
        <p><Trans i18nKey={'dataframe.describe.description.1'} /></p>
      </Modal.Body>
      <Modal.Footer>
        <p className={'text-muted'}>
          <Trans i18nKey={'dataframe.describe.link'}
                 components={{
                   link1: <a href={URL} target={'_blank'} rel="noreferrer">link</a>
                 }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}
