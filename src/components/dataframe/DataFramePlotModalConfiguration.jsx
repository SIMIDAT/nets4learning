import { Col, Container, Form, Modal, Row, Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import React, { useContext, useEffect, useState } from 'react'

import { columnsTimeSeriesValidForIndex, isTimeSeriesDataFrameValidForIndex, listPlotsAvailable } from '@core/dataframe/DataFrameUtils'
import DataFramePlotContext from '../_context/DataFramePlotContext'
import { DEFAULT_DATAFRAME_PLOT_CONFIG, E_PLOTS } from '../_context/CONSTANTS'
import { VERBOSE } from '@/CONSTANTS'

export default function DataFramePlotModalConfiguration () {

  const {
    dataFrameLocal,

    dataframePlotConfig,
    setDataframePlotConfig,

    showOptions,
    setShowOptions,
  } = useContext(DataFramePlotContext)
  const [listColumns, setListColumns] = useState([])

  const prefix = 'dataframe-plot.configuration.'
  const { t } = useTranslation()

  useEffect(() => {
    console.debug('useEffect [dataFrameLocal.columns]')
    setListColumns(dataFrameLocal.columns)
  }, [dataFrameLocal.columns])

  const handleChangeCheckbox_Column = (e) => {
    const columnName = e.target.value
    const checked = e.target.checked

    const copyColumns = JSON.parse(JSON.stringify(dataframePlotConfig.COLUMNS))
    if (checked) {
      if (!copyColumns.includes(columnName)) {
        copyColumns.push(columnName)
      }
    } else {
      const columnIndex = copyColumns.indexOf(columnName)
      if (columnIndex !== -1) {
        copyColumns.splice(columnIndex, 1)
      }
    }

    setDataframePlotConfig((prevState) => {
      const _prevState = Object.assign({}, prevState)
      _prevState.COLUMNS = copyColumns
      return _prevState
    })
  }

  const handleClick_reset = () => {
    setDataframePlotConfig(() => {
      const resetState = { ...DEFAULT_DATAFRAME_PLOT_CONFIG }
      resetState.COLUMNS = dataFrameLocal.columns
      if (isTimeSeriesDataFrameValidForIndex(dataFrameLocal, resetState.COLUMNS)) {
        resetState.TIME_SERIES_PLOTS.config.index = columnsTimeSeriesValidForIndex(dataFrameLocal, resetState.COLUMNS)[0]
      }
      resetState.LIST_OF_AVAILABLE_PLOTS = listPlotsAvailable(dataFrameLocal, resetState.COLUMNS)
      return resetState
    })
  }

  const handleChange_PlotConfig_LAYOUT = (e, key) => {
    setDataframePlotConfig((prevState) => {
      const _prevState = Object.assign({}, prevState)
      _prevState.LAYOUT[key] = e.target.value
      return _prevState
    })
  }

  const handleChange_PlotConfig_PieCharts = (e, key) => {
    setDataframePlotConfig((prevState) => {
      const _prevState = Object.assign({}, prevState)
      _prevState.PIE_CHARTS.config[key] = e.target.value
      return _prevState
    })
  }

  const handleChange_PlotConfig_TimeSeries = (e, key) => {
    if (key === 'index') {
      const copyColumns = JSON.parse(JSON.stringify(dataframePlotConfig.COLUMNS))
      const columnIndex = copyColumns.indexOf(e.target.valueOf())
      if (columnIndex !== -1) {
        copyColumns.splice(columnIndex, 1)
      }
      dataframePlotConfig.COLUMNS = copyColumns
    }
    setDataframePlotConfig((prevState) => {
      const _prevState = Object.assign({}, prevState)
      _prevState.TIME_SERIES_PLOTS.config[key] = e.target.value
      return _prevState
    })
  }

  const handleSubmit_Config = (e) => {
    e.preventDefault()
    console.error({ e })
  }

  const handleClick_SelectAllColumns = () => {
    setDataframePlotConfig((prevState) => {
      const _prevState = Object.assign({}, prevState)
      _prevState.COLUMNS = dataFrameLocal.columns
      return _prevState
    })
  }

  const handleClick_DeleteAllColumns = () => {
    setDataframePlotConfig((prevState) => {
      const _prevState = Object.assign({}, prevState)
      _prevState.COLUMNS = []
      return _prevState
    })
  }

  const getFromColumnOfDataFrame_nUnique_PieCharts_Labels = (column_name) => {
    const size = new Set(dataFrameLocal[column_name].values).size
    return size.toString().padStart(4, '0')
  }

  if (VERBOSE) console.debug('render DataFramePlotConfiguration')
  return <>
    <Modal show={showOptions} onHide={() => setShowOptions(false)} size={'xl'} fullscreen={'md-down'}>
      <Modal.Header closeButton>
        <Modal.Title>
          <Trans i18nKey={`dataframe-plot.${dataframePlotConfig.PLOT_ENABLE}.title`} /> | <Trans i18nKey={'dataframe-plot.configuration.title'} />
        </Modal.Title>
        <div className={'d-flex'}>
          <Button variant={'outline-warning'}
                  className={'ms-3'}
                  size={'sm'}
                  onClick={handleClick_reset}>
            <Trans i18nKey={'dataframe-plot.configuration.reset'} />
          </Button>
          <Button variant={'outline-primary'}
                  size={'sm'}
                  className={'ms-3'}
                  onClick={handleClick_SelectAllColumns}>
            <Trans i18nKey={'dataframe-plot.configuration.select-all-columns'} />
          </Button>
          <Button variant={'outline-primary'}
                  className={'ms-3'}
                  size={'sm'}
                  onClick={handleClick_DeleteAllColumns}>
            <Trans i18nKey={'dataframe-plot.configuration.delete-all-columns'} />
          </Button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit_Config}>
          <Container>
            <Row>
              <Col xs={12} sm={12} md={12} lg={6} xl={6} xxl={6}>
                <h4><Trans i18nKey={prefix + 'layout.title'} /></h4>
                <Row>
                  <Col lg={12} xl={12}>
                    <Form.Group controlId={'dataframe-plot.configuration.layout.plot.title'}>
                      <Form.Label><Trans i18nKey={prefix + 'layout.plot.title'} /></Form.Label>
                      <Form.Control type="text"
                                    placeholder={t(prefix + 'layout.plot.title')}
                                    autoComplete="off"
                                    onChange={(e) => handleChange_PlotConfig_LAYOUT(e, 'title')}
                                    defaultValue={dataframePlotConfig.LAYOUT.title} />
                    </Form.Group>
                  </Col>
                  <Col lg={12} xl={12}>
                    <Form.Group controlId={'dataframe-plot.configuration.layout.plot.x-axis'}>
                      <Form.Label><Trans i18nKey={prefix + 'layout.plot.x-axis'} /></Form.Label>
                      <Form.Control type="text"
                                    placeholder={t(prefix + 'layout.plot.x-axis')}
                                    autoComplete="off"
                                    onChange={(e) => handleChange_PlotConfig_LAYOUT(e, 'x_axis')}
                                    defaultValue={dataframePlotConfig.LAYOUT.x_axis} />
                    </Form.Group>
                  </Col>
                  <Col lg={12} xl={12}>
                    <Form.Group controlId={'dataframe-plot.configuration.layout.plot.y-axis'}>
                      <Form.Label><Trans i18nKey={prefix + 'layout.plot.y-axis'} /></Form.Label>
                      <Form.Control type="text"
                                    placeholder={t(prefix + 'layout.plot.y-axis')}
                                    autoComplete="off"
                                    onChange={(e) => handleChange_PlotConfig_LAYOUT(e, 'y_axis')}
                                    defaultValue={dataframePlotConfig.LAYOUT.y_axis} />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>

              <Col xs={12} sm={12} md={12} lg={6} xl={6} xxl={6}>
                <h4><Trans i18nKey={prefix + 'columns.title'} /></h4>
                <div className={'overflow-y-scroll n4l-scroll-style-1'} style={{ maxHeight: '13em' }}>
                  <ol>
                    {listColumns.map((value, index) => {
                      return <li key={index}>
                        <Form.Check type={'checkbox'}
                                    label={value}
                                    onChange={(e) => handleChangeCheckbox_Column(e)}
                                    checked={dataframePlotConfig.COLUMNS.includes(value)}
                                    value={value}
                                    id={`dataframe-checkbox-${index}`}
                        />
                      </li>
                    })}
                  </ol>
                </div>
              </Col>

              <hr className={'mt-3 mb-3'} />

              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.BAR_CHARTS && <>
                {/*TODO*/}
              </>}
              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.BOX_PLOTS && <>
                {/*TODO*/}
              </>}
              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.HISTOGRAMS && <>
                {/*TODO*/}
              </>}
              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.LINE_CHARTS && <>
                {/*TODO*/}
              </>}
              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.PIE_CHARTS && <>
                <Form.Group controlId={'dataframe-plot.pie-charts.labels'}>
                  <Form.Label><Trans i18nKey={prefix + 'pie-charts.labels'} /></Form.Label>
                  <Form.Select onChange={(e) => handleChange_PlotConfig_PieCharts(e, 'labels')}
                               value={dataframePlotConfig.PIE_CHARTS.config.labels}
                               aria-label="dataframe-plot.pie-charts.labels">
                    <option value="_disabled_" disabled="disabled"><Trans i18nKey={'Labels'} /></option>
                    {dataframePlotConfig.COLUMNS.map((column_name, index) => {
                      return <option key={index} value={column_name}> nUnique {getFromColumnOfDataFrame_nUnique_PieCharts_Labels(column_name)} | {column_name}</option>
                    })}
                  </Form.Select>
                </Form.Group>
              </>}
              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.SCATTER_PLOTS && <>
                {/*TODO*/}
              </>}
              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.TIME_SERIES_PLOTS && <>
                <Col lg={12} xl={12}>
                  <Form.Group controlId={'dataframe-plot.time-series-plots.form.index'}>
                    <Form.Label><Trans i18nKey={'dataframe-plot.time-series-plots.form.index'} /></Form.Label>
                    <Form.Select onChange={(e) => handleChange_PlotConfig_TimeSeries(e, 'index')}
                                 value={dataframePlotConfig.TIME_SERIES_PLOTS.config.index}
                                 aria-label="dataframe-plot.time-series-plots.form.index">
                      <option value="_disabled_" disabled="disabled">Index</option>
                      {columnsTimeSeriesValidForIndex(dataFrameLocal, dataframePlotConfig.COLUMNS).map((value, index) => {
                        return <option key={index} value={value}>{value}</option>
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      <Trans i18nKey={'dataframe-plot.time-series-plots.index-info'} />
                    </Form.Text>
                  </Form.Group>
                </Col>
              </>}
              {dataframePlotConfig.PLOT_ENABLE === E_PLOTS.VIOLIN_PLOTS && <>
                {/*TODO*/}
              </>}

            </Row>
          </Container>
        </Form>

      </Modal.Body>
    </Modal>
  </>
}