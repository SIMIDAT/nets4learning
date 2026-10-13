import { useId } from 'react'
import { Modal } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

type DataFrameQueryModalDescriptionProps = {
  showDescription   : boolean
  setShowDescription: (show: boolean) => void
}
export default function DataFrameQueryModalDescription (props: DataFrameQueryModalDescriptionProps) {
  const { t } = useTranslation()
  // El diálogo se llama como su título (WCAG 4.1.2) y su botón de cerrar, en el idioma de la página
  const titleId = useId()
  const { showDescription, setShowDescription } = props
  const URL = 'https://danfo.jsdata.org/api-reference/dataframe/danfo.dataframe.query'
  return <>
    <Modal aria-labelledby={titleId} show={showDescription}
           onHide={() => setShowDescription(false)}
           size={'xl'}
           fullscreen={'md-down'}>
      <Modal.Header closeButton closeLabel={t('modal.close')}>
        <Modal.Title id={titleId}><Trans i18nKey={'dataframe.query.title'} /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><Trans i18nKey={'dataframe.query.description.0'} /></p>
        <pre>
          <code>
            <var>.lt(other: DataFrame | Series | Array | Scalar, option?: &#123;axis: 1&#125; )</var><br />
            <var>.gt(other: DataFrame | Series | Array | Scalar, option?: &#123;axis: 1&#125; )</var><br />
            <var>.le(other: DataFrame | Series | Array | Scalar, option?: &#123;axis: 1&#125; )</var><br />
            <var>.ge(other: DataFrame | Series | Array | Scalar, option?: &#123;axis: 1&#125; )</var><br />
            <var>.ne(other: DataFrame | Series | Array | Scalar, option?: &#123;axis: 1&#125; )</var><br />
            <var>.eq(other: DataFrame | Series | Array | Scalar, option?: &#123;axis: 1&#125; )</var><br />
          </code>
        </pre>
        <hr />
        <pre>
          <code>
            const <var>query</var> = new Function(`return (dataframe['$&#123;columnToQuery&#125;']$&#123;stringToQuery&#125;)`)() <br />
            const <var>query_df</var> = dataframe.query(query)
          </code>
        </pre>
        <hr />
        <pre>
          <code>
            dataframe["cylinders"] .gt(5).and(df["horsepower"].eq(130))
          </code>
        </pre>
      </Modal.Body>
      <Modal.Footer>
        <p className={'text-muted'}>
          <Trans i18nKey={'dataframe.query.link'}
                 components={{
                   link1: <a href={URL} target={'_blank'} rel="noreferrer">link</a>
                 }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}