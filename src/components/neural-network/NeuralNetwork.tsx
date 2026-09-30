import { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import { ArrowRight } from 'react-bootstrap-icons'
import VisGraph, { type GraphData } from 'react-vis-graph-wrapper'
import { VERBOSE } from '@/CONSTANTS'
import { NEURAL_NETWORK_MODES } from './neural_network'



export default function NeuralNetwork(props: any) {
  const { layers, id_parent, networkRef, mode = NEURAL_NETWORK_MODES.COMPACT } = props

  const [options, setOptions] = useState({ height: 250, width: 300 })

  const events = {
    afterDrawing: (_e: any) => {
      if (VERBOSE) console.debug('afterDrawing', { _e })
    },
    configChange: (_e: any) => {
      if (VERBOSE) console.debug('configChange', { _e })
    },
    select: (_e: any) => {
      if (VERBOSE) console.debug('select', { _e })
    },
    resize: (_e: any) => {
      if (VERBOSE) console.debug('resize', { _e })
    },
    zoom: (_e: any) => {
      // e.preventDefault()
      // e.stopPropagation()
      // e.stopImmediatePropagation()
    }
  }

  const getElementText = (index: number, element: any) => {
    let label = ''
    let title = ''
    if (element?._class && element?._class === 'flatten') {
      label = `Layer: ${index}\n\nFlatten`
      title = `Layer: ${index} {flatten}`
    } else if (element?._class && element?._class === 'dense') {
      label = `Layer: ${index}\n\nDense\nU: ${element.units} F.A:  ${element.activation}`
      title = `Layer: ${index} {dense}\nUnits: ${element.units} F.Activation: ${element.activation}`
    } else if (element?._class && element?._class === 'conv2d') {
      label = `Layer: ${index}\n\nConv 2D\nK: ${element.kernelSize}\nF: ${element.filters}\nF.A: ${element.activation}`
      title = `Layer: ${index} {conv2d}\nKernelSize: ${element.kernelSize}\nFilters: ${element.filters}\nF. Activation: ${element.activation}`
    } else if (element?._class && element?._class === 'maxPooling2d') {
      label = `Layer: ${index}\n\nMax Pooling 2D\nP.S: ${element.poolSize}\nS: ${element.strides}`
      title = `Layer: ${index} {maxPooling2d}\nPool Size: ${element.poolSize}\nStrides: ${element.strides}`
    } else {
      label = `Layer: ${index}\nU: ${element.units}\nF.A: ${element.activation}`
      title = `Layer: ${index} {dense}\nUnits: ${element.units}\nF.Activation: ${element.activation}`
    }
    return { label, title }
  }

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
  }, [layers])

  const modeExtend = useCallback(() => {
    const nodes = [], edges = []
    for (let index = 0; index < layers.length; index++) {
      const element = layers[index]
      const { label, title } = getElementText(index, element)
      for (let unit = 0; unit < layers[index].units; unit++) {
        const key_id = index + ' - ' + unit
        nodes.push({
          id   : key_id,
          label: label,
          title: title,
          level: index
        })
        if (index < layers.length - 1) {
          for (let nextUnit = 0; nextUnit < layers[index + 1].units; nextUnit++) {
            edges.push({ from: key_id, to: (index + 1) + ' - ' + nextUnit })
          }
        }
      }
    }
    return { nodes, edges }
  }, [layers])

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