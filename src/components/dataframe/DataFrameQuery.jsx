import React, { useEffect, useId, useState } from 'react'
import { Col, InputGroup, Row, Form, Button } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { VERBOSE } from '@/CONSTANTS'
import { TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_1 } from '@/CONSTANTS_DanfoJS'

export default function DataFrameQuery ({ dataframe }) {

  const [stringToQuery, setStringToQuery] = useState('.gt(5)')
  const [columnToQuery, setColumnToQuery] = useState('')
  const dataframeID = useId()

  useEffect(() => {
    if (dataframe.columns.length > 0) {
      setColumnToQuery(dataframe.columns[0])
    }
  }, [dataframe, dataframeID,])

  const handleClick_UpdateQuery = () => {
    if (dataframe.columns.length > 0 && columnToQuery !== '') {
      try {
        window.n4l_data = {
          dataframe
        }

        const _stringToQuery = stringToQuery.replaceAll('df[', 'window.n4l_data.dataframe[')
        // eslint-disable-next-line no-new-func
        const query = new Function(`return (window.n4l_data.dataframe['${columnToQuery}']${_stringToQuery})`)()
        let query_df = dataframe.query(query)
        query_df.plot(dataframeID).table({ config: TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_1 })
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (VERBOSE) console.debug('render DataFrameQuery')
  return <>
    <Row className={'pb-3'}>
      <Col sm={3}>
        <InputGroup size={'sm'}>
          <InputGroup.Text>dataframe[</InputGroup.Text>
          <Form.Select id="dataframe"
                       size={'sm'}
                       placeholder="dataframe"
                       value={columnToQuery}
                       onChange={(e) => {setColumnToQuery(e.target.value)}}>
            {dataframe.columns.map((column_name, index) => {
              return <option key={index} value={column_name}>{column_name}</option>
            })}
          </Form.Select>
          <InputGroup.Text>]</InputGroup.Text>
        </InputGroup>
      </Col>
      <Col sm={7}>
        <Form.Label htmlFor="inlineFormInputName" visuallyHidden>
          <Trans i18nKey={'dataframe.query.query'} />
        </Form.Label>
        <Form.Control id="inlineFormInputName"
                      size={'sm'}
                      placeholder={'.gt(5).and(df["Longitud petalo"].gt(5))'}
                      value={stringToQuery}
                      onChange={(e) => {setStringToQuery(e.target.value)}} />
        <Form.Text className="text-muted">
          dataframe: <var>df</var>
        </Form.Text>
      </Col>
      <Col sm={2}>
        <div className="d-grid gap-2">
          <Button variant={'outline-primary'}
                  size={'sm'}
                  onClick={handleClick_UpdateQuery} >
            <Trans i18nKey={'dataframe.query.query'} />
          </Button>
        </div>
      </Col>
    </Row>
    <Row>
      <Col>
        <div id={dataframeID}></div>
      </Col>
    </Row>
  </>
}