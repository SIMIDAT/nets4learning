import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { Trans } from 'react-i18next'
import { syncMediaPipeMirror } from './mediapipeMirror'

import I_MODEL_OBJECT_DETECTION from './_model'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

export class MODEL_2_FACE_MESH extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.FACE_MESH
  TITLE = 'datasets-models.2-object-detection.face-mesh.title'
  i18n_TITLE = 'datasets-models.2-object-detection.face-mesh.title'
  URL = 'https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection'
  mirror = true
  // Salida sí/no: la explicación muestra lo mínimo que necesita ver para detectar la cara.
  EXPLAIN_NOTE_KEY = 'ui.explain.notes.presence-only'
  faces = true
  usesTensorForPrediction = true

  /**
   * @type {faceLandmarksDetection.FaceLandmarksDetector}
   */
  _modelDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null

  DESCRIPTION () {
    const prefix = 'datasets-models.2-object-detection.face-mesh.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-0'} /></p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-input.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-output.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-references.title'} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + 'details-references.list.0'}
                   components={{
                     link1: <a href={'https://tfhub.dev/mediapipe/tfjs-model/facemesh/1/default/1'} target={'_blank'} rel="noreferrer">link</a>,
                   }} />
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@article{DBLP:journals/corr/abs-2006-10962,
  author       = {Ivan Grishchenko and
                  Artsiom Ablavatski and
                  Yury Kartynnik and
                  Karthik Raveendran and
                  Matthias Grundmann},
  title        = {Attention Mesh: High-fidelity Face Mesh Prediction in Real-time},
  journal      = {CoRR},
  volume       = {abs/2006.10962},
  year         = {2020},
  url          = {https://arxiv.org/abs/2006.10962},
  eprinttype    = {arXiv},
  eprint       = {2006.10962},
  timestamp    = {Tue, 23 Jun 2020 17:57:22 +0200},
  biburl       = {https://dblp.org/rec/journals/corr/abs-2006-10962.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}
`}
        </pre>
      </details>
    </>
  }

  async ENABLE_MODEL () {
      
    // await tf.setBackend('wasm');
    // await tf.ready();
    
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
    /**
     * @type {faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig}
     */
    const mediaPipeFaceMeshMediaPipeModelConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
      runtime        : 'mediapipe',
      solutionPath   : 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      refineLandmarks: true,
      maxFaces       : 4,
    }
    this._modelDetector = await faceLandmarksDetection.createDetector(model, mediaPipeFaceMeshMediaPipeModelConfig)
  }

  async PREDICTION (input_image_or_video: any, config = { flipHorizontal: false }): Promise<faceLandmarksDetection.Face[]> {
    if (this._modelDetector === null) return []
    syncMediaPipeMirror(this._modelDetector, config.flipHorizontal)
    return await this._modelDetector.estimateFaces(input_image_or_video, { flipHorizontal: config.flipHorizontal, staticImageMode: false })
  }

  // Se explica una sola salida: "¿hay una cara?" (FaceMesh no da una confianza por cara).
  EXPLAIN_LABELS(detections: faceLandmarksDetection.Face[]): string[] {
    return detections?.length ? ['face'] : []
  }

  EXPLAIN_LABEL_TEXT(_label: string | number): string {
    return this.t('ui.explain.labels.face')
  }

  /** 1 si se detecta alguna cara, 0 si no. */
  NORMALIZE_PREDICTIONS(predictions: faceLandmarksDetection.Face[], _labels?: Array<string | number>): number[] {
    return [Array.isArray(predictions) && predictions.length > 0 ? 1 : 0]
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {faceLandmarksDetection.Face[]} faces 
   */
  RENDER (ctx: CanvasRenderingContext2D, faces: faceLandmarksDetection.Face[]) {
    for (const face of faces) {
      this._drawRect(ctx, face.box.xMin, face.box.yMin, face.box.width, face.box.height)
      for (const {x, y} of face.keypoints) {
        ctx.strokeRect(x, y, 3, 3)
      }
    }
  }

}
