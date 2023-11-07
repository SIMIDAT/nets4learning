import React from 'react'
export default class I_MODEL_OBJECT_DETECTION {
  TITLE = ''
  i18n_TITLE = ''

  _modelDetector = null

  constructor (_t) {
    this.t = _t
  }

  DESCRIPTION () {
    return <></>
  }

  async ENABLE_MODEL () {

  }

  async PREDICTION (_img_or_video) {
    return []
  }

  RENDER (_ctx, _predictions) {

  }
}
