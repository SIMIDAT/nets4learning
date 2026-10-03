import { Modal } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { useContext, useMemo } from 'react'
import DataFramePlotContext from '../_context/DataFramePlotContext'
import { VERBOSE } from '@/CONSTANTS'

type PlotDescriptionType = {
  plot_intro: string[]
  plot_list : string[]
  plot_end  : string[]
}
export default function DataFramePlotModalDescription() {
  const {
    dataframePlotConfig,

    showDescription,
    setShowDescription,
  } = useContext(DataFramePlotContext)
  const URL = 'https://danfo.jsdata.org/api-reference/plotting'

  const { t } = useTranslation()

  const plotDescription = useMemo<PlotDescriptionType>(() => {
    if (VERBOSE) console.debug('useMemo [ plotDescription ]')
    const prefix = `dataframe-plot.${dataframePlotConfig.PLOT_ENABLE}.description.`
    return {
      plot_intro: Object.values(t(prefix + 'intro', { returnObjects: true, defaultValue: {} })),
      plot_list : Object.values(t(prefix + 'list', { returnObjects: true, defaultValue: {} })),
      plot_end  : Object.values(t(prefix + 'end', { returnObjects: true, defaultValue: {} })),
    }
  }, [dataframePlotConfig.PLOT_ENABLE, t])

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
              link1: <a href={URL} target={'_blank'} rel="noreferrer">link</a>
            }} />
        </p>
      </Modal.Footer>
    </Modal>
  </>
}