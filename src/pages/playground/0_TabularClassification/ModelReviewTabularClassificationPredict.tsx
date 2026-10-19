import { Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LClassificationChart from '@components/neural-network/N4LClassificationChart'
type ModelReviewTabularClassificationPredictProps = {
  prediction: {
    labels: string[]
    data  : number[]
  }
  /** Clase real (posición en labels), si lo clasificado es un ejemplo o una fila del conjunto de datos */
  actualIndex?: number | null
}
export default function ModelReviewTabularClassificationPredict(props: ModelReviewTabularClassificationPredictProps) {

  const { prediction, actualIndex = null } = props
  const { t } = useTranslation()

  if (VERBOSE) console.debug('render ModelReviewTabularClassificationPredict')
  return <>
    <Card className={'mt-3'} data-testid={'Test-ModelReviewTabularClassificationPredict'} data-guide={'result'}>
      <Card.Header>
        <h3>
          <Trans i18nKey={'Classify'} />
        </h3>
      </Card.Header>
      <Card.Body>
        {prediction.data.length === 0 && <N4LEmptyState i18nKey={'pages.playground.generator.classify.waiting'} />}
        {prediction.data.length > 0 && <N4LClassificationChart values={prediction.data}
          classLabels={prediction.labels.map((label) => t(label))}
          actualIndex={actualIndex} />}
      </Card.Body>
    </Card>
  </>
}
