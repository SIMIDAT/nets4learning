import { Col, Form, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import ShapHeatmap from '@core/explainability/ImageHeatMapChart'
import ExplanationSummary from '@core/explainability/ExplanationSummary'
import type { ShapImageOptions_t } from '@core/explainability/shapImageOptions'

/** Resultado de una explicación de imagen (SHAP por segmentos o LRP por píxel). */
export type ImageExplainResult_t = {
  method             : 'shap' | 'lrp'
  /** Un vector de relevancias por etiqueta/clase explicada. */
  values             : number[][]
  labels             : Array<string | number>
  /** Texto de cada etiqueta para mostrarla (si no, se usa `formatLabel` o "Clase #N"). */
  labelTexts?        : string[]
  galleryImages      : string[]
  /** Imagen base del mapa de calor (dataURL). */
  imageSrc?          : string
  segmentationMap    : Int32Array | Uint8Array | number[] | null
  segmentationWidth? : number
  segmentationHeight?: number
  /** SHAP: valor de cada etiqueta con la imagen tapada (punto de partida). */
  baseValues?        : number[] | null
  /** Valor (probabilidad o confianza, 0-1) de cada etiqueta con la imagen completa. */
  predictedValues?   : number[]
  /** Clave de i18n del nombre de cada segmento, si tienen significado (zonas de la cara). */
  segmentLabelKeys?  : string[] | null
  /** Clave de i18n de una nota del modelo sobre cómo leer su explicación. */
  noteKey?           : string | null
}

type ImageExplainResultsProps = {
  result      : ImageExplainResult_t
  formatLabel?: (label: string | number) => string
}

const percent = (value: number) => `${(value * 100).toFixed(0)} %`

/** Galería de perturbaciones + un mapa de calor (con su resumen) por etiqueta explicada. */
export function ImageExplainResults({ result, formatLabel }: ImageExplainResultsProps) {
  const { t } = useTranslation()

  if (result.values.length === 0) {
    return <p className="text-center text-body-secondary">{t('ui.explain.noData')}</p>
  }

  const labelText = (idx: number) => {
    const label = result.labels[idx] ?? idx
    if (result.labelTexts?.[idx]) return result.labelTexts[idx]
    if (formatLabel) return formatLabel(label)
    // Una etiqueta con nombre (p. ej. una clase de ImageNet) se muestra tal cual; un índice, como «Clase N».
    const isIndex = typeof label === 'number' || !Number.isNaN(Number(label))
    return isIndex ? t('ui.explain.class', { index: String(label) }) : String(label)
  }

  return (
    <>
      {result.galleryImages.length > 0 && (
        <div className="mb-4">
          <h5>{t('ui.explain.perturbationSamples')}</h5>
          <p className="small text-body-secondary mb-2">{t('ui.explain.perturbation-help')}</p>
          <div className="d-flex gap-2 overflow-x-auto p-2 bg-body-tertiary rounded">
            {result.galleryImages.map((imgSrc, idx) => (
              <div key={idx} className="flex-shrink-0 text-center">
                <img src={imgSrc} alt={`sample-${idx + 1}`} className="border rounded" style={{ height: 80, objectFit: 'contain' }} />
                <div className="small text-body-secondary">#{idx + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Row>
        {result.values.map((values, idx) => {
          const target = labelText(idx)
          const predicted = result.predictedValues?.[idx]
          const base = result.baseValues?.[idx]
          const contributions = result.segmentLabelKeys
            ? values.map((value, segment) => ({ name: t(result.segmentLabelKeys![segment] ?? String(segment)), value }))
            : []
          return (
            <Col key={idx} md={6} lg={4} className="mb-3">
              <div className="border rounded p-2 text-center">
                <h6 className="fw-bold mb-2">
                  {target}
                  {predicted !== undefined && <span className="fw-normal text-body-secondary"> · {percent(predicted)}</span>}
                </h6>
                <ShapHeatmap
                  imageSrc={result.imageSrc}
                  shapValues={values}
                  segmentationMap={result.segmentationMap}
                  segmentationWidth={result.segmentationWidth}
                  segmentationHeight={result.segmentationHeight}
                />
                {result.method === 'shap' && base !== undefined && base !== null && predicted !== undefined && (
                  <ExplanationSummary
                    target={target}
                    baseValue={base}
                    baseLabel={t('ui.explain.summary.base-image')}
                    predictedValue={predicted}
                    contributions={contributions}
                    format={percent}
                  />
                )}
                {result.method === 'lrp' && (
                  <p className="small text-start bg-body-tertiary rounded p-2 mt-2 mb-0">{t('ui.explain.summary.lrp', { target })}</p>
                )}
              </div>
            </Col>
          )
        })}
      </Row>
      {result.noteKey && <p className="small text-start bg-body-tertiary rounded p-2">{t(result.noteKey)}</p>}
      <p className="small text-body-secondary">{t('ui.explain.notes.wrong-prediction')}</p>
    </>
  )
}

type ShapImageControlsProps = {
  idPrefix: string
  options : ShapImageOptions_t
  onChange: (options: ShapImageOptions_t) => void
}

/** Controles de SHAP de imagen: rejilla, nº de muestras, máscara y desenfoque. */
export function ShapImageControls({ idPrefix, options, onChange }: ShapImageControlsProps) {
  const { t } = useTranslation()
  const set = <K extends keyof ShapImageOptions_t>(key: K, value: ShapImageOptions_t[K]) =>
    onChange({ ...options, [key]: value })

  return (
    <>
      <Form.Group className="mb-2" controlId={`${idPrefix}-grid-side`}>
        <Form.Label>{t('ui.explain.gridSide')}</Form.Label>
        <Form.Control type="number" min={2} max={32} value={options.gridSide}
                      onChange={(e) => set('gridSide', Number(e.target.value))} />
      </Form.Group>
      <Form.Group className="mb-2" controlId={`${idPrefix}-n-samples`}>
        <Form.Label>{t('ui.explain.nSamples')}</Form.Label>
        <Form.Control type="number" min={10} max={2000} step={10} value={options.nSamples}
                      onChange={(e) => set('nSamples', Number(e.target.value))} />
      </Form.Group>
      <Form.Group className="mb-2" controlId={`${idPrefix}-mask`}>
        <Form.Label>{t('ui.explain.maskRange')}</Form.Label>
        <Form.Control type="number" min={0} max={1} step={0.05} value={options.maskValue}
                      onChange={(e) => set('maskValue', Number(e.target.value))} />
      </Form.Group>
      <Form.Group className="mb-2" controlId={`${idPrefix}-blur`}>
        <Form.Check type="checkbox" label={t('ui.blur.enable')} checked={options.blur}
                    onChange={(e) => set('blur', e.target.checked)} />
      </Form.Group>
      {options.blur && (
        <>
          <Form.Group className="mb-2" controlId={`${idPrefix}-blur-kernel`}>
            <Form.Label>{t('ui.blur.kernelSize')}</Form.Label>
            <Form.Control type="number" min={3} max={101} step={2} value={options.blurKernelSize}
                          onChange={(e) => set('blurKernelSize', Number(e.target.value))} />
          </Form.Group>
          <Form.Group className="mb-2" controlId={`${idPrefix}-blur-passes`}>
            <Form.Label>{t('ui.blur.passes')}</Form.Label>
            <Form.Control type="number" min={1} max={6} value={options.blurPasses}
                          onChange={(e) => set('blurPasses', Number(e.target.value))} />
          </Form.Group>
        </>
      )}
    </>
  )
}
