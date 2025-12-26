import '@styles/ScrollBar.css'
import React, { useCallback, useContext, useEffect, useId, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as _dfd from 'danfojs'

import {
  lineChartsValidConfig,
  pieChartsValidConfig,
  timeSeriesPlotsValidConfig,
  violinPlotsValidConfig,
} from '@core/dataframe/DataFrameUtils'

import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import DataFramePlotModalConfiguration from './DataFramePlotModalConfiguration'
import DataFramePlotModalDescription from './DataFramePlotModalDescription'
import DataFramePlotContext from '../_context/DataFramePlotContext'
import { E_PLOTS, LIST_PLOTS } from '../_context/CONSTANTS'
import { VERBOSE } from '@/CONSTANTS'

/**
 * @typedef DataFramePlotProps_t
 * @property {_dfd.DataFrame} dataframe
 * @property {boolean} isDataFrameProcessed
 */
type DataFramePlotProps_t = {
  dataframe            : _dfd.DataFrame
  isDataFrameProcessed?: boolean
}

/**
 * 
 * @param {DataFramePlotProps_t} props 
 * @returns 
 */
export default function DataFramePlot(props: DataFramePlotProps_t) {

  const { dataframe, isDataFrameProcessed = false } = props
  const {
    dataFrameLocal,
    setDataFrameLocal,

    dataframePlotConfig,
    setDataframePlotConfig,

    setShowOptions,
    setShowDescription,
  } = useContext(DataFramePlotContext)

  const { t } = useTranslation()
  const [listWarning, setListWarning] = useState<string[]>([])
  const [showDataframe, setShowDataframe] = useState(false)

  const dataframe_plot_ID = useId()

  const init = useCallback(() => {
    // Funciones para inicializar TIME_SERIES_PLOTS
    const _columnsValidFor_TimeSeriesPlots_Index = (_dataframe: _dfd.DataFrame) => {
      return _dataframe.columns.filter((column) => {
        return _dataframe[column].unique().shape[0] === _dataframe.shape[0]
      })
    }
    const _isDataFrameValidFor_TimeSeriesPlots_Index = (_dataframe: _dfd.DataFrame) => {
      return _columnsValidFor_TimeSeriesPlots_Index(_dataframe).length > 0
    }
    // Funciones para inicializar PIE_CHARTS
    const _getDataFrame_nUnique_PieCharts_Labels = (_dataframe: _dfd.DataFrame) => {
      const list = []
      for (const col_name of _dataframe.columns) {
        const col_size = new Set(_dataframe[col_name].values).size
        list.push({ col_name, col_size })
      }
      return list
    }
    const _getDataFrame_Min_nUnique_PieCharts_Labels = (_dataframe: _dfd.DataFrame) => {
      const list = _getDataFrame_nUnique_PieCharts_Labels(_dataframe)
        .sort((a, b) => {
          return a.col_size - b.col_size
        })
      const min = list[0]
      return { col_name: min.col_name, col_size: min.col_size }
    }
    const _isDataFrameValidFor_PieCharts_Labels = (_dataframe: _dfd.DataFrame) => {
      return true
    }
    // Funciones para definir que plots se van a mostrar
    const _listPlotsAvailable = (_dataframe: _dfd.DataFrame) => {
      const list_of_available_plots = []
      for (const plot_id of LIST_PLOTS) {
        let available = true
        if (E_PLOTS.TIME_SERIES_PLOTS === plot_id) {
          available = _isDataFrameValidFor_TimeSeriesPlots_Index(_dataframe)
        }
        if (available) list_of_available_plots.push(plot_id)
      }
      return list_of_available_plots
    }

    setDataframePlotConfig((prevState) => {
      if (dataFrameLocal === undefined) {
        console.error('dataFrameLocal is undefined')
        return prevState
      }
      const _prevState = Object.assign({}, prevState)
      _prevState.COLUMNS = dataFrameLocal.columns
      if (dataFrameLocal.columns.length > 0) {
        if (_isDataFrameValidFor_TimeSeriesPlots_Index(dataFrameLocal)) {
          _prevState.TIME_SERIES_PLOTS.config.index = _columnsValidFor_TimeSeriesPlots_Index(dataFrameLocal)[0]
        }
        if (_isDataFrameValidFor_PieCharts_Labels(dataFrameLocal)) {
          _prevState.PIE_CHARTS.config.labels = _getDataFrame_Min_nUnique_PieCharts_Labels(dataFrameLocal).col_name
        }
      }
      _prevState.LIST_OF_AVAILABLE_PLOTS = _listPlotsAvailable(dataFrameLocal)
      return _prevState
    })
  }, [dataFrameLocal, setDataframePlotConfig])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [ isDataFrameProcessed ]')
    // eslint-disable-next-line
    setShowDataframe(isDataFrameProcessed)
  }, [setShowDataframe, isDataFrameProcessed])

  const updateUI = useCallback(() => {
    if (!showDataframe) {
      if (VERBOSE) console.debug('!showDataFrame')
      setListWarning([])
      return
    }

    const availableColumns = dataFrameLocal?.columns ?? []
    if (availableColumns.length === 0) {
      setListWarning([])
      return
    }

    const layout = {
      title: dataframePlotConfig.LAYOUT.title,
      xaxis: { title: dataframePlotConfig.LAYOUT.x_axis },
      yaxis: { title: dataframePlotConfig.LAYOUT.y_axis },
    }

    const warnings: string[] = []
    const columnsToShow = dataframePlotConfig.COLUMNS.filter((value) => availableColumns.includes(value))
    if (columnsToShow.length === 0) {
      setListWarning(['No columns available for plotting'])
      return
    }

    try {
      let sub_df = dataFrameLocal.loc({ columns: columnsToShow })
      switch (dataframePlotConfig.PLOT_ENABLE) {
        case E_PLOTS.BAR_CHARTS:
          // TODO
          sub_df.plot(dataframe_plot_ID).bar({ layout })
          break
        case E_PLOTS.BOX_PLOTS:
          sub_df.plot(dataframe_plot_ID).box({ layout })
          break
        case E_PLOTS.HISTOGRAMS:
          sub_df.plot(dataframe_plot_ID).hist({ layout })
          break
        case E_PLOTS.LINE_CHARTS: {
          const { isValidConfig_LineCharts, config_LineCharts } = lineChartsValidConfig(dataFrameLocal, dataframePlotConfig, columnsToShow)
          if (isValidConfig_LineCharts) {
            sub_df.plot(dataframe_plot_ID).line({ layout })
          } else {
            warnings.push('Error, option not valid E_PLOTS.LINE_CHARTS')
            console.error('Error, option not valid E_PLOTS.LINE_CHARTS', { config_LineCharts })
          }
          break
        }
        case E_PLOTS.PIE_CHARTS: {
          const { isValidConfig_PieCharts, config_PieCharts } = pieChartsValidConfig(dataFrameLocal, dataframePlotConfig)
          if (isValidConfig_PieCharts && availableColumns.includes(config_PieCharts.labels)) {
            sub_df.plot(dataframe_plot_ID).pie({ layout, config: config_PieCharts })
          } else {
            warnings.push('dataframe-plot.pie-charts.warning.labels')
            console.error('Error, option not valid E_PLOTS.PIE_CHARTS', { config_PieCharts })
          }
          break
        }
        case E_PLOTS.SCATTER_PLOTS: {
          const { x, y } = dataframePlotConfig.SCATTER_PLOTS.config
          const hasAxes = availableColumns.includes(x) && availableColumns.includes(y)
          if (hasAxes) {
            sub_df.plot(dataframe_plot_ID).scatter({ layout, config: { x, y } })
          } else {
            warnings.push('dataframe-plot.scatter-plots.warning.axes')
            console.error('Error, option not valid E_PLOTS.SCATTER_PLOTS', { x, y })
          }
          break
        }
        case E_PLOTS.TIME_SERIES_PLOTS: {
          const { isValidConfig_TimeSeries, config_TimeSeries, index } = timeSeriesPlotsValidConfig(dataFrameLocal, dataframePlotConfig)
          if (isValidConfig_TimeSeries) {
            const sub_sub_df = sub_df.setIndex(index)
            sub_sub_df.plot(dataframe_plot_ID).line({ layout })
          } else {
            warnings.push('dataframe-plot.time-series.warning.index')
            console.error('Error, option not valid E_PLOTS.TIME_SERIES_PLOTS', { config_TimeSeries, index })
          }
          break
        }
        case E_PLOTS.VIOLIN_PLOTS: {
          const { isValidConfig_ViolinPlots, config_ViolinPlots } = violinPlotsValidConfig(dataFrameLocal, dataframePlotConfig)
          if (isValidConfig_ViolinPlots && config_ViolinPlots.columns.length > 0) {
            sub_df = dataFrameLocal.loc({ columns: config_ViolinPlots.columns })
            sub_df.plot(dataframe_plot_ID).violin({ layout })
          } else {
            warnings.push('dataframe-plot.violin-plots.warning.index')
            console.log('Error, option not valid E_PLOTS.VIOLIN_PLOTS', { isValidConfig_ViolinPlots, config_ViolinPlots })
          }
          break
        }
        default: {
          warnings.push('Error, option not valid')
          console.error('Error, option not valid')
          break
        }
      }
    } catch (e) {
      warnings.push('Unexpected error rendering plot')
      console.error(e)
    }

    setListWarning(warnings)
  }, [dataFrameLocal, dataframePlotConfig, dataframe_plot_ID, showDataframe])

  useEffect(() => {
  }, [])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [ dataframe, setDataFrameLocal ]')
    if (dataframe.columns.length > 0) {
      setDataFrameLocal(dataframe)
    }
  }, [dataframe, setDataFrameLocal])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [ init() ]')
    init()
  }, [init])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [ updateUI() ]')
    // eslint-disable-next-line
    updateUI()
  }, [updateUI])

  const handleChange_Plot = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDataframePlotConfig((prevState) => ({
      ...prevState,
      PLOT_ENABLE: e.target.value,
    }))
  }

  if (VERBOSE) console.debug('render DataFramePlot')
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={'dataframe-plot.title'} /></h2>
        <div className={'d-flex'}>
          <Form.Group controlId={'plot'}>
            <Form.Select size={'sm'}
              aria-label={'plot'}
              disabled={!showDataframe}
              value={dataframePlotConfig.PLOT_ENABLE}
              onChange={(e) => handleChange_Plot(e)} >
              <>
                {dataframePlotConfig
                  .LIST_OF_AVAILABLE_PLOTS
                  .map((value, index) =>
                    (<option key={'option_' + index} value={value}><Trans i18nKey={`dataframe-plot.${value}.title`} /></option>),
                  )}
              </>
            </Form.Select>
          </Form.Group>

          <Button variant={'outline-primary'}
            size={'sm'}
            className={'ms-3'}
            aria-label={'description'}
            disabled={!showDataframe}
            onClick={() => setShowOptions(true)}>
            <Trans i18nKey={'dataframe-plot.buttons.configuration'} />
          </Button>
          <Button variant={'outline-primary'}
            size={'sm'}
            className={'ms-3'}
            aria-label={'description'}
            disabled={!showDataframe}
            onClick={() => setShowDescription(true)}>
            <Trans i18nKey={'dataframe-plot.buttons.description'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            {!showDataframe &&
              <WaitingPlaceholder i18nKey_title={'Waiting'} />
            }
            {showDataframe &&
              <div id={dataframe_plot_ID}></div>
            }
          </Col>
        </Row>
      </Card.Body>

      {listWarning.length !== 0 && <>
        <Card.Footer>
          <ul className={'list-group'}>
            {listWarning.map((value, index) => {
              return <li className={'list-group-item list-group-item-warning'} key={index}>{t(value)}</li>
            })}
          </ul>
        </Card.Footer>
      </>}
    </Card>


    {/*<DebugJSON obj={dataframePlotConfig} />*/}
    <DataFramePlotModalDescription />
    <DataFramePlotModalConfiguration updateUI={updateUI} />
  </>
}