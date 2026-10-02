import "./Datasets.css"
import { lazy, Suspense, useState } from "react"
import { Link } from "react-router"
import { Trans, useTranslation } from "react-i18next"
import { Button, Card, Col, Container, Form, Row, Tab, Table, Tabs } from "react-bootstrap"

import { TASKS, type TASKS_TYPE_V } from "@/TASKS"
import { taskOptions, type DatasetInfo_t } from "@/TASK_OPTIONS"
import N4LDatasetInfo from "@components/dataset/N4LDatasetInfo"
import N4LModal from "@components/modal/N4LModal"
import WaitingPlaceholder from "@components/loading/WaitingPlaceholder"
import { useMenuModel } from "@hooks/useMenuModel"
import { EXTRA_DATASETS } from "@pages/datasets/extraDatasets"
import DatasetVariables from "@pages/datasets/DatasetVariables"
import { datasetKey, fileName } from "@pages/analyze/projectDatasets"

// La tabla y el describe() del CSV usan danfo.js: se descargan solo al abrir esas pestañas
const DatasetDataFrame = lazy(() => import("@pages/datasets/DatasetDataFrame"))

// canAnalyze: sus conjuntos son CSV y se pueden abrir en el AED
const TASK_TABS = [
  { task: TASKS.TABULAR_CLASSIFICATION, title: "pages.index.tabular-classification.1-title", canAnalyze: true },
  { task: TASKS.REGRESSION, title: "pages.index.regression.1-title", canAnalyze: true },
  { task: TASKS.IMAGE_CLASSIFICATION, title: "pages.index.image-classification.1-title", canAnalyze: false },
]

// Los CSV se pueden abrir en el AED (/analyze?dataset=…); las imágenes (sprites de MNIST…) no
const isCSV = (file: string) => file.toLowerCase().endsWith(".csv")

/** Enlace de descarga de un fichero de public/ */
function DownloadLink({ file, label }: { file: string, label: React.ReactNode }) {
  return (
    <a href={import.meta.env.VITE_PATH + "/" + file} className={"btn btn-outline-secondary btn-sm text-nowrap"} download>
      {label}
    </a>
  )
}

/** Enlace que abre el CSV en el análisis exploratorio de datos */
function AnalyzeLink({ file, label, name }: { file: string, label: React.ReactNode, name: string }) {
  const { t } = useTranslation()
  return (
    <Link to={"/analyze?dataset=" + datasetKey(file)} className={"btn btn-outline-primary btn-sm text-nowrap"}
      title={t("datasets.analyze-title", { name })} data-testid={"Test-DatasetAnalyze-" + datasetKey(file)}>
      {label}
    </Link>
  )
}

