import { useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { Badge, Card, Col, Form, Row } from "react-bootstrap"
import { Trans, useTranslation } from "react-i18next"
import type * as dfd from "danfojs"
import type { DropEvent, FileRejection } from "react-dropzone"

import AlertHelper from "@utils/alertHelper"
import { VERBOSE } from "@/CONSTANTS"
import { TASKS } from "@/TASKS"
import { DataFrameReadCSV } from "@core/dataframe/DataFrameUtils"
import {
  dataWarnings,
  dataframeColumns,
  naturalCompare,
  problemType,
  type ColumnData_t,
  type ColumnProfile_t,
  type DataFrameAnalysis_t,
  type ProblemType_t,
} from "@core/dataframe/eda"
import type { DatasetVariable_t } from "@pages/datasets/datasetVariables"
import N4LSectionLayout from "@components/divider/N4LSectionLayout"
import N4LDivider from "@components/divider/N4LDivider"
import { sectionId } from "@components/divider/sectionId"
import N4LEmptyState from "@components/loading/N4LEmptyState"
import N4LDeferredMount from "@components/loading/N4LDeferredMount"
import N4LDataFrameTable from "@components/dataframe/N4LDataFrameTable"
import DataFrameCard from "@components/dataframe/DataFrameCard"
import DataFrameQuery from "@components/dataframe/DataFrameQuery"
import DataFramePlot from "@components/dataframe/DataFramePlot"
import DataFrameDescribeModalDescription from "@components/dataframe/DataFrameDescribeModalDescription"
import DataFrameCorrelationMatrixModalDescription from "@components/dataframe/DataFrameCorrelationMatrixModalDescription"
import DataFrameQueryModalDescription from "@components/dataframe/DataFrameQueryModalDescription"
import { DataFramePlotProvider } from "@components/_context/DataFramePlotContext"
import { datasetKey, datasetVariables, defaultTarget, fileName, projectDatasetByKey, variableOf, type ProjectDataset_t } from "./projectDatasets"
import AnalyzeDatasetPicker from "./components/AnalyzeDatasetPicker"
import AnalyzeSummary from "./components/AnalyzeSummary"
import AnalyzeVariables from "./components/AnalyzeVariables"
import AnalyzeDistributions from "./components/AnalyzeDistributions"
import AnalyzeRelations from "./components/AnalyzeRelations"
import AnalyzePreprocess from "./components/AnalyzePreprocess"
import { analyzeInWorker } from "./analysisClient"
import { sampleIndicesWithoutReplacement } from "@core/explainability/shapSampling"
import WaitingPlaceholder from "@components/loading/WaitingPlaceholder"

const prefix = "pages.dataframe."
// Los gráficos de «Más gráficos» (danfo dibuja con Plotly a partir de cada fila) usan como mucho estas filas
const CHART_SAMPLE_ROWS = 20000
const STEP_DATA = prefix + "sections.data"
const STEP_DISTRIBUTIONS = prefix + "sections.distributions"
const STEPS = [
  STEP_DATA,
  prefix + "sections.summary",
  prefix + "sections.variables",
  STEP_DISTRIBUTIONS,
  prefix + "sections.relations",
  prefix + "sections.table",
  prefix + "sections.preprocess",
  prefix + "sections.charts",
]

/**
 * Clasificación o regresión. Manda la ficha del conjunto: categórica o binaria, clasificación; continua, regresión;
 * entera, la tarea del conjunto en el proyecto (la clase de lymphography es una clasificación y la calidad del vino una
 * regresión). Sin ficha, se deduce de los valores
 */
function inferProblem(target: ColumnProfile_t, variables?: DatasetVariable_t[], project?: ProjectDataset_t): ProblemType_t {
  if (target.kind === "categorical") return "classification"
  const type = variableOf(variables, target.name)?.type
  if (type === "Categorical" || type === "Binary") return "classification"
  if (type === "Continuous") return "regression"
  if (type === "Integer" && project) return project.task === TASKS.REGRESSION ? "regression" : "classification"
  return problemType(target)
}

type Loaded_t = {
  dataframe : dfd.DataFrame
  /** Las columnas con sus valores (lo que va al worker del análisis) */
  columns   : ColumnData_t[]
  name      : string
  project?  : ProjectDataset_t
  variables?: DatasetVariable_t[]
}

/** Análisis exploratorio de datos (AED) de un CSV: del resumen a las relaciones entre variables y el preprocesado */
export default function AnalyzeDataFrame() {
  const { t, i18n } = useTranslation()
  const [loaded, setLoaded] = useState<Loaded_t | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [targetSelected, setTarget] = useState<string | null>(null)
  // El selector cambia al momento; el análisis (y sus gráficos) se pone al día después, sin congelar el selector
  const target = useDeferredValue(targetSelected)
  const [distributionVariable, setDistributionVariable] = useState<string | null>(null)
  // El análisis llega del worker después de cargar; null mientras se calcula
  const [analysis, setAnalysis] = useState<DataFrameAnalysis_t | null>(null)
  // Cada carga tiene su número: si llega el análisis de un conjunto anterior, se descarta
  const loadCount = useRef(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedDataset = projectDatasetByKey(searchParams.get("dataset"))
  // El CSV del proyecto ya pedido (por la dirección o en el selector): cambiar la dirección no lo vuelve a cargar
  const requestedFile = useRef<string | null>(null)

  const load = async (source: File | string, name: string, project?: ProjectDataset_t) => {
    setIsLoading(true)
    try {
      const loadId = ++loadCount.current
      const dataframe = await DataFrameReadCSV(source)
      const variables = project ? datasetVariables(project.file) : undefined
      const columns = dataframeColumns(dataframe)
      setLoaded({ dataframe, columns, name, project, variables })
      setTarget(defaultTarget(dataframe.columns, variables))
      setDistributionVariable(null)
      setAnalysis(null)
      // Perfil, valores numéricos y correlaciones en el worker: el hilo principal sigue libre mientras tanto
      const result = await analyzeInWorker(columns)
      if (loadId === loadCount.current) setAnalysis(result)
    } catch (error) {
      console.error(error)
      await AlertHelper.alertError(t("error.parsing-csv"))
    } finally {
      setIsLoading(false)
    }
  }

  const loadProject = (project: ProjectDataset_t) => {
    requestedFile.current = project.file
    return load(import.meta.env.VITE_PATH + "/" + project.file, fileName(project.file), project)
  }
  // El CSV elegido queda en la dirección (/analyze?dataset=iris): se puede enlazar y compartir
  const handleProject = (project: ProjectDataset_t) => {
    setSearchParams({ dataset: datasetKey(project.file) }, { replace: true })
    return loadProject(project)
  }
  const handleUpload = (file: File) => {
    requestedFile.current = null
    if (searchParams.has("dataset")) setSearchParams({}, { replace: true })
    return load(new File([file], file.name, { type: file.type }), file.name)
  }

  // Al llegar con ?dataset=… (p. ej. desde /datasets) ese CSV se carga solo; si ya es el cargado, no se repite
  const onRequestedDataset = useEffectEvent((project: ProjectDataset_t) => {
    if (project.file !== requestedFile.current) void loadProject(project)
  })
  useEffect(() => {
    if (requestedDataset !== undefined) onRequestedDataset(requestedDataset)
  }, [requestedDataset])
  const handleRejected = async (files: FileRejection[], event: DropEvent) => {
    console.error({ files, event })
    await AlertHelper.alertError(t("error.file-not-valid", { title: "Error" }))
  }

  // region Análisis: se calcula una vez por conjunto de datos (y objetivo)
  const profile = analysis?.profile ?? null
  const columnValues = useMemo(() => new Map((loaded?.columns ?? []).map(({ name, values }) => [name, values])), [loaded])
  const numbers = useMemo(() => new Map(Object.entries(analysis?.numbers ?? {})), [analysis])
  const correlations = useMemo(() => analysis?.correlations ?? { names: [], matrix: [] }, [analysis])

  const targetProfile = profile?.profiles.find(({ name }) => name === target)
  const problem = targetProfile ? inferProblem(targetProfile, loaded?.variables, loaded?.project) : null
  const classes = useMemo(() => (problem === "classification" && targetProfile
    ? targetProfile.top.map(({ value }) => value).sort(naturalCompare)
    : []), [problem, targetProfile])
  const identifiers = useMemo(() => (loaded?.dataframe.columns ?? []).filter((column) => variableOf(loaded?.variables, column)?.role === "ID"), [loaded])
  const warnings = useMemo(() => (profile ? dataWarnings(profile, target, correlations, { problem, identifiers }) : []),
    [profile, target, correlations, problem, identifiers])
  // endregion

  // «Más gráficos» con muchas filas: una muestra aleatoria (las primeras filas pueden estar ordenadas)
  const chartsDataframe = useMemo(() => {
    if (!loaded || loaded.dataframe.shape[0] <= CHART_SAMPLE_ROWS) return loaded?.dataframe
    const rows = sampleIndicesWithoutReplacement(loaded.dataframe.shape[0], CHART_SAMPLE_ROWS).sort((a, b) => a - b)
    return loaded.dataframe.iloc({ rows })
  }, [loaded])

  const firstFeature = profile?.profiles.find(({ name }) => name !== target)?.name ?? profile?.profiles[0]?.name ?? ""
  const variable = distributionVariable !== null && columnValues.has(distributionVariable) ? distributionVariable : firstFeature

  const handleShowDistribution = (column: string) => {
    setDistributionVariable(column)
    document.getElementById(sectionId(STEP_DISTRIBUTIONS))?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const steps = loaded ? STEPS : [STEP_DATA]
  const format = new Intl.NumberFormat(i18n.language)

  if (VERBOSE) console.debug("render AnalyzeDataFrame")
  return (
    <main className={"mb-3"} data-title={"DataFrame"} data-testid={"Test-AnalyzeDataFrame"}>
      <N4LSectionLayout steps={steps}>
        <h1 className={"mt-3"}><Trans i18nKey={prefix + "title"} /></h1>
        <p className={"text-body-secondary"}>{t(prefix + "intro")}</p>

        <N4LDivider i18nKey={STEP_DATA} steps={steps} />
        <AnalyzeDatasetPicker selectedFile={loaded?.project?.file ?? null}
          isLoading={isLoading}
          onProject={handleProject}
          onUpload={handleUpload}
          onRejected={handleRejected} />

        {!loaded && <div className={"mt-3"}><N4LEmptyState i18nKey={prefix + "waiting"} /></div>}

        {loaded && !profile && <div className={"mt-3"} data-testid={"Test-AnalyzeWaiting"}><WaitingPlaceholder i18nKey_title={prefix + "analyzing"} /></div>}

        {loaded && profile && <>
          <Card className={"mt-3"} data-testid={"Test-AnalyzeInfo"}>
            <Card.Body>
              <Row className={"g-3 align-items-center"}>
                <Col md={6}>
                  <div className={"fs-5 fw-semibold text-break"}>
                    {loaded.project ? t(loaded.project.i18n) : loaded.name}
                  </div>
                  <div className={"text-body-secondary small"}>
                    <code>{loaded.name}</code> · {t(prefix + "info.shape", { rows: format.format(profile.rows), columns: profile.columns })}
                    {loaded.project?.source && <> · <a href={loaded.project.source} target={"_blank"} rel={"noreferrer"}>{t(prefix + "info.source")}</a></>}
                    {loaded.variables && <> · {t(prefix + "info.variables-sheet")}</>}
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Group controlId={"analyze-target"}>
                    <Form.Label className={"small fw-semibold mb-1"}>
                      <span className={"n4l-target-swatch"} aria-hidden={true} />{t(prefix + "info.target")}
                    </Form.Label>
                    <div className={"d-flex flex-wrap align-items-center gap-2"}>
                      <Form.Select size={"sm"} style={{ maxWidth: "16rem" }} value={targetSelected ?? ""}
                        onChange={(e) => setTarget(e.target.value === "" ? null : e.target.value)}>
                        <option value={""}>{t(prefix + "info.target-none")}</option>
                        {loaded.dataframe.columns.map((column) => <option key={column} value={column}>{column}</option>)}
                      </Form.Select>
                      <Badge bg={problem === null ? "secondary" : "info"} text={problem === null ? undefined : "dark"} data-testid={"Test-AnalyzeProblem"}>
                        {problem === "classification" ? t(prefix + "info.problem-classification", { count: classes.length })
                          : problem === "regression" ? t(prefix + "info.problem-regression")
                            : t(prefix + "info.problem-none")}
                      </Badge>
                    </div>
                    <Form.Text>{t(prefix + "info.target-help")}</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <N4LDivider i18nKey={prefix + "sections.summary"} steps={steps} />
          <AnalyzeSummary profile={profile}
            targetProfile={targetProfile}
            targetNumbers={target === null ? undefined : numbers.get(target)}
            classes={classes}
            problem={problem}
            warnings={warnings} />

          <N4LDivider i18nKey={prefix + "sections.variables"} steps={steps} />
          <DataFrameCard title={prefix + "variables.title"}
            description={{ buttonKey: "dataframe.describe.description.title", Modal: DataFrameDescribeModalDescription }}>
            <N4LDeferredMount minHeight={600}>
              <AnalyzeVariables profiles={profile.profiles}
                numbers={numbers}
                target={target}
                variables={loaded.variables}
                onShowDistribution={handleShowDistribution} />
            </N4LDeferredMount>
          </DataFrameCard>

          <N4LDivider i18nKey={STEP_DISTRIBUTIONS} steps={steps} />
          <DataFrameCard title={prefix + "distributions.title"}>
            <N4LDeferredMount minHeight={520}>
              <AnalyzeDistributions profiles={profile.profiles}
                columnValues={columnValues}
                numbers={numbers}
                target={target}
                problem={problem}
                classes={classes}
                variable={variable}
                onVariable={setDistributionVariable} />
            </N4LDeferredMount>
          </DataFrameCard>

          <N4LDivider i18nKey={prefix + "sections.relations"} steps={steps} />
          <DataFrameCard title={prefix + "relations.title"}
            description={{ buttonKey: "dataframe.correlation-matrix.description.title", Modal: DataFrameCorrelationMatrixModalDescription }}>
            <N4LDeferredMount minHeight={800}>
              <AnalyzeRelations correlations={correlations}
                columnValues={columnValues}
                numbers={numbers}
                target={target}
                problem={problem}
                classes={classes} />
            </N4LDeferredMount>
          </DataFrameCard>

          <N4LDivider i18nKey={prefix + "sections.table"} steps={steps} />
          <DataFrameCard title={prefix + "table.title"}
            description={{ buttonKey: "dataframe.query.description.title", Modal: DataFrameQueryModalDescription }}>
            <N4LDeferredMount minHeight={500}>
              <N4LDataFrameTable dataframe={loaded.dataframe} target={target} subtitles={"dtype"} />
              <h4 className={"h6 mt-4"}>{t("dataframe.query.query")}</h4>
              <DataFrameQuery dataframe={loaded.dataframe} target={target} />
            </N4LDeferredMount>
          </DataFrameCard>

          <N4LDivider i18nKey={prefix + "sections.preprocess"} steps={steps} />
          <DataFrameCard title={prefix + "preprocess.title"}>
            <N4LDeferredMount minHeight={600}>
              <AnalyzePreprocess dataframe={loaded.dataframe} profiles={profile.profiles} target={target} name={loaded.name} />
            </N4LDeferredMount>
          </DataFrameCard>

          <N4LDivider i18nKey={prefix + "sections.charts"} steps={steps} />
          <N4LDeferredMount minHeight={500}>
            {chartsDataframe !== loaded.dataframe &&
              <p className={"small text-body-secondary"}>{t(prefix + "charts-sample", { sample: format.format(CHART_SAMPLE_ROWS), rows: format.format(profile.rows) })}</p>}
            <DataFramePlotProvider>
              <DataFramePlot dataframe={chartsDataframe ?? loaded.dataframe} isDataFrameProcessed={true} />
            </DataFramePlotProvider>
          </N4LDeferredMount>
        </>}
      </N4LSectionLayout>
    </main>
  )
}
