import { Col, Form, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import ShapHeatmap from '@core/explainability/ImageHeatMapChart'
import type { ShapImageOptions_t } from '@core/explainability/shapImageOptions'

/** Resultado de una explicación de imagen (SHAP por segmentos o LRP por píxel). */
export type ImageExplainResult_t = {
  /** Un vector de relevancias por etiqueta/clase explicada. */
  values             : number[][]
  labels             : Array<string | number>
  galleryImages      : string[]
  /** Imagen base del mapa de calor (dataURL). */
  imageSrc?          : string
  segmentationMap    : Int32Array | Uint8Array | number[] | null
  segmentationWidth? : number
  segmentationHeight?: number
}

type ImageExplainResultsProps = {
  result      : ImageExplainResult_t
  formatLabel?: (label: string | number) => string
}

/** Galería de perturbaciones + un mapa de calor por etiqueta explicada. */
export function ImageExplainResults({ result, formatLabel }: ImageExplainResultsProps) {
  const { t } = useTranslation()

  if (result.values.length === 0) {
    return <p className="text-center text-body-secondary">{t('ui.explain.noData')}</p>
  }

  return (
    <>
      {result.galleryImages.length > 0 && (
        <div className="mb-4">
          <h5>{t('ui.explain.perturbationSamples')}</h5>
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
          const label = result.labels[idx] ?? idx
          return (
            <Col key={idx} md={6} lg={4} className="mb-3">
              <div className="border rounded p-2 text-center">
                <h6 className="fw-bold mb-2">
                  {formatLabel ? formatLabel(label) : t('ui.explain.class', { index: String(label) })}
                </h6>
                <ShapHeatmap
                  imageSrc={result.imageSrc}
                  shapValues={values}
                  segmentationMap={result.segmentationMap}
                  segmentationWidth={result.segmentationWidth}
                  segmentationHeight={result.segmentationHeight}
                />
              </div>
            </Col>
          )
        })}
      </Row>
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
        <Form.Control type="number" min={1} max={500} value={options.nSamples}
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
