import { Trans } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'

type N4LDividerProps = {
  i18nKey: string
  /** Secciones de la página en orden (sus i18nKey): si se pasa, el título lleva su número ("3 · Modelo") */
  steps? : string[]
}

export default function N4LDivider({ i18nKey, steps }: N4LDividerProps) {
  const step = steps ? steps.indexOf(i18nKey) + 1 : 0

  if (VERBOSE) console.debug('render N4LDivider')
  return <>
    <div className={'mt-3 mb-4 n4l-hr-row'}>
      <p>
        <span className={'n4l-hr-title'}>
          {step > 0 && `${step} · `}
          <Trans i18nKey={i18nKey} />
        </span>
      </p>
    </div>
  </>
}
