import React from 'react'
import { useParams } from 'react-router'
import { withTranslation } from 'react-i18next'

export default function withHooks(Component) {
  return withTranslation()(props => <Component {...props} params={useParams()} />)
}
