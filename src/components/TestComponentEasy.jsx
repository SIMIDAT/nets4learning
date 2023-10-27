import { Trans, useTranslation } from 'react-i18next'

export default function TestComponentEasy () {
  const { t } = useTranslation('dataframe')
  return <p><Trans t={t} i18nKey={'hello'} /> TestComponentEasy</p>
}