import { Trans } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'
import { sectionId } from './sectionId'

type N4LDividerProps = {
  i18nKey: string
  /** Secciones de la página en orden (sus i18nKey): si se pasa, el título lleva su número ("3 · Modelo") */
  steps? : string[]
}

export default function N4LDivider({ i18nKey, steps }: N4LDividerProps) {
  const step = steps ? steps.indexOf(i18nKey) + 1 : 0

  if (VERBOSE) console.debug('render N4LDivider')
  return <>
    {/* tabIndex -1: el índice lateral lleva el foco aquí al saltar a la sección */}
    <div className={'mt-3 mb-4 n4l-hr-row'} id={sectionId(i18nKey)} tabIndex={-1}>
      <p>
        <span className={'n4l-hr-title'}>
          {step > 0 && `${step}. `}
          <Trans i18nKey={i18nKey} />
        </span>
      </p>
    </div>
  </>
}
