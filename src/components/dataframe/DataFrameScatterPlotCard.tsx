import '@styles/ScrollBar.css'
import React, { useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as dfd from 'danfojs'

import { VERBOSE } from '@/CONSTANTS'
import DataFrameScatterPlot from '@components/dataframe/DataFrameScatterPlot'

type DataFrameScatterPlotCardProps = {
  dataframe: dfd.DataFrame,
}
export default function DataFrameScatterPlotCard(props: DataFrameScatterPlotCardProps) {
  const { dataframe } = props
  const DEFAULT_SELECTOR = 'select-attr'

  const [selector, setSelector] = useState({
    selector_x: DEFAULT_SELECTOR,
    selector_y: DEFAULT_SELECTOR
  })

  const handleChange_SelectorX = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelector((prevState) => {
      return { ...prevState, selector_x: event.target.value }
    })
  }
  const handleChange_SelectorY = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelector((prevState) => {
      return { ...prevState, selector_y: event.target.value }
    })
  }

  if (VERBOSE) console.debug('render DataFrameScatterPlotCard')
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={'dataframe-scatterplot.title'} /></h3>
        <div className={'d-flex gap-2 n4l-card-header-controls'}>
          <Form.Group controlId={'selector-x'} className={'flex-fill'}>
            <Form.Select
              onChange={handleChange_SelectorX}
              aria-label={'selector-x'}
              size={'sm'}
              defaultValue={DEFAULT_SELECTOR}>
              <option value={DEFAULT_SELECTOR} disabled={true}><Trans i18nKey={'select-attr'} /></option>
              <>
                {dataframe.columns.map((value, index) => {
                  return <option value={value} key={index}>{value}</option>
                })}
              </>
            </Form.Select>
          </Form.Group>
          <Form.Group controlId={'selector-y'} className={'flex-fill'}>
            <Form.Select
              onChange={handleChange_SelectorY}
              aria-label={'selector-y'}
              size={'sm'}
              defaultValue={DEFAULT_SELECTOR}>
              <>
                <option value={DEFAULT_SELECTOR} disabled={true}><Trans i18nKey={'select-attr'} /></option>
                {dataframe.columns.map((value, index) => {
                  return <option value={value} key={index}>{value}</option>
                })}
              </>
            </Form.Select>
          </Form.Group>
        </div>
      </Card.Header>
      <Card.Body>
        <DataFrameScatterPlot
          dataframe={dataframe}
          selector_x={selector.selector_x}
          selector_y={selector.selector_y}
        />
      </Card.Body>
    </Card>
  </>
}