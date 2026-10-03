import { useEffect, useRef, useState } from 'react'
import { Card, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import N4LLatex from '@components/latex/N4LLatex'
import { termCharacteristics, termTitle, type GlossaryTerm_t } from './glossaryTerms'
import { ACTIVATION_FUNCTIONS } from './activationFunctions'
import GlossaryActivationPlot from './GlossaryActivationPlot'

/**
 * Una fórmula, que en pantallas estrechas puede no caber y desplazarse en horizontal: entonces se puede enfocar, para
 * recorrerla también con el teclado (solo entonces: con todas, habría decenas de paradas al tabular).
 */
function GlossaryFormula({ children }: { children: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (element === null) return
    const check = () => setIsScrollable(element.scrollWidth > element.clientWidth)
    check()
    // La fórmula se ensancha al llegar las fuentes de KaTeX, sin que cambie el tamaño de su caja
    void document.fonts?.ready.then(check)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(check)
    observer.observe(element)
    element.querySelectorAll('.katex').forEach((formula) => observer.observe(formula))
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={'n4l-glossary-formula'} tabIndex={isScrollable ? 0 : undefined}>
      <N4LLatex>{children}</N4LLatex>
    </div>
  )
}

const CONFUSION = ['tp', 'tn', 'fp', 'fn'] as const
const CONFUSION_EN = { tp: 'True Positive', tn: 'True Negative', fp: 'False Positive', fn: 'False Negative' }

/** TP, TN, FP y FN de las fórmulas de la matriz de confusión */
function ConfusionLegend() {
  const { t } = useTranslation()
  const prefix = 'pages.glossary.confusion-legend.'
  return (
    <Table size={'sm'} className={'mt-3 mb-0 small'}>
      <thead>
        <tr>
          <th>{t(prefix + 'abbreviation')}</th>
          <th>{t(prefix + 'english')}</th>
          <th>{t(prefix + 'meaning')}</th>
        </tr>
      </thead>
      <tbody>
        {CONFUSION.map((key) => (
          <tr key={key}>
            <td className={'font-monospace'}>{key.toUpperCase()}</td>
            <td lang={'en'}>{CONFUSION_EN[key]}</td>
            <td>{t(prefix + key)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/**
 * Un término del glosario: título con enlace a sí mismo, descripción, características, fórmulas (con sus notas), gráfica
 * y referencia. `headingLevel`: h3 si va directamente en su apartado, h4 dentro de un grupo con título.
 */
export default function GlossaryTerm({ term, headingLevel = 3 }: { term: GlossaryTerm_t, headingLevel?: 3 | 4 }) {
  const { t } = useTranslation()
  const title = termTitle(term, t)
  const characteristics = termCharacteristics(term, t)
  const activation = term.activation === undefined ? undefined : ACTIVATION_FUNCTIONS[term.activation]
  const Heading = headingLevel === 3 ? 'h3' : 'h4'
  const anchor = 'glossary-' + term.id

  return (
    <Card as={'article'} id={anchor} className={'h-100 n4l-glossary-term'} data-testid={'Test-GlossaryTerm'}>
      <Card.Body>
        <Heading className={'h5 n4l-glossary-term-title'}>
          {title}
          <a href={'#' + anchor} className={'n4l-glossary-anchor'} aria-label={t('pages.glossary.anchor', { term: title })}>#</a>
        </Heading>
        {term.paragraphKeys.map((key) => <p key={key}><Trans i18nKey={key} /></p>)}
        {characteristics.length > 0 &&
          <ul className={'n4l-glossary-characteristics'}>
            {characteristics.map((characteristic, index) => <li key={index}>{characteristic}</li>)}
          </ul>}
        {term.math !== undefined &&
          <div className={'n4l-glossary-math'}>
            {term.math.map((item, index) => typeof item === 'string'
              ? <GlossaryFormula key={index}>{item}</GlossaryFormula>
              : <div key={index} className={'small text-body-secondary'}><N4LLatex>{t(item.noteKey)}</N4LLatex></div>)}
          </div>}
        {term.confusionLegend && <ConfusionLegend />}
        {term.image !== undefined && (activation !== undefined
          ? <GlossaryActivationPlot id={term.id} image={term.image} imageAlt={t('pages.glossary.plot', { term: title })} activation={activation} />
          : <div className={'n4l-glossary-plot'}>
            <img src={term.image} alt={t('pages.glossary.plot', { term: title })} loading={'lazy'} />
          </div>)}
        {term.reference !== undefined &&
          <a href={term.reference.href} target={'_blank'} rel={'noreferrer'} className={'small link-secondary d-inline-block mt-2'}>
            {term.reference.label} ↗
          </a>}
      </Card.Body>
    </Card>
  )
}
