import { Trans } from 'react-i18next'
import { Modal } from 'react-bootstrap'

type DataFrameDescribeModalDescriptionProps = {
  showDescription   : boolean
  setShowDescription: (show: boolean) => void
}
export default function DataFrameDescribeModalDescription (props: DataFrameDescribeModalDescriptionProps) {
  const { showDescription, setShowDescription } = props

  const URL = 'https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.describe.html'
  return <>
    <Modal show={showDescription}
           onHide={() => setShowDescription(false)}
           size={'xl'}
           fullscreen={'md-down'}>
      <Modal.Header closeButton>
        <Modal.Title><Trans i18nKey={'dataframe.describe.title'} /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><Trans i18nKey={'dataframe.describe.description.0'} /></p>
        <p><Trans i18nKey={'dataframe.describe.description.1'} /></p>
      </Modal.Body>
      <Modal.Footer>
        <p className={'text-muted'}>
          <Trans i18nKey={'dataframe.describe.link'}
                 components={{
                   link1: <a href={URL} target={'_blank'} rel="noreferrer" className={'text-info'}>link</a>
                 }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}
