import { Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { confusionMatrix, confusionStats } from '@core/history/trainingSummary'
import HelpTerm from '@components/helpLink/N4LHelpTerm'

type N4LConfusionMatrixProps = {
  classes    : string[]
  /** Clase real y predicha (índices) de cada ejemplo de validación */
  labels     : number[]
  predictions: number[]
}

/** Fondo de una celda: verde en los aciertos y rojo en los errores, más intenso cuanto mayor es la parte de su fila */
const cellBackground = (count: number, rowTotal: number, isHit: boolean) => {
  if (count === 0 || rowTotal === 0) return undefined
  const alpha = 0.12 + 0.6 * (count / rowTotal)
  return `rgba(var(--bs-${isHit ? 'success' : 'danger'}-rgb), ${alpha.toFixed(2)})`
}

/** Matriz de confusión del conjunto de validación, con la sensibilidad de cada clase real y la precisión de cada predicha */
export default function N4LConfusionMatrix({ classes, labels, predictions }: N4LConfusionMatrixProps) {
  const { t, i18n } = useTranslation()
  const prefix = 'pages.playground.generator.training.'
  const help = 'pages.playground.generator.help.'
  const matrix = confusionMatrix(labels, predictions, classes.length)
  const { support, recall, precision, correct, total, accuracy } = confusionStats(matrix)
  const percentFormat = new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 })
  const percent = (value: number | null) => (value === null ? '—' : percentFormat.format(value))

  return (
    <div className={'mt-4'} data-testid={'Test-ConfusionMatrix'}>
      <h4 className={'h6 text-center mb-1'}>{t(prefix + 'confusion-title')}</h4>
      <p className={'small text-body-secondary text-center mb-3'}>
        {t(prefix + 'confusion-accuracy', { accuracy: percent(accuracy), correct, total })}
      </p>
      <Table bordered={true} responsive={true} className={'n4l-confusion-matrix w-auto mx-auto'}>
        <thead>
          <tr>
            <th colSpan={2} rowSpan={2} className={'n4l-confusion-corner'} />
            <th colSpan={classes.length} scope={'colgroup'}>{t(prefix + 'confusion-predicted')}</th>
            <th rowSpan={2} scope={'col'}>{t(prefix + 'confusion-total')}</th>
            <th rowSpan={2} scope={'col'}>
              <HelpTerm label={t(prefix + 'confusion-recall')} help={t(help + 'recall')} />
            </th>
          </tr>
          <tr>
            {classes.map((name) => <th key={name} scope={'col'}>{t(name)}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, real) => (
            <tr key={real}>
              {real === 0 &&
                <th rowSpan={classes.length} scope={'rowgroup'} className={'n4l-confusion-axis'}>
                  <span>{t(prefix + 'confusion-real')}</span>
                </th>
              }
              <th scope={'row'}>{t(classes[real])}</th>
              {row.map((count, predicted) => (
                <td key={predicted} style={{ backgroundColor: cellBackground(count, support[real], real === predicted) }}
                  data-testid={`Test-ConfusionMatrix-${real}-${predicted}`}>
                  <span className={'n4l-confusion-count'}>{count}</span>
                  <span className={'n4l-confusion-percent'}>{support[real] > 0 ? percent(count / support[real]) : '—'}</span>
                </td>
              ))}
              <td className={'text-body-secondary'}>{support[real]}</td>
              <td className={'fw-semibold'}>{percent(recall[real])}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={2} scope={'row'}>
              <HelpTerm label={t(prefix + 'confusion-precision')} help={t(help + 'precision')} />
            </th>
            {precision.map((value, predicted) => <td key={predicted} className={'fw-semibold'}>{percent(value)}</td>)}
            <td className={'text-body-secondary'}>{total}</td>
            <td className={'fw-bold'}>
              <HelpTerm label={percent(accuracy)} help={t(help + 'accuracy')} />
            </td>
          </tr>
        </tfoot>
      </Table>
      <p className={'small text-body-secondary text-center mb-0'}>{t(prefix + 'confusion-legend')}</p>
    </div>
  )
}
