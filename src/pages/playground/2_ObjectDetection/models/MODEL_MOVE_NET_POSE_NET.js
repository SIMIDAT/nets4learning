import I_MODEL_OBJECT_DETECTION from './_model'
import { Trans } from 'react-i18next'
import * as poseDetection from '@tensorflow-models/pose-detection'

export class MODEL_MOVE_NET_POSE_NET extends I_MODEL_OBJECT_DETECTION {
  static KEY = 'MOVE-NET--POSE-NET'
  TITLE = 'datasets-models.2-object-detection.move-net--pose-net.title'
  i18n_TITLE = 'datasets-models.2-object-detection.move-net--pose-net.title'
  URL = 'https://github.com/tensorflow/tfjs-models/tree/master/pose-detection'

  DESCRIPTION () {
    const prefix = 'datasets-models.2-object-detection.move-net--pose-net.description.'
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
                     link1: <a href={'https://tfhub.dev/google/movenet/multipose/lightning/1'} target={'_blank'} rel="noreferrer">link</a>,
                   }} />

            <Trans i18nKey={prefix + 'details-references.list.1'}
                   components={{
                     link1: <a href={'https://tfhub.dev/google/movenet/multipose/lightning/1'} target={'_blank'} rel="noreferrer">link</a>,
                   }} />
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@article{DBLP:journals/corr/KendallGC15,
  author       = {Alex Kendall and
                  Matthew Grimes and
                  Roberto Cipolla},
  title        = {Convolutional networks for real-time 6-DOF camera relocalization},
  journal      = {CoRR},
  volume       = {abs/1505.07427},
  year         = {2015},
  url          = {http://arxiv.org/abs/1505.07427},
  eprinttype    = {arXiv},
  eprint       = {1505.07427},
  timestamp    = {Mon, 13 Aug 2018 16:46:52 +0200},
  biburl       = {https://dblp.org/rec/journals/corr/KendallGC15.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}
`}
        </pre>
      </details>
    </>
  }

  async ENABLE_MODEL () {
    const model = poseDetection.SupportedModels.MoveNet
    const moveNetModelConfig = {
      modelType     : poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
      enableTracking: true,
      trackerType   : poseDetection.TrackerType.BoundingBox,
    }
    this._modelDetector = await poseDetection.createDetector(model, moveNetModelConfig)
  }

  async PREDICTION (img_or_video) {
    return await this._modelDetector.estimatePoses(img_or_video)
  }

  RENDER (ctx, poses) {
    // let lineas = [[10, 8], [8, 6], [6, 12], [6, 5], [5, 11], [5, 7], [7, 9], [12, 11], [12, 14], [14, 16], [11, 13], [13, 15],]
    let lineas = [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [5, 11], [6, 8], [6, 12], [7, 9], [8, 10], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16]]
    ctx.strokeStyle = '#FF0902'
    poses.forEach((pose) => {
      if (pose.score > 0.3) {
        lineas.forEach((index) => {
          ctx.beginPath()
          ctx.moveTo(pose.keypoints[index[0]].x, pose.keypoints[index[0]].y)
          ctx.lineTo(pose.keypoints[index[1]].x, pose.keypoints[index[1]].y)
          ctx.stroke()
        })
        pose.keypoints.forEach((element) => {
          ctx.beginPath()
          ctx.arc(element.x, element.y, 5, 0, (Math.PI / 180) * 360)
          ctx.stroke()
          ctx.fillText(`${element.name}`, element.x, element.y)
          // ctx.strokeRect(element.x, element.y, 10, 10)
        })
      }
    })
  }

}