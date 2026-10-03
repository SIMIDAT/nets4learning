import { useMemo } from 'react'
import { Col, Form, Row, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'

import { bestModelIndex, changedParameters, historyCurves, type ModelParameters_t, type TrainingLogs_t } from '@core/history/trainingSummary'
import { N4LBestBadge } from '@components/neural-network/N4LFinalMetrics'

/** Como mucho se comparan tantos modelos a la vez (con más, las gráficas no se leen) */
const MAX_COMPARED = 4
// Un color por modelo: entrenamiento con línea continua y validación discontinua, como en las curvas de uno
const COLORS = ['#0d6efd', '#fd7e14', '#198754', '#d63384']

type N4LModelComparisonProps = {
  histories : TrainingLogs_t[]
  /** Hiperparámetros de cada modelo (mismo orden que `histories`), con las claves de generator.table-models.* */
  parameters: ModelParameters_t[]
  /** Los modelos elegidos (índices) */
  compared  : number[]
  onChange  : (compared: number[]) => void
}

/**
 * Varios modelos a la vez: sus curvas superpuestas (un color cada uno) y una tabla con sus hiperparámetros, marcando
 * los que cambian, y cómo terminó cada uno. Dice también qué se puede concluir: si solo cambia una cosa, la diferencia
 * se debe a eso; si cambian varias, no se sabe cuál ha influido.
 */
export default function N4LModelComparison({ histories, parameters, compared, onChange }: N4LModelComparisonProps) {
  const { t, i18n } = useTranslation()
  const prefix = 'pages.playground.generator.training.'
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 3 }), [i18n.language])

  const models = compared.filter((index) => index < histories.length).sort((a, b) => a - b)
  const curves = models.map((index) => historyCurves(histories[index]))
  const best = models.length > 1 ? models[bestModelIndex(models.map((index) => histories[index]))] : -1
  const names = Object.keys(parameters[models[0]] ?? {})
  const changed = changedParameters(models.map((index) => parameters[index]))
  const label = (name: string) => t('generator.table-models.' + name)
  const quoted = (name: string) => t(prefix + 'compare-quote', { name: label(name) })
  const list = new Intl.ListFormat(i18n.language, { type: 'conjunction' })

  const toggle = (index: number) => {
    onChange(compared.includes(index) ? compared.filter((i) => i !== index) : [...compared, index])
  }
  const finalValue = (values: number[] | null) => {
    const last = values?.at(-1)
    return last === undefined ? '' : Number.isFinite(last) ? number.format(last) : '-'
  }

  return (
    <div data-testid={'Test-ModelComparison'}>
      <fieldset className={'mb-2'}>
        <legend className={'small fw-semibold mb-1'}>{t(prefix + 'compare-pick', { max: MAX_COMPARED })}</legend>
        {histories.map((_logs, index) => (
          <Form.Check key={index} inline={true} type={'checkbox'} id={'n4l-compare-' + index}
            label={t('model.__index__', { index: index + 1 })}
            checked={models.includes(index)}
            disabled={!models.includes(index) && models.length >= MAX_COMPARED}
            onChange={() => toggle(index)} />
        ))}
      </fieldset>

      {models.length < 2 && <p className={'text-body-secondary small'}>{t(prefix + 'compare-pick-more')}</p>}
      {models.length >= 2 && <>
        <p className={'small'} data-testid={'Test-ModelComparison-Summary'}>
          {changed.length === 0 && t(prefix + 'compare-same')}
          {changed.length === 1 && t(prefix + 'compare-one', { name: quoted(changed[0]) })}
          {changed.length > 1 && t(prefix + 'compare-some', { names: list.format(changed.map(quoted)) })}
        </p>
        <Row xs={1} lg={2} className={'g-3'}>
          {curves[0].map(({ name }) => {
            const epochs = Math.max(...curves.map((model) => model.find((curve) => curve.name === name)?.train.length ?? 0))
            return (
              <Col key={name}>
                <div className={'n4l-training-curve'}>
                  <p className={'small fw-semibold mb-1'}>{name}</p>
                  <Line
                    options={{
                      responsive : true,
                      animation  : false,
                      interaction: { mode: 'index', intersect: false },
                      scales     : { x: { title: { display: true, text: t(prefix + 'epoch-axis') } } },
                    }}
                    data={{
                      labels  : Array.from({ length: epochs }, (_value, epoch) => epoch + 1),
                      datasets: models.flatMap((index, position) => {
                        const curve = curves[position].find((item) => item.name === name)
                        if (curve === undefined) return []
                        const color = COLORS[position % COLORS.length]
                        const model = t('model.__index__', { index: index + 1 })
                        return [
                          { label: model + ' · ' + t(prefix + 'train'), data: curve.train, borderColor: color, backgroundColor: color, pointRadius: 1 },
                          ...(curve.validation === null ? [] : [{
                            label          : model + ' · ' + t(prefix + 'validation'),
                            data           : curve.validation,
                            borderColor    : color,
                            backgroundColor: color,
                            borderDash     : [6, 4],
                            pointRadius    : 1,
                          }]),
                        ]
                      }),
                    }}
                  />
                </div>
              </Col>
            )
          })}
        </Row>

        <Table size={'sm'} responsive={true} className={'mt-3 mb-0 align-middle'} data-testid={'Test-ModelComparison-Table'}>
          <caption className={'small'}>{t(prefix + 'compare-caption')}</caption>
          <thead>
            <tr>
              <th scope={'col'}>{t(prefix + 'compare-parameter')}</th>
              {models.map((index, position) => (
                <th key={index} scope={'col'} className={'text-nowrap'}>
                  <span className={'n4l-compare-swatch'} style={{ backgroundColor: COLORS[position % COLORS.length] }} aria-hidden={true} />
                  {t('model.__index__', { index: index + 1 })}
                  {index === best && <N4LBestBadge />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((name) => {
              const isChanged = changed.includes(name)
              return (
                <tr key={name} className={isChanged ? 'table-warning' : undefined} data-changed={isChanged}>
                  <th scope={'row'} className={'fw-normal'}>
                    {label(name)}
                    {isChanged && <span className={'badge text-bg-warning ms-1'}>{t(prefix + 'compare-changed')}</span>}
                  </th>
                  {models.map((index) => <td key={index}><small>{parameters[index][name]}</small></td>)}
                </tr>
              )
            })}
            {curves[0].map(({ name }) => (
              <tr key={'final-' + name}>
                <th scope={'row'} className={'fw-normal'}>{t(prefix + 'compare-final', { name })}</th>
                {models.map((index, position) => {
                  const curve = curves[position].find((item) => item.name === name)
                  return (
                    <td key={index} className={index === best && name === 'loss' ? 'fw-semibold' : undefined}>
                      <small>{finalValue(curve?.train ?? null)}{curve?.validation && ` (${finalValue(curve.validation)})`}</small>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </>}
    </div>
  )
}
