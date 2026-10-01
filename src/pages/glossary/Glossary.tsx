import "katex/dist/katex.min.css"
import { useEffect } from "react"
import { useLocation } from "react-router"
import { Accordion, Col, Container, Row } from "react-bootstrap"
import { Trans, useTranslation } from "react-i18next"

import { VERBOSE } from "@/CONSTANTS"
import Glossary1Optimizers from "./Glossary1Optimizers"
import Glossary2ActivationFunctions from "./Glossary2ActivationFunctions"
import Glossary3LossFunctions from "./Glossary3LossFunctions"
import Glossary4MetricFunctions from "./Glossary4MetricFunctions"
import Glossary5Layers from "./Glossary5Layers"
import N4LDivider from "@components/divider/N4LDivider"
import GlossaryEditor from "@pages/glossary/GlossaryEditor"
import { glossaryTarget } from "@pages/glossary/glossaryTarget"

export default function Glossary() {
  const { t } = useTranslation()
  const location = useLocation()
  // Los enlaces de ayuda del playground llevan la sección en la URL (?action=…): se abre y se lleva la vista hasta ella
  const target = glossaryTarget(new URLSearchParams(location.search).get("action"))

  useEffect(() => {
    if (target !== null) document.getElementById("glossary-" + target)?.scrollIntoView({ block: "start" })
  }, [target])

  if (VERBOSE) console.debug("render Glossary")
  return (
    <>
      <main className={"mb-3"} data-title={"Glossary"}>
        <Container>
          <Row className={"mt-3"}>
            <Col>
              <h1>
                <Trans i18nKey={"pages.glossary.title"} t={t} />
              </h1>
            </Col>
          </Row>

          {/* INFORMACIÓN */}
          <Row>
            <Col>
              <N4LDivider i18nKey={"hr.tasks"} />

              <Accordion defaultActiveKey={target ?? undefined}>
                <Accordion.Item eventKey={"classification-tabular"} id={"glossary-classification-tabular"}>
                  <Accordion.Header as={"h2"} className={"n4l-accordion-h2"}>
                    <Trans i18nKey={"pages.glossary.tabular-classification.title"} />
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      <Trans i18nKey={"pages.glossary.tabular-classification.text-1"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.tabular-classification.text-2"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.tabular-classification.text-3"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.tabular-classification.text-4"} />
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"regression"} id={"glossary-regression"}>
                  <Accordion.Header as={"h2"} className={"n4l-accordion-h2"}>
                    <Trans i18nKey={"pages.glossary.regression.title"} />
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      <Trans i18nKey={"pages.glossary.regression.text.0"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.regression.text.1"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.regression.text.2"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.regression.text.3"} />
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"classification-imagen"} id={"glossary-classification-imagen"}>
                  <Accordion.Header as={"h2"} className={"n4l-accordion-h2"}>
                    <Trans i18nKey={"pages.glossary.image-classification.title"} />
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      <Trans i18nKey={"pages.glossary.image-classification.text-1"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.image-classification.text-2"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.image-classification.text-3"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.image-classification.text-4"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.image-classification.text-5"} />
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"objects-detection"}>
                  <Accordion.Header as={"h2"} className={"n4l-accordion-h2"}>
                    <Trans i18nKey={"pages.glossary.object-identification.title"} />
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      <Trans i18nKey={"pages.glossary.object-identification.text-1"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.object-identification.text-2"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.object-identification.text-3"} />
                    </p>
                    <p>
                      <Trans i18nKey={"pages.glossary.object-identification.text-4"} />
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              <N4LDivider i18nKey={"hr.editor"} />
              <GlossaryEditor openKey={target} />

              {/* Funciones de optimización */}
              <N4LDivider i18nKey={"hr.optimization-function"} />
              <Glossary1Optimizers />

              {/* Funciones de activación */}
              <N4LDivider i18nKey={"hr.activation-functions"} />
              <Glossary2ActivationFunctions />

              {/* Funciones de perdida */}
              <N4LDivider i18nKey={"hr.loss-functions"} />
              <Glossary3LossFunctions />

              {/* Funciones de métricas */}
              <N4LDivider i18nKey={"hr.metric-function"} />
              <Glossary4MetricFunctions openKey={target} />

              {/* Layers */}
              <Glossary5Layers />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  )
}
