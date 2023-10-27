import I_MODEL_OBJECT_DETECTION from './_model'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { Trans } from 'react-i18next'

export class MODEL_FACE_MESH extends I_MODEL_OBJECT_DETECTION {
  static KEY = 'FACE-MESH'
  TITLE = 'datasets-models.2-object-detection.face-mesh.title'
  i18n_TITLE = 'datasets-models.2-object-detection.face-mesh.title'
  URL = 'https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection'

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
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
    const mediaPipeFaceMeshMediaPipeModelConfig = {
      // runtime     : 'tfjs',
      runtime        : 'mediapipe',
      solutionPath   : 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      refineLandmarks: true,
      maxFaces       : 4,
    }
    this._modelDetector = await faceLandmarksDetection.createDetector(model, mediaPipeFaceMeshMediaPipeModelConfig)
  }

  async PREDICTION(img_or_video){
    return await this._modelDetector.estimateFaces(img_or_video)
  }

  RENDER (ctx, faces) {
    for (const face of faces) {
      ctx.strokeStyle = '#FF0902'
      for (const element of face.keypoints) {
        ctx.strokeRect(element.x, element.y, 1, 1)
      }
    }
  }

}
