import { useMemo, useRef, useState } from 'react'
import { Button, Card, Col, Form, ProgressBar, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as tf from '@tensorflow/tfjs'
import { KernelSHAP } from '@core/explainability/webshap'

import alertHelper from '@utils/alertHelper'
import { myModelWrapper } from '@core/explainability/ModelExplanation'
import ShapExplanationChart from '@core/explainability/ModelExplanationChart'
import ShapBeeswarmChart from '@core/explainability/ShapBeeswarmChart'
import ExplanationSummary from '@core/explainability/ExplanationSummary'
import { buildShapBackground, sampleIndicesWithoutReplacement } from '@core/explainability/shapSampling'

type PredictModel = { predict: (x: tf.Tensor) => tf.Tensor | tf.Tensor[] }

// KernelSHAP evalúa el modelo `nSamples × filas de background` veces por instancia:
// un background pequeño mantiene el coste acotado (sobre todo en el SHAP global).
const BACKGROUND_ROWS = 10
const SHAP_SEED = 0.2022
const PREFIX = 'pages.playground.0-tabular-classification.general.'

type TabularShapPanelProps = {
  features            : string[]
  /** Clases del modelo (clasificación). Sin clases → regresión, con un único target. */
  classes?            : string[]
  /** Clase que se explica por defecto (la predicha). */
  predictedClassIndex?: number
  getModel            : () => PredictModel | null
  /** Instancia a explicar, en el mismo espacio que recibe `model.predict`; null si no hay. */
  getInstance         : () => number[] | null
  /** Filas del dataset en el mismo espacio que la instancia (background y SHAP global). */
  getPool             : () => number[][]
  /** Cambia con cada nueva predicción: la explicación local anterior deja de ser válida. */
  inputKey?           : unknown
  /** Regresión: nombre de la variable que se predice (p. ej. "mpg"). */
  targetName?         : string
  /** Valores legibles de la instancia (unidades y categorías originales), uno por feature. */
  getInstanceDisplay? : () => Array<string | number> | null
  /** Valores legibles (antes del escalado) de cada fila de `getPool()`, en el mismo orden. */
  getPoolDisplay?     : () => Array<Array<string | number>> | null
  /** Las features llegan al modelo escaladas: si no hay `getPoolDisplay`, se avisa en el beeswarm. */
  valuesAreScaled?    : boolean
}

/** Explicabilidad SHAP de modelos tabulares: explicación local e importancia global. */
export default function TabularShapPanel(props: TabularShapPanelProps) {
  const { features, classes, predictedClassIndex = 0, getModel, getInstance, getPool, inputKey, targetName, getInstanceDisplay, getPoolDisplay, valuesAreScaled } = props
  const { t } = useTranslation()
  const isClassification = (classes?.length ?? 0) > 0

  // Clase elegida por el usuario para la predicción actual; con cada nueva predicción se
  // vuelve a explicar por defecto la clase predicha.
  const [classChoice, setClassChoice] = useState<{ inputKey: unknown, index: number } | null>(null)
  const selectedClassIndex = classChoice && classChoice.inputKey === inputKey ? classChoice.index : predictedClassIndex
  const target = isClassification ? selectedClassIndex : 0
  const [nSamples, setNSamples] = useState(500)

  // SHAP local: solo es válido para la entrada con la que se calculó.
  const [localShap, setLocalShap] = useState<{
    inputKey: unknown
    shap    : number[][]
    /** Predicción media del modelo sobre el background (punto de partida de SHAP), por target. */
    base    : number[]
    /** Valores legibles de la instancia explicada. */
    display : Array<string | number>
  } | null>(null)
  const [showLocal, setShowLocal] = useState(false)
  const [isCalculatingLocal, setIsCalculatingLocal] = useState(false)
  const localVisible = showLocal && localShap !== null && localShap.inputKey === inputKey

  // SHAP global: matriz shap[instancia][feature] + valores de las features, para un target.
  const [globalShap, setGlobalShap] = useState<{
    target        : number
    shap          : number[][]
    featureValues : number[][]
    /** Valores legibles de cada instancia explicada (null si no los hay). */
    featureDisplay: Array<Array<string | number>> | null
  } | null>(null)
  const [showGlobal, setShowGlobal] = useState(false)
  const [isCalculatingGlobal, setIsCalculatingGlobal] = useState(false)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [nInstancesGlobal, setNInstancesGlobal] = useState(20)
  const [globalSortOrder, setGlobalSortOrder] = useState<'desc' | 'asc' | 'none'>('desc')
  const [globalChartType, setGlobalChartType] = useState<'bar' | 'beeswarm'>('bar')
  const cancelGlobal_ref = useRef(false)
  const globalVisible = showGlobal && globalShap !== null && globalShap.target === target

  // Importancia global = mean(|SHAP|) por feature.
  const globalImportance = useMemo<number[] | null>(() => {
    if (!globalShap || globalShap.shap.length === 0) return null
    const sums = new Array(features.length).fill(0)
    for (const row of globalShap.shap) {
      for (let f = 0; f < features.length; f++) sums[f] += Math.abs(row[f] ?? 0)
    }
    return sums.map((s) => s / globalShap.shap.length)
  }, [globalShap, features.length])

  const handleClick_ExplainLocal = async () => {
    if (localVisible) {
      setShowLocal(false)
      return
    }
    const model = getModel()
    if (!model) {
      await alertHelper.alertError(t('ui.explain.model-not-available'))
      return
    }
    const instance = getInstance()
    if (!instance || instance.length === 0) {
      await alertHelper.alertInfo(t('info.insert-input'))
      return
    }

    setIsCalculatingLocal(true)
    try {
      // KernelSHAP bloquea el hilo: dejamos que el botón pinte "Calculando…" antes de empezar.
      await tf.nextFrame()
      const background = buildShapBackground(getPool(), instance.length, BACKGROUND_ROWS)
      const explainer = new KernelSHAP(myModelWrapper(model), background, SHAP_SEED)
      const shap = await explainer.explainOneInstance(instance, nSamples)
      // Valores legibles solo si están alineados con las features; si no, los del modelo.
      const readable = getInstanceDisplay?.()
      const display = readable && readable.length === features.length ? readable : instance.map((v) => +v.toFixed(3))
      setLocalShap({ inputKey, shap, base: [...explainer.expectedValue], display })
      setShowLocal(true)
    } catch (error) {
      console.error('Error calculating explainability', { error })
      await alertHelper.alertError(t('ui.explain.error'))
    } finally {
      setIsCalculatingLocal(false)
    }
  }

  const handleClick_ExplainGlobal = async () => {
    if (isCalculatingGlobal) {
      cancelGlobal_ref.current = true
      return
    }
    if (globalVisible) {
      setShowGlobal(false)
      return
    }
    const model = getModel()
    if (!model) {
      await alertHelper.alertError(t('ui.explain.model-not-available'))
      return
    }
    const rawPool = getPool()
    const rawDisplay = getPoolDisplay?.() ?? null
    const poolDisplay = rawDisplay && rawDisplay.length === rawPool.length ? rawDisplay : null
    const validIndices = rawPool.map((_, i) => i).filter((i) => rawPool[i].length === features.length)
    const pool = validIndices.map((i) => rawPool[i])
    if (pool.length === 0) {
      await alertHelper.alertError(t(PREFIX + 'no-data'))
      return
    }

    cancelGlobal_ref.current = false
    setIsCalculatingGlobal(true)
    setGlobalProgress(0)
    try {
      await tf.nextFrame()
      const background = buildShapBackground(pool, features.length, BACKGROUND_ROWS)
      const predictor = myModelWrapper(model)
      const sampled = sampleIndicesWithoutReplacement(validIndices.length, nInstancesGlobal).map((k) => validIndices[k])
      const instances = sampled.map((i) => rawPool[i])

      const shapMatrix: number[][] = []
      const explained: number[][] = []
      for (const instance of instances) {
        if (cancelGlobal_ref.current) break
        // KernelSHAP no resetea su estado interno entre llamadas → uno nuevo por instancia.
        const explainer = new KernelSHAP(predictor, background, SHAP_SEED)
        const shap = await explainer.explainOneInstance(instance, nSamples)
        const targetShap = shap[target] ?? []
        shapMatrix.push(features.map((_, f) => targetShap[f] ?? 0))
        explained.push(instance)
        setGlobalProgress(Math.round((explained.length / instances.length) * 100))
        // Cedemos el hilo para que la barra de progreso y el botón de cancelar respondan.
        await tf.nextFrame()
      }

      if (shapMatrix.length > 0) {
        const featureDisplay = poolDisplay ? sampled.slice(0, explained.length).map((i) => poolDisplay[i]) : null
        setGlobalShap({ target, shap: shapMatrix, featureValues: explained, featureDisplay })
        setShowGlobal(true)
      }
    } catch (error) {
      console.error('Error calculating global explainability', { error })
      await alertHelper.alertError(t('ui.explain.error'))
    } finally {
      setIsCalculatingGlobal(false)
    }
  }

  return (
    <Card className={'mt-3'} data-testid={'explainability-card'}>
      <Card.Header>
        <h3>{t(PREFIX + 'explainability')}</h3>
      </Card.Header>
      <Card.Body>
        <Row className={'mb-2'}>
          {isClassification && (
            <Col md={6} className="mb-2">
              <Form.Group controlId="tabular-shap-class">
                <Form.Label>{t(PREFIX + 'select-class')}</Form.Label>
                <Form.Select size={'sm'} value={selectedClassIndex}
                             onChange={(e) => setClassChoice({ inputKey, index: Number(e.target.value) })}>
                  {classes!.map((c, idx) => <option key={idx} value={idx}>{t(c)}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
          <Col md={6} className="mb-2">
            <Form.Group controlId="tabular-shap-n-samples">
              <Form.Label>{t(PREFIX + 'n-samples')}</Form.Label>
              <Form.Control type="number" size={'sm'} min={10} step={10} value={nSamples}
                            onChange={(e) => setNSamples(Math.max(10, Number(e.target.value) || 10))} />
              <Form.Text className="text-body-secondary">{t(PREFIX + 'n-samples-help')}</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {/* === SHAP local: una instancia === */}
        <div className="d-grid gap-2 mb-3">
          <Button size={'lg'} variant={localVisible ? 'outline-secondary' : 'primary'}
                  onClick={handleClick_ExplainLocal} disabled={isCalculatingLocal}>
            {isCalculatingLocal
              ? t(PREFIX + 'calculating')
              : localVisible ? t(PREFIX + 'hide-explain') : t(PREFIX + 'show-explain')}
          </Button>
        </div>
        {localVisible && localShap && (
          <>
            <h4 className="h6">{t(PREFIX + 'explain-panel-local-title')}</h4>
            <p className="small text-body-secondary">{t(PREFIX + 'explain-panel-local-body')}</p>
            <ShapExplanationChart shapValues={localShap.shap} predictedClass={target} features={features} />
            <ExplanationSummary
              target={isClassification ? t(classes![target]) : (targetName ?? '')}
              baseValue={localShap.base[target] ?? 0}
              baseLabel={t('ui.explain.summary.base-tabular')}
              predictedValue={(localShap.base[target] ?? 0) + (localShap.shap[target] ?? []).reduce((a, b) => a + b, 0)}
              contributions={features.map((name, i) => ({ name: `${name} = ${localShap.display[i]}`, value: localShap.shap[target]?.[i] ?? 0 }))}
              format={isClassification ? (v) => `${(v * 100).toFixed(1)} %` : (v) => v.toFixed(2)}
            />
          </>
        )}

        {/* === SHAP global: importancia media de las características (mean|SHAP|) === */}
        <hr />
        <Row className={'mb-2'}>
          <Col md={4} className="mb-2">
            <Form.Group controlId="tabular-shap-n-instances">
              <Form.Label>{t(PREFIX + 'n-instances')}</Form.Label>
              <Form.Control type="number" size={'sm'} min={1} step={1} value={nInstancesGlobal}
                            onChange={(e) => setNInstancesGlobal(Math.max(1, Number(e.target.value) || 1))} />
              <Form.Text className="text-body-secondary">{t(PREFIX + 'n-instances-help')}</Form.Text>
            </Form.Group>
          </Col>
          <Col md={4} className="mb-2">
            <Form.Group controlId="tabular-shap-chart-type">
              <Form.Label>{t(PREFIX + 'chart-type')}</Form.Label>
              <Form.Select size={'sm'} value={globalChartType}
                           onChange={(e) => setGlobalChartType(e.target.value as 'bar' | 'beeswarm')}>
                <option value={'bar'}>{t(PREFIX + 'chart-bar')}</option>
                <option value={'beeswarm'}>{t(PREFIX + 'chart-beeswarm')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          {globalChartType === 'bar' && (
            <Col md={4} className="mb-2">
              <Form.Group controlId="tabular-shap-sort">
                <Form.Label>{t(PREFIX + 'sort-order')}</Form.Label>
                <Form.Select size={'sm'} value={globalSortOrder}
                             onChange={(e) => setGlobalSortOrder(e.target.value as 'desc' | 'asc' | 'none')}>
                  <option value={'desc'}>{t(PREFIX + 'sort-desc')}</option>
                  <option value={'asc'}>{t(PREFIX + 'sort-asc')}</option>
                  <option value={'none'}>{t(PREFIX + 'sort-none')}</option>
                </Form.Select>
              </Form.Group>
            </Col>
          )}
        </Row>

        <div className="d-grid gap-2 mb-3">
          <Button size={'lg'} variant={isCalculatingGlobal || globalVisible ? 'outline-secondary' : 'primary'}
                  onClick={handleClick_ExplainGlobal}>
            {isCalculatingGlobal
              ? t('ui.explain.cancel')
              : globalVisible ? t(PREFIX + 'hide-global') : t(PREFIX + 'show-global')}
          </Button>
          {isCalculatingGlobal && (
            <ProgressBar now={globalProgress} label={`${globalProgress}%`} striped={true} animated={true} />
          )}
        </div>
        {globalVisible && globalImportance && (
          <>
            <h4 className="h6">{t(PREFIX + 'explain-panel-global-title')}</h4>
            <p className="small text-body-secondary">{t(PREFIX + 'explain-panel-global-body')}</p>
            {globalChartType === 'bar'
              ? <ShapExplanationChart shapValues={[globalImportance]} predictedClass={0}
                                      sortOrder={globalSortOrder} features={features} />
              : <>
                <ShapBeeswarmChart shap={globalShap.shap} featureValues={globalShap.featureValues}
                                   featureDisplay={globalShap.featureDisplay ?? undefined}
                                   features={features} />
                {valuesAreScaled && !globalShap.featureDisplay && (
                  <p className="small text-body-secondary mt-1">{t('ui.explain.summary.scaled-values')}</p>
                )}
              </>}
          </>
        )}
      </Card.Body>
    </Card>
  )
}
