import { useTranslation } from 'react-i18next'

export default function WaitingPlaceholder ({ i18nKey_title = 'Waiting', title = '' }) {

  const { t } = useTranslation()
  return <>
    <p className="placeholder-glow">
      <small className={'text-muted'}>{t(i18nKey_title)}{title}</small>
      <span className="placeholder col-12"></span>
    </p>
  </>
}
