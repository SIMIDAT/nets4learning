import styles from './Regression.module.css'
import { useEffect, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import { Card, Form, Accordion } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import { useRegressionContext } from '@context/useRegressionContext'
import N4LEmptyState from '@components/loading/N4LEmptyState'

/**
 * 
 * @deprecated
 */
export default function RegressionEditorFeaturesSelector() {

  const prefix = 'pages.playground.generator.editor-feature-selector.'
  const {
    datasets,
    params,
    setParams,
  } = useRegressionContext()


  const show = useMemo(() => (
    datasets?.data?.length > 0 &&
    datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX &&
    datasets.index >= 0 &&
    datasets.data[datasets.index]?.is_dataset_processed
  ), [datasets]);

  const handleChange_FeatureSelector_Y = (event_Y_target: ChangeEvent<HTMLSelectElement>) => {
    setParams((prevState) => {
      // Añades el antiguo target a la lista de características 
      prevState.params_features.X_features.add(prevState.params_features.Y_target)
      // Eliminas de la lista de características el nuevo objetivo
      prevState.params_features.X_features.delete(event_Y_target.target.value)

      return Object.assign({}, prevState, {
        params_features: {
          ...prevState.params_features,
          X_features: prevState.params_features.X_features,
          Y_target  : event_Y_target.target.value,
        }
      })
    })
  }

  const handleChange_FeatureSelector_X = (event_X_features: ChangeEvent<HTMLInputElement>, column_name: string) => {
    setParams((prevState) => {
      if (event_X_features.target.checked === false) {
        prevState.params_features.X_features.delete(column_name)
      } else {
        prevState.params_features.X_features.add(column_name)
      }

      return Object.assign({}, prevState, {
        params_features: {
          ...prevState.params_features,
          X_features: prevState.params_features.X_features,
        }
      })
    })
  }

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [datasetLocal.dataframe_processed, setParams]')
    if (datasets && datasets.data.length > 0 && datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX && datasets.index >= 0 && datasets.data[datasets.index].is_dataset_processed) {
      setParams((prevState) => {
        const _index: number = datasets.index as number
        const { dataframe_processed, data_processed } = datasets.data[_index]
        // Lo que de verdad usa el entrenamiento (data_processed): el objetivo no siempre es la última columna
        // (California housing lo tiene en la primera)
        const Y_target = data_processed?.column_name_target ?? dataframe_processed.columns[dataframe_processed.columns.length - 1]
        const X_features = new Set(data_processed?.dataframe_X.columns ?? dataframe_processed.columns)
        X_features.delete(Y_target)

        return Object.assign({}, prevState, {
          params_features: {
            X_features: X_features,
            Y_target  : Y_target
          }
        })
      })
    }
  }, [datasets, setParams])

  if (VERBOSE) console.debug('render RegressionEditorFeaturesSelector')
  return <>
    <Card style={{ 'display': 'none' }}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
        {/*
        <div className={'d-flex'}>
          <Button onClick={() => handlerClick_AddFeature()}
                  size={'sm'}
                  variant="outline-primary">
            <Trans i18nKey={prefix + 'add-feature'} />
          </Button>
        </div>
        */}
      </Card.Header>
      <Card.Body>
        {!show && <>
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />
        </>}
        {show && <>
          <Accordion defaultActiveKey="Target">
            <Accordion.Item eventKey="Target">
              <Accordion.Header><Trans i18nKey={prefix + 'feature-selector-y'} /></Accordion.Header>
              <Accordion.Body>
                <Form.Group controlId={'feature-selector-y'}>
                  <Form.Label>
                    <Trans i18nKey={prefix + 'feature-selector-y'} />
                  </Form.Label>
                  <Form.Select
                    className={styles.border_green}
                    value={params.params_features.Y_target}
                    onChange={(e) => handleChange_FeatureSelector_Y(e)}>
                    <>
                      {datasets
                        .data[datasets.index]
                        .dataframe_processed
                        .columns
                        .map((value: string, index: number) => {
                          return (<option key={index} value={value}>{value} - {datasets.data[datasets.index].dataframe_processed.dtypes[index]}</option>)
                        })}
                    </>
                  </Form.Select>
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="Features">
              <Accordion.Header><Trans i18nKey={prefix + 'feature-selector-x'} /></Accordion.Header>
              <Accordion.Body>
                {datasets
                  .data[datasets.index]
                  .dataframe_processed
                  .columns
                  .map((column_name: string) => (
                    <div key={`column-${column_name}`}>
                      <Form.Check
                        type={'switch'}
                        checked={params.params_features.X_features.has(column_name)}
                        disabled={column_name === params.params_features.Y_target}
                        id={`column-${column_name}`}
                        label={`${column_name}`}
                        onChange={(e) => handleChange_FeatureSelector_X(e, column_name)} />
                    </div>
                  ))}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </>}

      </Card.Body>
    </Card>
  </>
}