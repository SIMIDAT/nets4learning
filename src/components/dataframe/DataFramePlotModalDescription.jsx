import { Modal } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import DataFramePlotContext from '../_context/DataFramePlotContext'

export default function DataFramePlotModalDescription () {
  const {
    dataframePlotConfig,

    showDescription,
    setShowDescription,
  } = useContext(DataFramePlotContext)
  const URL = 'https://danfo.jsdata.org/api-reference/plotting'

  const [plotDescription, setPlotDescription] = useState({
    plot_intro: [],
    plot_list : [],
    plot_end  : []
  })
  const { t } = useTranslation()

  const descriptionPlot = useCallback(() => {
    const prefix = `dataframe-plot.${dataframePlotConfig.PLOT_ENABLE}.description.`
    const plot_intro = Object.values(t(prefix + 'intro', { returnObjects: true, defaultValue: {} }))
    const plot_list = Object.values(t(prefix + 'list', { returnObjects: true, defaultValue: {} }))
    const plot_end = Object.values(t(prefix + 'end', { returnObjects: true, defaultValue: {} }))
    setPlotDescription({
      plot_intro,
      plot_list,
      plot_end
    })
  }, [dataframePlotConfig.PLOT_ENABLE, t, setPlotDescription])

  useEffect(() => {
    console.debug('useEffect [ descriptionPlot() ]')
    descriptionPlot()
  }, [descriptionPlot])

  return <>
    <Modal show={showDescription} onHide={() => setShowDescription(false)} size={'xl'} fullscreen={'md-down'}>
      <Modal.Header closeButton>
        <Modal.Title><Trans i18nKey={`dataframe-plot.${dataframePlotConfig.PLOT_ENABLE}.title`} /></Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <>
          {plotDescription.plot_intro.map((value, index) => {
            return <p key={index}>{value}</p>
          })}
        </>
        <ol>
          {plotDescription.plot_list.map((value, index) => {
            return <li key={index}>{value}</li>
          })}
        </ol>
        <>
          {plotDescription.plot_end.map((value, index) => {
            return <p key={index}>{value}</p>
          })}
        </>


      </Modal.Body>
      <Modal.Footer>
        <p className={'text-muted'}>
          <Trans i18nKey={'dataframe.plot.link'}
                 components={{
                   link1: <a href={URL} target={'_blank'} rel="noreferrer" className={'text-info'}>link</a>
                 }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}