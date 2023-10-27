import '@styles/ScrollBar.css'
import React, { useCallback, useContext, useEffect, useId, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import {
  lineChartsValidConfig,
  pieChartsValidConfig,
  timeSeriesPlotsValidConfig, violinPlotsValidConfig,
} from '@core/dataframe/DataFrameUtils'

import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import DataFramePlotModalConfiguration from './DataFramePlotModalConfiguration'
import DataFramePlotModalDescription from './DataFramePlotModalDescription'
import DataFramePlotContext from '../_context/DataFramePlotContext'
import { E_PLOTS, LIST_PLOTS } from '../_context/CONSTANTS'
import { VERBOSE } from '@/CONSTANTS'

export default function DataFramePlot ({ dataframe }) {

  const {
    dataFrameLocal,
    setDataFrameLocal,

    dataframePlotConfig,
    setDataframePlotConfig,

    setShowOptions,
    setShowDescription,
  } = useContext(DataFramePlotContext)

  const { t } = useTranslation()
  const [listWarning, setListWarning] = useState([])

  const dataframe_plot_id = useId()

  const init = useCallback(() => {
    // Funciones para inicializar TIME_SERIES_PLOTS
    const _columnsValidFor_TimeSeriesPlots_Index = (_dataframe) => {
      return _dataframe.columns.filter((column) => {
        return _dataframe[column].unique().shape[0] === _dataframe.shape[0]
      })
    }
    const _isDataFrameValidFor_TimeSeriesPlots_Index = (_dataframe) => {
      return _columnsValidFor_TimeSeriesPlots_Index(_dataframe).length > 0
    }
    // Funciones para inicializar PIE_CHARTS
    const _getDataFrame_nUnique_PieCharts_Labels = (_dataframe) => {
      const list = []
      for (const col_name of _dataframe.columns) {
        const col_size = new Set(_dataframe[col_name].values).size
        list.push({ col_name, col_size })
      }
      return list
    }
    const _getDataFrame_Min_nUnique_PieCharts_Labels = (_dataframe) => {
      const list = _getDataFrame_nUnique_PieCharts_Labels(_dataframe)
        .sort((a, b) => {
          return a.col_size - b.col_size
        })
      const min = list[0]
      return { col_name: min.col_name, col_size: min.col_size }
    }
    const _isDataFrameValidFor_PieCharts_Labels = (_dataframe) => {
      return true
    }
    // Funciones para definir que plots se van a mostrar
    const _listPlotsAvailable = (_dataframe) => {
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

  const updateUI = useCallback(() => {
    try {
      const layout = {
        title: dataframePlotConfig.LAYOUT.title,
        xaxis: { title: dataframePlotConfig.LAYOUT.x_axis },
        yaxis: { title: dataframePlotConfig.LAYOUT.y_axis },
      }
      const list_warnings = []
      if (dataframePlotConfig.COLUMNS !== [] && dataFrameLocal.columns.length > 0) {
        const columnsToShow = dataframePlotConfig.COLUMNS.filter(value => dataFrameLocal.columns.includes(value))
        let sub_df = dataFrameLocal.loc({ columns: columnsToShow })
        switch (dataframePlotConfig.PLOT_ENABLE) {
          case E_PLOTS.BAR_CHARTS:
            // TODO
            sub_df.plot(dataframe_plot_id).bar({ layout })
            break
          case E_PLOTS.BOX_PLOTS:
            sub_df.plot(dataframe_plot_id).box({ layout })
            break
          case E_PLOTS.HISTOGRAMS:
            sub_df.plot(dataframe_plot_id).hist({ layout })
            break
          case E_PLOTS.LINE_CHARTS:
            const { isValidConfig_LineCharts, config_LineCharts } = lineChartsValidConfig(dataFrameLocal, dataframePlotConfig, columnsToShow)
            if (isValidConfig_LineCharts) {
              sub_df.plot(dataframe_plot_id).line({ layout })
            } else {
              console.error('Error, option not valid E_PLOTS.LINE_CHARTS', { config_LineCharts })
            }
            break
          case E_PLOTS.PIE_CHARTS:
            const { isValidConfig_PieCharts, config_PieCharts } = pieChartsValidConfig(dataFrameLocal, dataframePlotConfig, columnsToShow)
            if (isValidConfig_PieCharts) {
              sub_df.plot(dataframe_plot_id).pie({ layout, config: config_PieCharts })
            } else {
              console.error('Error, option not valid E_PLOTS.PIE_CHARTS', { config_PieCharts })
            }
            break
          case E_PLOTS.SCATTER_PLOTS:
            sub_df.plot(dataframe_plot_id).scatter({ layout })
            break
          case E_PLOTS.TIME_SERIES_PLOTS:
            // TODO
            const { isValidConfig_TimeSeries, config_TimeSeries, index } = timeSeriesPlotsValidConfig(dataFrameLocal, dataframePlotConfig)
            if (isValidConfig_TimeSeries) {
              const sub_sub_df = sub_df.setIndex(index)
              sub_sub_df.plot(dataframe_plot_id).line({ layout })
            } else {
              list_warnings.push('dataframe-plot.time-series.warning.index')
              console.error('Error, option not valid E_PLOTS.TIME_SERIES_PLOTS', { config_TimeSeries, index })
            }
            break
          case E_PLOTS.VIOLIN_PLOTS:
            const { isValidConfig_ViolinPlots, config_ViolinPlots } = violinPlotsValidConfig(dataFrameLocal, dataframePlotConfig)
            if (isValidConfig_ViolinPlots) {
              sub_df = dataFrameLocal.loc({ columns: config_ViolinPlots.columns })
              sub_df.plot(dataframe_plot_id).violin({ layout })
            } else {
              list_warnings.push('dataframe-plot.violin-plots.warning.index')
              console.log('Error, option not valid E_PLOTS.VIOLIN_PLOTS', { isValidConfig_ViolinPlots, config_ViolinPlots })
            }
            break
          default: {
            console.error('Error, option not valid')
            break
          }
        }
        setListWarning(list_warnings)
      }
    } catch (e) {
      console.error(e)
    }
    // eslint-disable-next-line
  }, [
    dataframePlotConfig.PLOT_ENABLE,
    dataframePlotConfig.COLUMNS,
    dataframePlotConfig.TIME_SERIES_PLOTS.config.index,
    dataframePlotConfig.PIE_CHARTS.config.labels,
    dataFrameLocal,
    dataframe_plot_id,
  ])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [ dataframe, setDataFrameLocal ]')
    if (dataframe.columns.length > 0) {
      setDataFrameLocal(dataframe)
    }
  }, [dataframe, setDataFrameLocal])

  useEffect(() => {
    console.debug('useEffect [ init() ]')
    init()
  }, [init])

  useEffect(() => {
    console.debug('useEffect [ updateUI() ]')
    updateUI()
  }, [updateUI])

  const handleChange_Plot = (e) => {
    setDataframePlotConfig((prevState) => ({
      ...prevState,
      PLOT_ENABLE: e.target.value,
    }))
  }

  const DFPListWarnings = () => {
    if (listWarning === []) return <></>
    return <>
      <ul className={'list-group'}>
        {listWarning.map((value, index) => {
          return <li className={'list-group-item list-group-item-warning'} key={index}>{t(value)}</li>
        })}
      </ul>
    </>
  }

  if (VERBOSE) console.debug('render DataFramePlot')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={'dataframe-plot.title'} /></h2>
        <div className={'d-flex'}>
          <Form.Group controlId={'plot'}>
            <Form.Select onChange={(e) => handleChange_Plot(e)}
                         aria-label={'plot'}
                         size={'sm'}
                         value={dataframePlotConfig.PLOT_ENABLE}>
              <>
                {dataframePlotConfig.LIST_OF_AVAILABLE_PLOTS
                  .map((value, index) =>
                    (<option key={'option_' + index} value={value}><Trans i18nKey={`dataframe-plot.${value}.title`} /></option>),
                  )}
              </>
            </Form.Select>
          </Form.Group>

          <Button variant={'outline-primary'}
                  size={'sm'}
                  className={'ms-3'}
                  onClick={() => setShowOptions(true)}>
            <Trans i18nKey={'dataframe-plot.buttons.configuration'} />
          </Button>
          <Button variant={'outline-primary'}
                  size={'sm'}
                  className={'ms-3'}
                  onClick={() => setShowDescription(true)}>
            <Trans i18nKey={'dataframe-plot.buttons.description'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            {dataFrameLocal.columns.length === 0 &&
              <WaitingPlaceholder title={t('Waiting')} />
            }
            {dataFrameLocal.columns.length > 0 &&
              <div id={dataframe_plot_id}></div>
            }
          </Col>
        </Row>
      </Card.Body>

      {listWarning.length !== 0 &&
        <Card.Footer>
          {/*<p className={'mb-2'}><Trans i18nKey={'dataframe-plot.info'} /></p>*/}
          <DFPListWarnings />
        </Card.Footer>}
    </Card>


    {/*<DebugJSON obj={dataframePlotConfig} />*/}
    <DataFramePlotModalDescription />
    <DataFramePlotModalConfiguration />
  </>
}