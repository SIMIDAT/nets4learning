import { Modal } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import React from 'react'

export default function DataFrameQueryModalDescription ({ showDescription, setShowDescription }) {

  const URL = 'https://danfo.jsdata.org/api-reference/dataframe/danfo.dataframe.query'
  return <>
    <Modal show={showDescription}
           onHide={() => setShowDescription(false)}
           size={'xl'}
           fullscreen={'md-down'}>
      <Modal.Header closeButton>
        <Modal.Title><Trans i18nKey={`dataframe.query.title`} /></Modal.Title>
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
      </Modal.Body>
      <Modal.Footer>
        <p className={'text-muted'}>
          <Trans i18nKey={'dataframe.query.link'}
                 components={{
                   link1: <a href={URL} target={'_blank'} rel="noreferrer" className={'text-info'}>link</a>
                 }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}