import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import type { N4LManifest_t } from '@core/n4l/format'

/** La descripción en los textos del paquete: párrafos y apartados desplegables (con su texto y su lista) */
type Description_t = {
  text?    : string[]
  sections?: Array<{ title: string, text?: string[], items?: string[] }>
}

type N4LPackageDescriptionProps = {
  manifest : N4LManifest_t
  namespace: string
  task     : string
  /** Lo propio de la tarea, después de los párrafos (la tabla de caracteres de KMNIST…) */
  children?: ReactNode
}

/**
 * La descripción de un paquete .n4l en una tarea, de sus textos (locales/<idioma>.json, tasks.<tarea>.description):
 * admite <b>, <i>… y <link1>, que enlaza a la fuente del conjunto de datos, y las métricas de su primer modelo
 * ({{test_accuracy}}…). Al final, la cita en BibTeX del manifiesto
 */
export default function N4LPackageDescription({ manifest, namespace: ns, task, children }: N4LPackageDescriptionProps) {
  const { t } = useTranslation(ns)
  const prefix = `tasks.${task}.description`
  const description = t(prefix, { ns, returnObjects: true }) as Description_t | string
  // <link1>: la fuente; <link2>…, las otras direcciones del paquete
  const link = (href: string | undefined) => (href === undefined ? <span /> : <a href={href} target={'_blank'} rel={'noreferrer'} />)
  const components = {
    link1: link(manifest.source?.url),
    ...Object.fromEntries(Object.entries(manifest.source?.links ?? {}).map(([name, href]) => [name, link(href)])),
  }
  const values = manifest.tasks.find((section) => section.task === task)?.models[0]?.metrics ?? {}
  const text = (key: string) => <Trans i18nKey={`${ns}:${key}`} components={components} values={values} />
  const content = typeof description === 'object' && description !== null ? description : {}

  return (
    <div data-testid={'Test-N4LDescription'}>
      {content.text?.map((_, i) => <p key={i}>{text(`${prefix}.text.${i}`)}</p>)}
      {children}
      {content.sections?.map((section, i) => (
        <details key={i}>
          <summary>{text(`${prefix}.sections.${i}.title`)}</summary>
          {section.text?.map((_, j) => <p key={j}>{text(`${prefix}.sections.${i}.text.${j}`)}</p>)}
          {section.items !== undefined &&
            <ol>{section.items.map((_, j) => <li key={j}>{text(`${prefix}.sections.${i}.items.${j}`)}</li>)}</ol>}
        </details>
      ))}
      {manifest.source?.citation !== undefined &&
        <details>
          <summary>BibTeX</summary>
          <pre>{manifest.source.citation}</pre>
        </details>}
    </div>
  )
}
