import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button, Card, Col, Container, Row, Tab, Table, Tabs } from "react-bootstrap"

import { TASKS, type TASKS_TYPE_V } from "@/TASKS"
import { taskOptions, type DatasetInfo_t } from "@/TASK_OPTIONS"
import N4LDatasetInfo from "@components/dataset/N4LDatasetInfo"
import N4LModal from "@components/modal/N4LModal"
import WaitingPlaceholder from "@components/loading/WaitingPlaceholder"
import { useMenuModel } from "@hooks/useMenuModel"
import { EXTRA_DATASETS } from "@pages/datasets/extraDatasets"
import DatasetVariables from "@pages/datasets/DatasetVariables"

const TASK_TABS = [
  { task: TASKS.TABULAR_CLASSIFICATION, title: "pages.index.tabular-classification.1-title" },
  { task: TASKS.REGRESSION, title: "pages.index.regression.1-title" },
  { task: TASKS.IMAGE_CLASSIFICATION, title: "pages.index.image-classification.1-title" },
]

const fileName = (file: string) => file.split("/").pop()

/** Enlace de descarga de un fichero de public/ */
function DownloadLink({ file, label }: { file: string, label: React.ReactNode }) {
  return (
    <a href={import.meta.env.VITE_PATH + "/" + file} className={"btn btn-outline-primary btn-sm me-1 mb-1"} download>
      {label}
    </a>
  )
}

/** Dataset cuya información se enseña en el modal */
type SelectedDataset_t = {
  task  : TASKS_TYPE_V
  title : string
  info  : DatasetInfo_t
  files : string[]
  /** Clave del modelo que lo usa; sin ella es un dataset extra (sin descripción propia) */
  value?: string
}

export default function Datasets() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<SelectedDataset_t | null>(null)
  // Descripción completa del dataset: la clase de su modelo, que solo se descarga al abrir el modal
  const description = useMenuModel(selected?.task, selected?.value ?? "")

  const infoButton = (dataset: SelectedDataset_t) => (
    <Button variant={"outline-secondary"} size={"sm"} className={"text-nowrap"} onClick={() => setSelected(dataset)}
      data-testid={"Test-DatasetInfo-" + (dataset.value ?? dataset.files[0])}>
      <Trans i18nKey={"datasets.show-info"} />
    </Button>
  )

  return (
    <main className={"mb-3"} data-title={"Datasets"}>
      <Container id={"Datasets"} className={"mt-3 mb-3 n4l-container-wide"}>
        <Row className={"mt-3"}>
          <Col>
            <h1>
              <Trans i18nKey={"datasets.title"} />
            </h1>
          </Col>
        </Row>
        <Row className={"mt-3"}>
          <Col>
            <Card>
              <Card.Body>
                <Tabs defaultActiveKey={TASKS.TABULAR_CLASSIFICATION} justify>
                  {TASK_TABS.map(({ task, title }) => (
                    <Tab key={task} eventKey={task} title={t(title)}>
                      {/* Los mismos datasets (y ficheros) que usan los modelos de la tarea */}
                      <Table className={"mt-3 align-middle"} responsive={true}>
                        <thead>
                          <tr>
                            <th>{t("datasets.dataset-name")}</th>
                            <th>{t("datasets.dataset-reference")}</th>
                            <th>{t("datasets.dataset-details")}</th>
                            <th>{t("download")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskOptions(task, "dataset")
                            .filter(({ info }) => info !== undefined)
                            .map(({ value, i18n, info }) => (
                              <tr key={value} data-testid={"Test-Dataset-" + value}>
                                <td>{t(i18n)}</td>
                                <td>
                                  {info!.source &&
                                    <a className="link-secondary" href={info!.source} rel="noreferrer" target="_blank">
                                      {t("Reference")}
                                    </a>
                                  }
                                </td>
                                <td>
                                  {infoButton({ task, title: i18n, info: info!, files: info!.files ?? [], value })}
                                </td>
                                <td>
                                  {/* Varios ficheros: cada botón lleva su nombre */}
                                  {(info!.files ?? []).map((file) => (
                                    <DownloadLink key={file} file={file}
                                      label={info!.files!.length > 1 ? fileName(file) : t("download")} />
                                  ))}
                                  {info!.files === undefined && "—"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>

                      {(EXTRA_DATASETS[task] ?? []).length > 0 && <>
                        <h2 className={"h5 mt-4"}><Trans i18nKey={"datasets.extra-title"} /></h2>
                        <p className={"small text-body-secondary"}><Trans i18nKey={"datasets.extra-text"} /></p>
                        <Table className={"align-middle"} responsive={true}>
                          <thead>
                            <tr>
                              <th>{t("datasets.dataset-name")}</th>
                              <th>{t("datasets.dataset-reference")}</th>
                              <th>{t("datasets.dataset-details")}</th>
                              <th>{t("download")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {EXTRA_DATASETS[task]!.map(({ file, source, samples, i18n }) => (
                              <tr key={file}>
                                <td>{t(i18n)}</td>
                                <td>
                                  <a className="link-secondary" href={source} rel="noreferrer" target="_blank">{t("Reference")}</a>
                                </td>
                                <td>
                                  {infoButton({ task, title: i18n, info: { rows: [samples], source }, files: [file] })}
                                </td>
                                <td><DownloadLink file={file} label={t("download")} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>}
                    </Tab>
                  ))}
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <N4LModal showModal={selected !== null}
        setShowModal={() => setSelected(null)}
        size={"xl"}
        title={selected !== null && t(selected.title)}
        ComponentBody={selected !== null &&
          <Tabs defaultActiveKey={"info"} className={"mb-3"}>
            <Tab eventKey={"info"} title={t("datasets.dataset-details")}>
              <N4LDatasetInfo info={selected.info} className={"text-body-secondary"} />
              {selected.value !== undefined && (description !== null ? description.DESCRIPTION() : <WaitingPlaceholder />)}
              {selected.value === undefined && <p><Trans i18nKey={"datasets.extra-text"} /></p>}
              {selected.info.source &&
                <p className={"mb-0"}>
                  <a className="link-secondary" href={selected.info.source} rel="noreferrer" target="_blank">{t("Reference")}</a>
                </p>
              }
            </Tab>
            <Tab eventKey={"variables"} title={t("datasets.variables.title")}>
              <DatasetVariables files={selected.files} />
            </Tab>
          </Tabs>
        }
        ComponentFooter={selected !== null && selected.files.map((file) => (
          <DownloadLink key={file} file={file} label={selected.files.length > 1 ? fileName(file) : t("download")} />
        ))}
      />
    </main>
  )
}
