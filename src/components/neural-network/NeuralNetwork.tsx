import { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowRight } from 'react-bootstrap-icons'
import VisGraph, { type GraphData, type Network } from 'react-vis-graph-wrapper'
import { VERBOSE } from '@/CONSTANTS'
import { NEURAL_NETWORK_MODES, type NEURAL_NETWORK_MODES_t } from './neural_network'



/** Lo que se dibuja de una capa; vale para las dense (tabular, regresión) y las de imágenes */
type DrawableLayer_t = {
  _class?    : string
  units?     : number
  activation?: string | null
  kernelSize?: number
  filters?   : number
  poolSize?  : number
  strides?   : number
}

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

  // Texto de cada nodo (y de su tooltip). Las capas se numeran desde 1, como en el editor de capas; los tipos
  // de capa y las activaciones se dejan con su nombre técnico
  const getElementText = useCallback((index: number, element: DrawableLayer_t) => {
    const layer = t('neural-network.layer', { index: index + 1 })
    const units = t('neural-network.units', { units: element.units })
    let lines: string[]
    switch (element?._class) {
      case 'flatten':
        lines = [layer, '', 'Flatten']
        break
      case 'dense':
        lines = [layer, '', 'Dense', units, String(element.activation)]
        break
      case 'conv2d':
        lines = [layer, '', 'Conv 2D', t('neural-network.kernel-size', { value: element.kernelSize }),
          t('neural-network.filters', { value: element.filters }), String(element.activation)]
        break
      case 'maxPooling2d':
        lines = [layer, '', 'Max Pooling 2D', t('neural-network.pool-size', { value: element.poolSize }),
          t('neural-network.strides', { value: element.strides })]
        break
      default:
        lines = [layer, units, String(element.activation)]
    }
    const label = lines.join('\n')
    return { label, title: lines.filter(Boolean).join('\n') }
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
      const { label, title } = getElementText(index, element)
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
  }, [layers, getElementText])

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
      <Col xs={2} sm={2} md={2} lg={2} xl={2} xxl={2}
        style={{
          display     : 'flex',
          alignItems  : 'center',
          marginBottom: '2rem'
        }}>
        <div className="col-md-6"
          style={{ writingMode: 'vertical-rl' }}>
          <Trans i18nKey={'graphic-red.input'} />
        </div>
        <div className="col-md-6"
          style={{ textAlign: 'center' }}>
          <ArrowRight style={{ 'fontSize': 'xxx-large' }} />
        </div>
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
                color: '#000000',
              },
              height: `${options.height}px`,
              // width : `${options.width}px`
            }}
            events={events}
            ref={networkRef} />
        </div>
      </Col>
      <Col 
        xs={2} sm={2} md={2} lg={2} xl={2} xxl={2}
        style={{
          display     : 'flex',
          alignItems  : 'center',
          marginBottom: '2rem'
        }}>
        <div className="col-md-6"
          style={{ textAlign: 'center' }}>
          <ArrowRight style={{ 'fontSize': 'xxx-large' }} />
        </div>
        <div className="col-md-6"
          style={{ writingMode: 'vertical-lr', textAlign: 'left' }}>
          <Trans i18nKey={'graphic-red.output'} />
        </div>
      </Col>
    </Row>
  </>
}