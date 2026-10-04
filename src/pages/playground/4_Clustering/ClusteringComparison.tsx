import { useMemo } from 'react'
import { Badge, Card, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import type { LabelComparison_t } from '@core/clustering/kmeans'
import HelpTerm from '@components/helpLink/N4LHelpTerm'

import { clusterColor } from './clusterColors'

const prefix = 'pages.playground.clustering.'

/** Cómo leer el índice de Rand ajustado: a partir de qué valor cada frase */
const ARI_LEVELS: [number, string][] = [[0.8, 'high'], [0.5, 'medium'], [0.2, 'low']]

/** Fondo de una celda: más intenso cuanto mayor parte del grupo es de esa clase */
const cellBackground = (count: number, size: number) =>
  count === 0 || size === 0 ? undefined : `rgba(var(--bs-success-rgb), ${(0.1 + 0.5 * (count / size)).toFixed(2)})`

type ClusteringComparisonProps = {
  comparison : LabelComparison_t
  /** La columna con las clases reales */
  labelColumn: string
}

/**
 * Los grupos frente a las clases reales, como una matriz de confusión: cuántas filas de cada clase hay en cada grupo y
 * qué parte del grupo son, la clase mayoritaria de cada grupo (y si es una mezcla), los totales, la pureza y el índice
 * de Rand ajustado con lo que quieren decir
 */
export default function ClusteringComparison({ comparison, labelColumn }: ClusteringComparisonProps) {
  const { t, i18n } = useTranslation()
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 0 }), [i18n.language])
  const percentPrecise = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }), [i18n.language])
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }), [i18n.language])
  const { classes, table, classTotals, groups, purity, ari } = comparison
  const rows = classTotals.reduce((sum, total) => sum + total, 0)
  const ariLevel = ARI_LEVELS.find(([minimum]) => ari >= minimum)?.[1] ?? 'none'
  const title = t(prefix + 'comparison-title', { column: labelColumn })

  return (
    <Card className={'mb-3'} data-testid={'Test-Clustering-Comparison'}>
      <Card.Header><h2 className={'h5 mb-0'}>{title}</h2></Card.Header>
      <Card.Body>
        <p className={'small'}>{t(prefix + 'comparison-help')}</p>

        <div className={'d-flex flex-wrap align-items-center column-gap-4 row-gap-2 mb-3'} data-testid={'Test-Clustering-Agreement'}>
          <div>
            <div className={'small text-body-secondary'}><HelpTerm label={t(prefix + 'purity')} help={t(prefix + 'purity-help')} /></div>
            <div className={'fs-4'}>{percentPrecise.format(purity)}</div>
          </div>
          <div>
            <div className={'small text-body-secondary'}><HelpTerm label={t(prefix + 'ari')} help={t(prefix + 'ari-help')} /></div>
            <div className={'fs-4'}>{number.format(ari)}</div>
          </div>
          <p className={'mb-0 n4l-cluster-agreement'}>{t(prefix + 'ari-' + ariLevel)}</p>
        </div>

        {/* Con muchas clases se desplaza: con el teclado también */}
        <div className={'table-responsive'} tabIndex={0} role={'region'} aria-label={title}>
          <Table bordered={true} className={'n4l-confusion-matrix n4l-cluster-comparison w-auto mb-2'}>
            <thead>
              <tr>
                <th rowSpan={2} scope={'col'} className={'align-bottom'}>{t(prefix + 'group')}</th>
                <th colSpan={classes.length} scope={'colgroup'}>{labelColumn}</th>
                <th rowSpan={2} scope={'col'} className={'align-bottom'}>{t(prefix + 'size')}</th>
                <th rowSpan={2} scope={'col'} className={'align-bottom'}>{t(prefix + 'majority')}</th>
              </tr>
              <tr>{classes.map((name) => <th key={name} scope={'col'}>{name}</th>)}</tr>
            </thead>
            <tbody>
              {table.map((row, cluster) => {
                const { size, majority, share, isMixed } = groups[cluster]
                return (
                  <tr key={cluster} data-testid={`Test-Clustering-Comparison-Group-${cluster + 1}`}>
                    <th scope={'row'} className={'text-start text-nowrap'}>
                      <span className={'n4l-compare-swatch'} style={{ backgroundColor: clusterColor(cluster) }} aria-hidden={true} />
                      {t(prefix + 'cluster', { number: cluster + 1 })}
                    </th>
                    {row.map((count, column) => (
                      <td key={column} style={{ backgroundColor: cellBackground(count, size) }}>
                        <span className={'n4l-confusion-count' + (count === 0 ? ' text-body-secondary fw-normal' : '')}>{count}</span>
                        {count > 0 && <span className={'n4l-confusion-percent'}>{percent.format(count / size)}</span>}
                      </td>
                    ))}
                    <td className={'text-body-secondary'}>{size}</td>
                    <td className={'text-start text-nowrap'}>
                      {size === 0 ? '—' : <>
                        <span className={'fw-semibold'}>{classes[majority]}</span> · {percent.format(share)}
                        {isMixed && <Badge bg={'warning'} text={'dark'} className={'ms-2'}>{t(prefix + 'mixed')}</Badge>}
                      </>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope={'row'} className={'text-start'}>{t(prefix + 'total')}</th>
                {classTotals.map((total, column) => <td key={column} className={'text-body-secondary'}>{total}</td>)}
                <td className={'text-body-secondary'}>{rows}</td>
                <td className={'text-start fw-semibold'}>{t(prefix + 'purity')}: {percentPrecise.format(purity)}</td>
              </tr>
            </tfoot>
          </Table>
        </div>
        <p className={'small text-body-secondary mb-0'}>{t(prefix + 'comparison-legend')}</p>
      </Card.Body>
    </Card>
  )
}
