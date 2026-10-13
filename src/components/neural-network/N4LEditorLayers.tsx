import React, { useEffect, useRef, useState } from 'react'
import { Accordion, Alert, Button, Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { announce } from '@core/a11y/announce'

import N4LEmptyState from '@components/loading/N4LEmptyState'
import { N4LLayerFlag } from '@components/neural-network/N4LLayerCheck'

type N4LEditorLayersProps<L> = {
  layers      : L[]
  /** Resumen de una capa en su cabecera, para no tener que abrirla («10 neuronas, ReLU», «Conv 2D, …») */
  summary     : (layer: L, index: number) => string
  /** Lo que se edita de una capa (N4LDenseLayerFields en las dense; tipo y parámetros en las de imágenes) */
  renderFields: (layer: L, index: number) => React.ReactNode
  /** Capa que no se puede borrar (la salida de regresión, la primera convolución) */
  isLocked?   : (layer: L, index: number) => boolean
  /** Sin él, solo se añaden capas al final */
  onAddStart? : () => void
  onAddEnd    : () => void
  onRemove    : (index: number) => void
  /** Con él, al borrar una capa se puede deshacer: recibe las capas de antes (las mismas que se dan a N4LLayerCheck) */
  onRestore?  : (layers: L[]) => void
  /** Sin dataset procesado todavía: se muestra la espera y no se pueden añadir capas */
  waiting?    : boolean
  titleAs?    : 'h2' | 'h3'
  footer?     : React.ReactNode
  /** Lo que está mal en las capas (N4LLayerCheck), encima de ellas */
  check?      : React.ReactNode
  /** Capas con un error o un aviso, marcadas en su cabecera */
  flagged?    : Partial<Record<number, 'error' | 'warning'>>
}

const prefix = 'pages.playground.generator.editor-layers.'

/**
 * El editor de capas de los tres entrenadores: añadir capas, desplegar cada una para cambiarla o borrarla, con su
 * resumen y la marca de lo que está mal en su cabecera. Lo que tiene cada capa (y sus reglas: la salida, el número
 * máximo de capas…) lo pone quien lo usa.
 */
export default function N4LEditorLayers<L>(props: N4LEditorLayersProps<L>) {
  const { layers, summary, renderFields, isLocked = () => false, onAddStart, onAddEnd, onRemove, onRestore, waiting = false, titleAs: Title = 'h3', footer, check, flagged = {} } = props
  const { t } = useTranslation()

  // Al borrar una capa, su botón desaparece con ella: el foco pasa a la cabecera de la capa que queda en su sitio (o a
  // la anterior, si era la última), o a «Añadir capa» si no queda ninguna, y no al principio de la página (WCAG 2.4.3)
  const card_ref = useRef<HTMLDivElement>(null)
  const focusAfterRemove = useRef<number | null>(null)
  const layerCount = layers.length
  useEffect(() => {
    const index = focusAfterRemove.current
    if (index === null || card_ref.current === null) return
    focusAfterRemove.current = null
    const headers = card_ref.current.querySelectorAll<HTMLElement>('.accordion-button')
    const target = headers[Math.min(index, headers.length - 1)] ?? card_ref.current.querySelector<HTMLElement>('[data-guide="layers-add"] button')
    target?.focus()
  }, [layerCount])
  // Borrar una capa se puede deshacer (WCAG 3.3.4): se guardan las de antes hasta que las capas cambien otra vez. `after`
  // son las capas justo después de borrar: si el editor no la ha borrado (p. ej., era la última que quedaba), no hay
  // nada que deshacer
  const [removed, setRemoved] = useState<{ before: L[], index: number, after?: L[] } | null>(null)
  if (removed !== null && removed.after === undefined && layers !== removed.before) {
    setRemoved(layers.length === removed.before.length - 1 ? { ...removed, after: layers } : null)
  }
  if (removed?.after !== undefined && layers !== removed.after) setRemoved(null)
  const canUndo = onRestore !== undefined && removed?.after !== undefined

  const handleRemove = (index: number) => {
    focusAfterRemove.current = index
    if (onRestore !== undefined) {
      setRemoved({ before: layers, index })
      announce(t(prefix + 'removed', { index: index + 1 }))
    }
    onRemove(index)
  }
  const handleUndo = () => {
    if (removed === null || onRestore === undefined) return
    focusAfterRemove.current = removed.index
    onRestore(removed.before)
    setRemoved(null)
    announce(t(prefix + 'restored', { index: removed.index + 1 }))
  }

  return <>
    <Card ref={card_ref} data-guide={'layers'}>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <Title><Trans i18nKey={prefix + 'title'} /></Title>
        {/* En pantallas estrechas (o con el texto grande) los dos botones bajan a otra línea */}
        <div className={'d-flex flex-wrap gap-2'} data-guide={'layers-add'}>
          {onAddStart !== undefined &&
            <Button disabled={waiting} variant={'outline-primary'} size={'sm'} className={'text-nowrap'} onClick={onAddStart}>
              <Trans i18nKey={prefix + 'add-layer-start'} />
            </Button>}
          <Button disabled={waiting} variant={'outline-primary'} size={'sm'} className={'text-nowrap'} onClick={onAddEnd}>
            <Trans i18nKey={prefix + 'add-layer-end'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {waiting && <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />}
        {!waiting && canUndo && removed !== null &&
          <Alert variant={'secondary'} className={'d-flex flex-wrap align-items-center justify-content-between gap-2 py-2'} data-testid={'Test-LayerRemoved'}>
            <span className={'small'}><Trans i18nKey={prefix + 'removed-short'} values={{ index: removed.index + 1 }} /></span>
            <Button size={'sm'} variant={'outline-primary'} onClick={handleUndo} data-testid={'Test-LayerUndo'}>
              <Trans i18nKey={prefix + 'undo'} />
            </Button>
          </Alert>}
        {!waiting && check}
        {!waiting && (
          <Accordion>
            {layers.map((layer, index) => (
              <Accordion.Item key={index} eventKey={index.toString()} data-guide={'layer-' + index}>
                <Accordion.Header as={Title === 'h2' ? 'h3' : 'h4'}>
                  <span className={'text-nowrap'}><Trans i18nKey={prefix + 'layer-id'} values={{ index: index + 1 }} /></span>
                  <span className={'ms-2 text-body-secondary'}>({summary(layer, index)})</span>
                  <N4LLayerFlag severity={flagged[index]} />
                </Accordion.Header>
                <Accordion.Body>
                  <div className={'d-grid gap-2'}>
                    <Button variant={'outline-danger'} disabled={isLocked(layer, index)} onClick={() => handleRemove(index)}>
                      <Trans i18nKey={prefix + 'delete-layer'} values={{ index: index + 1 }} />
                    </Button>
                  </div>
                  {renderFields(layer, index)}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Card.Body>
      {footer && <Card.Footer className={'text-end'}>{footer}</Card.Footer>}
    </Card>
  </>
}
