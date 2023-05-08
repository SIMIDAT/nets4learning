import React from 'react'
import { Col, Row } from "react-bootstrap"
import { ArrowRight } from "react-bootstrap-icons"
import VisGraph from 'react-vis-graph-wrapper'
import './GraphicRed.css'
import { Trans } from "react-i18next";

export default function GraphicRed(props) {
  const { layer, /*setActiveLayer,*/ tipo } = props

  let nodes = []
  let edges = []

  for (let [index, element] of Object.entries(layer)) {
    index = parseInt(index)
    if (tipo === 0) {
      nodes.push({
        id   : index,
        label: `${index + 1} \n ${element.units} - ${element.activation}`,
        title: '' + (index + 1)
      })
    } else if (tipo === 1) {
      nodes.push({
        id   : index,
        label: element.class,
        title: '' + (index + 1)
      })
    }
  }

  for (let index = 1; index < layer.length; index++) {
    edges.push({
      from: index - 1,
      to  : index
    })
  }

  const graph = {
    nodes: nodes,
    edges: edges,
  }

  const options = {
    layout: {
      hierarchical: {
        enabled  : true,
        direction: 'LR',
      },
    },
    edges : {
      color: '#e61818',
    },
    //  height: "500px",
    physics    : {
      enabled: false,
    },
    interaction: {
      dragView : false,
      dragNodes: false,
    },
  }

  const events = {
    select: (/*event*/) => {
      // const { nodes } = event
      // setActiveLayer(nodes[0])
    },
  }

  return (
    <>
      <Row className={"mt-3"}>
        <Col xs={2} sm={2} md={2} lg={2} xl={2} xxl={2}
             style={{
               display     : 'flex',
               alignItems  : "center",
               marginBottom: "2rem"
             }}>
          <div className="col-md-6"
               style={{ writingMode: 'vertical-rl' }}>
            <Trans i18nKey={"graphic-red.input"} />
          </div>
          <div className="col-md-6"
               style={{ textAlign: "center" }}>
            <ArrowRight style={{ "fontSize": "xxx-large" }} />
          </div>
        </Col>
        <Col className={"mynetwork"} xs={8} sm={8} md={8} lg={8} xl={8} xxl={8}>
          <VisGraph graph={graph}
                    options={options}
                    events={events} />
        </Col>
        <Col xs={2} sm={2} md={2} lg={2} xl={2} xxl={2}
             style={{
               display     : 'flex',
               alignItems  : "center",
               marginBottom: "2rem"
             }}>
          <div className="col-md-6"
               style={{ textAlign: "center" }}>
            <ArrowRight style={{ "fontSize": "xxx-large" }} />
          </div>
          <div className="col-md-6"
               style={{ writingMode: 'vertical-lr', textAlign: 'left' }}>
            <Trans i18nKey={"graphic-red.output"} />
          </div>
        </Col>
      </Row>
    </>
  )
}
