import { useMemo } from 'react'
import { Button, Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import alertHelper from '@utils/alertHelper'
import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import {
  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_OF_EPOCHS,
  DEFAULT_TEST_SIZE,
} from './CONSTANTS'
import { HyperparameterNumber, HyperparameterSelect, LossOptions, MetricsList, OptimizerOptions } from '@components/neural-network/N4LHyperparameterFields'
import { useRegressionContext } from '@context/useRegressionContext'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'

export default function RegressionEditorHyperparameters() {

  const prefix = 'pages.playground.generator.general-parameters.'
  const { t } = useTranslation()
  const {
    datasets,

    params,
    setParams,
  } = useRegressionContext()


  const show = useMemo(() => {
    if (!datasets) return false

    const { index, data } = datasets

    return (
      data.length > 0 &&
      index !== DEFAULT_SELECTOR_DATASET_INDEX &&
      index >= 0 &&
      index < data.length &&
      data[index].is_dataset_processed
    )
  }, [datasets])


  // 1 - 100
  const handlerChange_TestSize = (_test_size: number) => {
    change_params_training('test_size', _test_size)
  }

  // 1 - 100
  const handlerChange_LearningRate = (_learning_rate: number) => {
    change_params_training('learning_rate', _learning_rate)
  }

  // 1 - Inf(1000)
  const handlerChange_NumberOfEpochs = (_number_of_epochs: number) => {
    change_params_training('n_of_epochs', _number_of_epochs)
  }

  const handlerClick_RemoveMetric = async (index: number) => {
    const new_list_id_metrics = [...params.params_training.list_id_metrics]
    if (new_list_id_metrics.length > 1) {
      new_list_id_metrics.splice(index, 1)
      change_params_training('list_id_metrics', new_list_id_metrics)
    } else {
      await alertHelper.alertWarning(t('error.metrics-length'))
    }
  }

  const handleChange_Metric = (index: number, value: string) => {
    const _value: IdMetric_t = value as IdMetric_t
    const new_list_id_metrics = [...params.params_training.list_id_metrics]
    new_list_id_metrics[index] = _value
    change_params_training('list_id_metrics', new_list_id_metrics)
  }

  const handlerClick_AddMetric_End = (_: React.MouseEvent<HTMLButtonElement>) => {
    const new_metric = 'metrics-meanSquaredError'
    change_params_training('list_id_metrics', [...params.params_training.list_id_metrics, new_metric])
  }

  const change_params_training = (_key: string, _value: any) => {
    setParams((prevState) => {
      return {
        ...prevState,
        params_training: {
          ...prevState.params_training,
          [_key]: _value,
        },
      }
    })
  }

  if (VERBOSE) console.debug('render RegressionEditorTrainer')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
        <div className={'d-flex'}>
          <Button
            variant={'outline-primary'}
            disabled={show === false}
            size={'sm'}
            onClick={handlerClick_AddMetric_End}>
            <Trans i18nKey={prefix + 'add-metric'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {!show && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />
        </>}
        {show && <>
          <HyperparameterNumber controlId={'FormControl_Trainer-LearningRate'} name="learning-rate" min={1} max={100}
            defaultValue={DEFAULT_LEARNING_RATE} onChange={handlerChange_LearningRate} />
          <HyperparameterNumber controlId={'FormControl_Trainer_n_of_epochs'} name="number-of-epochs" min={1} max={1000}
            defaultValue={DEFAULT_NUMBER_OF_EPOCHS} onChange={handlerChange_NumberOfEpochs} />
          <HyperparameterNumber controlId={'FormControl_Trainer_train_rate'} name="train-rate" min={1} max={100}
            defaultValue={DEFAULT_TEST_SIZE} onChange={handlerChange_TestSize} />
          <hr />
          <HyperparameterSelect controlId={'FormControl_IdOptimizer'} label="optimizer-id" info="optimizer-id-info"
            value={params.params_training.id_optimizer} onChange={(value) => change_params_training('id_optimizer', value as IdOptimizer_t)}>
            <OptimizerOptions valuePrefix={'train-'} />
          </HyperparameterSelect>
          <hr />
          <HyperparameterSelect controlId={'FormControl_IdLoss'} label="loss-id" info="loss-id-info"
            value={params.params_training.id_loss} onChange={(value) => change_params_training('id_loss', value as IdLoss_t)}>
            <LossOptions />
          </HyperparameterSelect>
          <hr />
          <MetricsList
            metrics={params.params_training.list_id_metrics}
            onChange={handleChange_Metric}
            onRemove={handlerClick_RemoveMetric}
            valuePrefix={'metrics-'} />
        </>}
      </Card.Body>
    </Card>
  </>
}