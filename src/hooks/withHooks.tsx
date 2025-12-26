import { withTranslation } from 'react-i18next'
import { useParams } from 'react-router'

export default function withHooks(Component: React.ComponentType<any>) {
  return withTranslation()(props => <Component {...props} params={useParams()} />)
}
