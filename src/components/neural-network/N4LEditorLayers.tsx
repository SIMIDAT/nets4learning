import React from 'react'
import { Accordion, Button, Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import N4LEmptyState from '@components/loading/N4LEmptyState'
import { N4LLayerFlag } from '@components/neural-network/N4LLayerCheck'

type N4LEditorLayersProps<L> = {
  layers      : L[]
  /** Resumen de una capa en su cabecera, para no tener que abrirla («10 neuronas · ReLU», «Conv 2D · …») */
  summary     : (layer: L, index: number) => string
  /** Lo que se edita de una capa (N4LDenseLayerFields en las dense; tipo y parámetros en las de imágenes) */
  renderFields: (layer: L, index: number) => React.ReactNode
  /** Capa que no se puede borrar (la salida de regresión, la primera convolución) */
  isLocked?   : (layer: L, index: number) => boolean
  /** Sin él, solo se añaden capas al final */
  onAddStart? : () => void
  onAddEnd    : () => void
  onRemove    : (index: number) => void
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
  const { layers, summary, renderFields, isLocked = () => false, onAddStart, onAddEnd, onRemove, waiting = false, titleAs: Title = 'h3', footer, check, flagged = {} } = props

  return <>
    <Card data-guide={'layers'}>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <Title><Trans i18nKey={prefix + 'title'} /></Title>
        <div className={'d-flex gap-2'} data-guide={'layers-add'}>
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
        {!waiting && check}
        {!waiting && (
          <Accordion>
            {layers.map((layer, index) => (
              <Accordion.Item key={index} eventKey={index.toString()} data-guide={'layer-' + index}>
                <Accordion.Header>
                  <span className={'text-nowrap'}><Trans i18nKey={prefix + 'layer-id'} values={{ index: index + 1 }} /></span>
                  <span className={'ms-2 text-body-secondary'}>· {summary(layer, index)}</span>
                  <N4LLayerFlag severity={flagged[index]} />
                </Accordion.Header>
                <Accordion.Body>
                  <div className={'d-grid gap-2'}>
                    <Button variant={'outline-danger'} disabled={isLocked(layer, index)} onClick={() => onRemove(index)}>
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
