import './NeuralNetwork.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowRight } from 'react-bootstrap-icons'
import VisGraph, { type GraphData, type Network } from 'react-vis-graph-wrapper'
import { VERBOSE } from '@/CONSTANTS'
import { NEURAL_NETWORK_MODES, type NEURAL_NETWORK_MODES_t } from './neural_network'
import { layerSummaryParts, type DrawableLayer_t } from './layerSummary'
import { useTheme } from '@hooks/useTheme'



type NeuralNetworkProps = {
  layers     : DrawableLayer_t[]
  /** Id del contenedor cuyo tamaño ocupa el grafo */
  id_parent  : string
  networkRef?: React.Ref<Network | undefined>
  mode?      : NEURAL_NETWORK_MODES_t
}

export default function NeuralNetwork(props: NeuralNetworkProps) {
  const { layers, id_parent, networkRef, mode = NEURAL_NETWORK_MODES.COMPACT } = props
  const { t } = useTranslation()
  // vis-network pinta en un canvas: el color de las aristas no sale del CSS
  const theme = useTheme()

  const [options, setOptions] = useState({ height: 250, width: 300 })

  const events = {
    afterDrawing: (_e: unknown) => {
      if (VERBOSE) console.debug('afterDrawing', { _e })
    },
    configChange: (_e: unknown) => {
      if (VERBOSE) console.debug('configChange', { _e })
    },
    select: (_e: unknown) => {
      if (VERBOSE) console.debug('select', { _e })
    },
    resize: (_e: unknown) => {
      if (VERBOSE) console.debug('resize', { _e })
    },
    zoom: (_e: unknown) => {
      // e.preventDefault()
      // e.stopPropagation()
      // e.stopImmediatePropagation()
    }
  }

  // Texto de cada nodo (y de su tooltip). Las capas se numeran desde 1, como en los editores de capas
  const getElementText = useCallback((index: number, element: DrawableLayer_t) => {
    const layer = t('neural-network.layer', { index: index + 1 })
    const parts = layerSummaryParts(t, element)
    const lines = element?._class ? [layer, '', ...parts] : [layer, ...parts]
    return { label: lines.join('\n'), title: [layer, ...parts].join('\n') }
  }, [t])

  // Ajusta el grafo al tamaño del contenedor, también cuando este cambia (p. ej. al redimensionar la ventana)
  useEffect(() => {
    const element = document.getElementById(id_parent)
    if (element === null) return
    const observer = new ResizeObserver(() => {
      const cs = getComputedStyle(element)
      const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      const borderX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)
      const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
      const height = Math.max(250, element.offsetHeight - paddingY - borderY)
      const width = Math.max(350, element.offsetWidth - paddingX - borderX)
      // Mismo tamaño → mismo objeto, para no volver a renderizar
      setOptions((prevState) => (prevState.height === height && prevState.width === width ? prevState : { height, width }))
    })
    observer.observe(element)


    // Quita el evento de zoom para que no moleste al usar el scroll
    // Deprecated by zoomView
    // const dom = document.querySelectorAll('#vis-network canvas')[0]
    // if (dom) {
    //   const wheel = dom.getEventListeners('wheel')
    //   if (wheel) {
    //     const listener = wheel[0].listener
    //     dom.removeEventListener('wheel', listener)
    //   }
    // }

    return () => {
      observer.disconnect()
    }
  }, [id_parent])

  const modeCompact = useCallback(() => {
    const nodes = [], edges = []
    for (const [index, element] of Object.entries(layers)) {
      const { label, title } = getElementText(Number(index), element)
      nodes.push({
        id   : index,
        label: label,
        title: title
      })
    }

    for (let index = 1; index < layers.length; index++) {
      edges.push({ from: index - 1, to: index })
    }
    return { edges, nodes }
  }, [layers, getElementText])

  const modeExtend = useCallback(() => {
    const nodes = [], edges = []
    for (let index = 0; index < layers.length; index++) {
      const element = layers[index]
      // Cada neurona es un nodo: solo lleva el nombre de su capa (con todo el texto los nodos se pisan); el
      // detalle de la capa sale al pasar el ratón
      const { title } = getElementText(index, element)
      const label = t('neural-network.layer', { index: index + 1 })
      for (let unit = 0; unit < (layers[index].units ?? 0); unit++) {
        const key_id = index + ' - ' + unit
        nodes.push({
          id   : key_id,
          label: label,
          title: title,
          level: index
        })
        if (index < layers.length - 1) {
          for (let nextUnit = 0; nextUnit < (layers[index + 1].units ?? 0); nextUnit++) {
            edges.push({ from: key_id, to: (index + 1) + ' - ' + nextUnit })
          }
        }
      }
    }
    return { nodes, edges }
  }, [layers, getElementText, t])

  const graphState = useMemo<GraphData>(() => {
    switch (mode) {
      case NEURAL_NETWORK_MODES.COMPACT:
        return modeCompact()
      case NEURAL_NETWORK_MODES.EXTEND:
        return modeExtend()
      default:
        console.error('Error, option not valid')
        return { nodes: [], edges: [] }
    }
  }, [mode, modeCompact, modeExtend])

  return <>
    <Row className={'mt-3'}>
      <Col xs={2} className={'n4l-nn-side'}>
        <span className={'n4l-nn-side-label'}><Trans i18nKey={'graphic-red.input'} /></span>
        <ArrowRight className={'n4l-nn-arrow'} aria-hidden={true} />
      </Col>
      <Col id={id_parent} xs={8} sm={8} md={8} lg={8} xl={8} xxl={8}>
        <div style={{ 'position': 'relative', height: '100%', width: '100%' }}>
          <VisGraph
            graph={graphState}
            options={{
              autoResize: true,
              physics   : {
                adaptiveTimestep: false
              },
              interaction: {
                zoomView: false
              },
              layout: {
                hierarchical: {
                  levelSeparation: 250,
                  // nodeSpacing    : 250,
                  // treeSpacing    : 200,
                  enabled        : true,
                  direction      : 'LR',
                }
              },
              nodes: {
                scaling: {
                  min: 10,   // Minimum size for a node
                  max: 10,   // Maximum size for a node
                }
              },
              edges: {
                color: theme === 'dark' ? '#dee2e6' : '#000000',
              },
              height: `${options.height}px`,
              // width : `${options.width}px`
            }}
            events={events}
            ref={networkRef} />
        </div>
      </Col>
      <Col xs={2} className={'n4l-nn-side'}>
        <ArrowRight className={'n4l-nn-arrow'} aria-hidden={true} />
        <span className={'n4l-nn-side-label n4l-nn-side-label-output'}><Trans i18nKey={'graphic-red.output'} /></span>
      </Col>
    </Row>
  </>
}