/** Con varios CSV, cuál se enseña en las pestañas de datos (los dos ficheros del vino, los de los alumnos…) */
function DataFileSelect({ files, value, onChange }: { files: string[], value: string, onChange: (file: string) => void }) {
  const { t } = useTranslation()
  if (files.length < 2) return null
  return (
    <Form.Group controlId={"dataset-data-file"} className={"d-flex align-items-center gap-2 mb-3"}>
      <Form.Label className={"small fw-semibold mb-0"}>{t("datasets.data.file")}</Form.Label>
      <Form.Select size={"sm"} className={"w-auto"} value={value} onChange={(event) => onChange(event.target.value)}>
        {files.map((file) => <option key={file} value={file}>{fileName(file)}</option>)}
      </Form.Select>
    </Form.Group>
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

type DatasetsTableProps = {
  datasets  : SelectedDataset_t[]
  /** Columna del AED: solo en las tareas con CSV */
  canAnalyze: boolean
  onInfo    : (dataset: SelectedDataset_t) => void
}

/**
 * Tabla de conjuntos de datos: el nombre (con su tamaño) a la izquierda y las acciones a la derecha (información, AED
 * y descarga). En el móvil cada fila es un bloque (n4l-stack-table).
 */
function DatasetsTable({ datasets, canAnalyze, onInfo }: DatasetsTableProps) {
  const { t } = useTranslation()
  // Con varios ficheros, cada enlace lleva su nombre; en el móvil la celda dice además de qué es (data-label)
  const multiple = (files: string[]) => files.length > 1
  return (
    <Table hover responsive className={"align-middle n4l-datasets-table n4l-stack-table"}>
      <thead>
        <tr>
          <th>{t("datasets.dataset-name")}</th>
          <th className={"n4l-datasets-actions"}>{t("datasets.dataset-details")}</th>
          {canAnalyze && <th className={"n4l-datasets-actions"}>{t("header.analyze")}</th>}
          <th className={"n4l-datasets-actions"}>{t("download")}</th>
        </tr>
      </thead>
      <tbody>
        {datasets.map((dataset) => {
          const name = t(dataset.title)
          const csvFiles = dataset.files.filter(isCSV)
          return (
            <tr key={dataset.value ?? dataset.files[0]} data-testid={"Test-Dataset-" + (dataset.value ?? dataset.files[0])}>
              <td>
                <div className={"fw-semibold"}>{name}</div>
                <N4LDatasetInfo info={dataset.info} className={"small text-body-secondary mb-0"} />
              </td>
              <td className={"n4l-datasets-actions"}>
                <Button variant={"outline-secondary"} size={"sm"} className={"text-nowrap"} onClick={() => onInfo(dataset)}
                  data-testid={"Test-DatasetInfo-" + (dataset.value ?? dataset.files[0])}>
                  <Trans i18nKey={"datasets.show-info"} />
                </Button>
              </td>
              {canAnalyze &&
                <td className={"n4l-datasets-actions"} data-label={multiple(csvFiles) ? t("header.analyze") : undefined}>
                  <div className={"n4l-datasets-links"}>
                    {csvFiles.map((file) => (
                      <AnalyzeLink key={file} file={file} name={name}
                        label={multiple(csvFiles) ? datasetKey(file) : t("datasets.analyze-action")} />
                    ))}
                    {csvFiles.length === 0 && <span className={"text-body-secondary"}>—</span>}
                  </div>
                </td>}
              <td className={"n4l-datasets-actions"} data-label={multiple(dataset.files) ? t("download") : undefined}>
                <div className={"n4l-datasets-links"}>
                  {dataset.files.map((file) => (
                    <DownloadLink key={file} file={file} label={multiple(dataset.files) ? fileName(file) : t("download")} />
                  ))}
                  {dataset.files.length === 0 && <span className={"text-body-secondary"}>—</span>}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

export default function Datasets() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<SelectedDataset_t | null>(null)
  // Descripción completa del dataset: la clase de su modelo, que solo se descarga al abrir el modal
  const description = useMenuModel(selected?.task, selected?.value ?? "")
  // Fichero de las pestañas "Datos" y "Estadísticas": el elegido si es de este conjunto; si no, su primer CSV
  const [chosenFile, setDataFile] = useState<string | null>(null)
  const selectedCSV = selected?.files.filter(isCSV) ?? []
  const dataFile = chosenFile !== null && selectedCSV.includes(chosenFile) ? chosenFile : selectedCSV[0]

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
                  {TASK_TABS.map(({ task, title, canAnalyze }) => {
                    // Los mismos datasets (y ficheros) que usan los modelos de la tarea
                    const datasets: SelectedDataset_t[] = taskOptions(task, "dataset")
                      .filter(({ info }) => info !== undefined)
                      .map(({ value, i18n, info }) => ({ task, title: i18n, info: info!, files: info!.files ?? [], value }))
                    const extra: SelectedDataset_t[] = (EXTRA_DATASETS[task] ?? [])
                      .map(({ file, source, samples, i18n }) => ({ task, title: i18n, info: { rows: [samples], source }, files: [file] }))
                    return (
                      <Tab key={task} eventKey={task} title={t(title)}>
                        <div className={"mt-3"}>
                          <DatasetsTable datasets={datasets} canAnalyze={canAnalyze} onInfo={setSelected} />
                        </div>

                        {extra.length > 0 && <>
                          <h2 className={"h5 mt-4"}><Trans i18nKey={"datasets.extra-title"} /></h2>
                          <p className={"small text-body-secondary"}><Trans i18nKey={"datasets.extra-text"} /></p>
                          <DatasetsTable datasets={extra} canAnalyze={canAnalyze} onInfo={setSelected} />
                        </>}
                      </Tab>
                    )
                  })}
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
          <Tabs defaultActiveKey={"info"} className={"mb-3 n4l-dataset-modal-tabs"} mountOnEnter>
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
            {/* Las pestañas de los CSV (las imágenes de MNIST y KMNIST no tienen) */}
            {selectedCSV.length > 0 &&
              <Tab eventKey={"variables"} title={t("datasets.variables.title")}>
                <DatasetVariables files={selected.files} />
              </Tab>}
            {selectedCSV.length > 0 &&
              <Tab eventKey={"data"} title={t("datasets.data.title")}>
                <DataFileSelect files={selectedCSV} value={dataFile} onChange={setDataFile} />
                <Suspense fallback={<WaitingPlaceholder />}>
                  <DatasetDataFrame file={dataFile} view={"data"} />
                </Suspense>
              </Tab>}
            {selectedCSV.length > 0 &&
              <Tab eventKey={"describe"} title={t("datasets.data.describe")}>
                <DataFileSelect files={selectedCSV} value={dataFile} onChange={setDataFile} />
                <Suspense fallback={<WaitingPlaceholder />}>
                  <DatasetDataFrame file={dataFile} view={"describe"} />
                </Suspense>
              </Tab>}
          </Tabs>
        }
        ComponentFooter={selected !== null && <div className={"d-flex flex-wrap justify-content-end gap-2"}>
          {selected.files.filter(isCSV).map((file) => (
            <AnalyzeLink key={"analyze-" + file} file={file} name={t(selected.title)}
              label={selected.files.length > 1 ? `${t("datasets.analyze-action")} · ${datasetKey(file)}` : t("datasets.analyze-action")} />
          ))}
          {selected.files.map((file) => (
            <DownloadLink key={file} file={file} label={selected.files.length > 1 ? fileName(file) : t("download")} />
          ))}
        </div>}
      />
    </main>
  )
}
