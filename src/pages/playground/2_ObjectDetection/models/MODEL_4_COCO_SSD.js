import React from 'react'
import { Trans } from 'react-i18next'
import I_MODEL_OBJECT_DETECTION from './_model'
import * as coCoSsdDetection from '@tensorflow-models/coco-ssd'

export class MODEL_4_COCO_SSD extends I_MODEL_OBJECT_DETECTION {
  static KEY = 'COCO-SSD'
  static URL = 'https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd'
  static URL_MODEL = ''
  TITLE = 'datasets-models.2-object-detection.coco-ssd.title'
  i18n_TITLE = 'datasets-models.2-object-detection.coco-ssd.title'
  mirror = false

  DESCRIPTION() {
    const prefix = 'datasets-models.2-object-detection.coco-ssd.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-0'} /></p>
      <p>
        <Trans i18nKey={prefix + 'text-1'}
          components={{
            link1: <a href="https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd" target={'_blank'} rel={'noreferrer'}>TEXT</a>,
          }} />
      </p>
      <p>
        <Trans i18nKey={prefix + 'text-2'}
          components={{
            link1: <a href="https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/src/classes.ts" target={'_blank'} rel={'noreferrer'}>TEXT</a>,
          }} />
      </p>
      <p><Trans i18nKey={prefix + 'text-3'} /></p>
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
                link1: <a href="https://cocodataset.org/" target={'_blank'} rel={'noreferrer'}>TEXT</a>,
              }} />
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
          {`
@article{DBLP:journals/corr/LiuAESR15,
  author       = {Wei Liu and
                  Dragomir Anguelov and
                  Dumitru Erhan and
                  Christian Szegedy and
                  Scott E. Reed and
                  Cheng{-}Yang Fu and
                  Alexander C. Berg},
  title        = {{SSD:} Single Shot MultiBox Detector},
  journal      = {CoRR},
  volume       = {abs/1512.02325},
  year         = {2015},
  url          = {http://arxiv.org/abs/1512.02325},
  eprinttype    = {arXiv},
  eprint       = {1512.02325},
  timestamp    = {Wed, 12 Feb 2020 08:32:49 +0100},
  biburl       = {https://dblp.org/rec/journals/corr/LiuAESR15.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}
`}
        </pre>
      </details>
    </>
  }

  async ENABLE_MODEL() {
    this._modelDetector = await coCoSsdDetection.load()
  }

  async PREDICTION (input_image_or_video, _config = { }) {
    if (this._modelDetector === null) return []
    return await this._modelDetector.detect(input_image_or_video)
  }

  RENDER(ctx, predictions) {
    let scoreParsed = 0
    const font = '16px Barlow-SemiBold, Barlow-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'

    predictions.forEach(({ score, class: _class, bbox }) => {
      scoreParsed = Math.round(parseFloat(score) * 100)
      this._drawRect(ctx, bbox[0], bbox[1], bbox[2], bbox[3])
      this._drawTextBG(ctx, `${_class.toUpperCase()} with ${scoreParsed}% confidence`, font, bbox[0], bbox[1], 20)
    })
  }
}
