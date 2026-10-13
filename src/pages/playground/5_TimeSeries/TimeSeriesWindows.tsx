import { useMemo } from 'react'
import { Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { firstTarget, testStartOf, type SeriesPrep_t } from '@core/timeSeries/series'

import { prefix } from './timeSeriesConfig'

/** Cuántos ejemplos se enseñan y, en una ventana larga, cuántos valores de cada extremo */
const EXAMPLES = 3
const EDGE = 3

type TimeSeriesWindowsProps = {
  dates : string[]
  values: number[]
  prep  : SeriesPrep_t
}

/**
 * Lo que aprende la red: las primeras ventanas de entrenamiento, cada una con los valores anteriores (o sus cambios, al
 * diferenciar) que recibe y el que tiene que predecir, sin escalar para que se lean bien
 */
export default function TimeSeriesWindows({ dates, values, prep }: TimeSeriesWindowsProps) {
  const { t, i18n } = useTranslation()
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }), [i18n.language])
  const signed = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3, signDisplay: 'exceptZero' }), [i18n.language])
  const testStart = testStartOf(values.length, prep.testSize)
  const first = firstTarget(prep)

  const examples = Array.from({ length: Math.max(0, Math.min(EXAMPLES, testStart - first)) }, (_value, i) => {
    const target = first + i
    const at = (position: number) => (prep.difference ? values[position] - values[position - 1] : values[position])
    const inputs = Array.from({ length: prep.window }, (_item, k) => at(target - prep.window + k))
    const format = (value: number) => (prep.difference ? signed : number).format(value)
    const shown = inputs.length > 2 * EDGE + 1 ? [...inputs.slice(0, EDGE).map(format), '…', ...inputs.slice(-EDGE).map(format)] : inputs.map(format)
    return { date: dates[target], inputs: shown.join(', '), output: format(at(target)) }
  })
  if (examples.length === 0) return null

  return (
    <section data-testid={'Test-TimeSeries-Windows'} data-guide={'windows'}>
      <h4 className={'h6'}>{t(prefix + 'windows.title')}</h4>
      <p className={'small text-body-secondary'}>{t(prefix + (prep.difference ? 'windows.text-difference' : 'windows.text'), { window: prep.window })}</p>
      <div className={'table-responsive'}>
        <Table size={'sm'} className={'mb-0'}>
          <thead>
            <tr>
              <th scope={'col'}>{t(prefix + 'windows.date')}</th>
              <th scope={'col'}>{t(prefix + (prep.difference ? 'windows.inputs-difference' : 'windows.inputs'), { window: prep.window })}</th>
              <th scope={'col'} className={'text-end'}>{t(prefix + (prep.difference ? 'windows.output-difference' : 'windows.output'))}</th>
            </tr>
          </thead>
          <tbody>
            {examples.map(({ date, inputs, output }) => (
              <tr key={date}>
                <td className={'text-nowrap'}>{date}</td>
                <td className={'font-monospace small'}>{inputs}</td>
                <td className={'text-end font-monospace'}>{output}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <p className={'small text-body-secondary mt-2 mb-0'}>{t(prefix + 'windows.scaled', { count: testStart - first })}</p>
    </section>
  )
}
