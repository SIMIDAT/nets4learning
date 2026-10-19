import React, { useEffect, useRef, useState } from 'react'
import { Accordion, Alert, Button, Card } from 'react-bootstrap'
import { ArrowDown, ArrowUp, GripVertical } from 'react-bootstrap-icons'
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
  /**
   * Con él, las capas se ordenan: arrastrándolas por su asa (ratón, dedo o lápiz) o, abiertas, con «Subir» y «Bajar»
   * (también con el teclado y el lector de pantalla). Las capas fijas (isLocked) no se mueven y las demás no pasan por
   * encima de ellas
   */
  onMove?     : (from: number, to: number) => void
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
 * El editor de capas de los entrenadores: añadir capas, desplegar cada una para cambiarla, moverla o borrarla, con su
 * resumen y la marca de lo que está mal en su cabecera. Lo que tiene cada capa (y sus reglas: la salida, el número
 * máximo de capas…) lo pone quien lo usa.
 */
export default function N4LEditorLayers<L>(props: N4LEditorLayersProps<L>) {
  const { layers, summary, renderFields, isLocked = () => false, onAddStart, onAddEnd, onRemove, onMove, onRestore, waiting = false, titleAs: Title = 'h3', footer, check, flagged = {} } = props
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

  // La capa abierta: al moverla sigue abierta en su nuevo puesto (cada panel es el de un puesto, no el de una capa)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  // Tras moverla, el foco sigue en el mismo botón de la capa movida (o en el otro, si ya no se puede mover hacia ahí)
  const focusAfterMove = useRef<{ index: number, direction: 'up' | 'down' } | null>(null)
  // El panel de la capa movida se despliega con una animación: mientras está oculto no se le puede dar el foco, así que
  // se vuelve a intentar hasta que se vea (como mucho, lo que dura la animación)
  useEffect(() => {
    const target = focusAfterMove.current
    if (target === null || card_ref.current === null) return
    focusAfterMove.current = null
    const button = (direction: string) => card_ref.current?.querySelector<HTMLButtonElement>(`[data-move="${direction}-${target.index}"]:not(:disabled)`)
    const focus = () => {
      const element = button(target.direction) ?? button(target.direction === 'up' ? 'down' : 'up')
      element?.focus()
      return element !== null && element !== undefined && document.activeElement === element
    }
    if (focus()) return
    let attempts = 0
    const timer = window.setInterval(() => {
      if (focus() || ++attempts >= 12) window.clearInterval(timer)
    }, 50)
    return () => window.clearInterval(timer)
  }, [layers])
  const isFree = (index: number) => !isLocked(layers[index], index)
  /** Si la capa `from` puede ir al puesto `to`: ni ella ni las que hay por el camino son fijas */
  const canMove = (from: number, to: number) => {
    if (from === to || to < 0 || to >= layers.length) return false
    for (let index = Math.min(from, to); index <= Math.max(from, to); index++) if (!isFree(index)) return false
    return true
  }
  /** Mueve la capa; el panel abierto sigue con su capa. `withFocus`: con los botones, el foco sigue en la capa movida */
  const handleMove = (from: number, to: number, withFocus = true) => {
    if (onMove === undefined || !canMove(from, to)) return
    if (withFocus) focusAfterMove.current = { index: to, direction: to < from ? 'up' : 'down' }
    const open = activeKey === null ? null : Number(activeKey)
    if (open !== null) {
      const shift = open === from ? to : from < open && open <= to ? open - 1 : to <= open && open < from ? open + 1 : open
      setActiveKey(String(shift))
    }
    onMove(from, to)
    announce(t(prefix + 'moved', { index: from + 1, position: to + 1 }))
  }

  // Arrastrar por el asa: con eventos de puntero (ratón, dedo y lápiz; el arrastre del navegador no va en los móviles).
  // Mientras se arrastra, una raya marca dónde caerá; al soltar, se mueve
  const [drag, setDrag] = useState<{ from: number, over: number, pointer: number } | null>(null)
  /** El puesto en el que caería la capa `from` con el puntero a la altura `y`, sin pasar por encima de una fija */
  const dropIndex = (from: number, y: number) => {
    const middles = [...(card_ref.current?.querySelectorAll<HTMLElement>('[data-layer-item]') ?? [])]
      .map((element) => element.getBoundingClientRect())
      .map(({ top, height }) => top + height / 2)
    let target = middles.filter((middle, index) => index !== from && middle < y).length
    while (target !== from && !canMove(from, target)) target += target > from ? -1 : 1
    return target
  }
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>, index: number) => {
    if (onMove === undefined || !isFree(index) || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrag({ from: index, over: index, pointer: event.pointerId })
  }
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (drag === null || event.pointerId !== drag.pointer) return
    // Cerca del borde de la ventana, la página se desplaza para llegar a las capas que no se ven
    if (event.clientY < 60) window.scrollBy(0, -12)
    else if (event.clientY > window.innerHeight - 60) window.scrollBy(0, 12)
    const over = dropIndex(drag.from, event.clientY)
    if (over !== drag.over) setDrag({ ...drag, over })
  }
  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (drag === null || event.pointerId !== drag.pointer) return
    setDrag(null)
    if (drag.over !== drag.from) handleMove(drag.from, drag.over, false)
  }

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
          <>
          {onMove !== undefined && layers.length > 1 &&
            <p className={'small text-body-secondary mb-2'}><Trans i18nKey={prefix + 'drag-help'} /></p>}
          <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(typeof key === 'string' ? key : null)}>
            {layers.map((layer, index) => (
              <Accordion.Item key={index} eventKey={index.toString()} data-guide={'layer-' + index} data-layer-item={index}
                className={drag === null ? undefined : index === drag.from
                  ? 'n4l-layer-dragging'
                  : index === drag.over ? (drag.over > drag.from ? 'n4l-layer-drop-after' : 'n4l-layer-drop-before') : undefined}>
                <div className={'d-flex'}>
                  {/* El asa: solo para arrastrar con el puntero; con el teclado, «Subir» y «Bajar» dentro de la capa */}
                  {onMove !== undefined &&
                    <span className={'n4l-layer-handle' + (isFree(index) ? '' : ' n4l-layer-handle-locked')} aria-hidden={true}
                      title={isFree(index) ? t(prefix + 'drag', { index: index + 1 }) : undefined} data-drag={index}
                      onPointerDown={(event) => handlePointerDown(event, index)} onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp} onPointerCancel={() => setDrag(null)}>
                      <GripVertical />
                    </span>}
                  <Accordion.Header as={Title === 'h2' ? 'h3' : 'h4'} className={'flex-grow-1'}>
                    <span className={'text-nowrap'}><Trans i18nKey={prefix + 'layer-id'} values={{ index: index + 1 }} /></span>
                    <span className={'ms-2 text-body-secondary'}>({summary(layer, index)})</span>
                    <N4LLayerFlag severity={flagged[index]} />
                  </Accordion.Header>
                </div>
                <Accordion.Body>
                  {onMove !== undefined &&
                    <div className={'d-flex flex-wrap gap-2 mb-2'} role={'group'} aria-label={t(prefix + 'move-group', { index: index + 1 })}>
                      <Button variant={'outline-secondary'} size={'sm'} disabled={!canMove(index, index - 1)} data-move={'up-' + index}
                        onClick={() => handleMove(index, index - 1)}>
                        <ArrowUp aria-hidden={true} /> <Trans i18nKey={prefix + 'move-up'} values={{ index: index + 1 }} />
                      </Button>
                      <Button variant={'outline-secondary'} size={'sm'} disabled={!canMove(index, index + 1)} data-move={'down-' + index}
                        onClick={() => handleMove(index, index + 1)}>
                        <ArrowDown aria-hidden={true} /> <Trans i18nKey={prefix + 'move-down'} values={{ index: index + 1 }} />
                      </Button>
                    </div>}
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
          </>
        )}
      </Card.Body>
      {footer && <Card.Footer className={'text-end'}>{footer}</Card.Footer>}
    </Card>
  </>
}
