import { Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import type { CharacterForms_t } from '../models/characterForms'

/**
 * Cada carácter como se escribe hoy (con cómo se lee y el kanji del que viene) junto a todas sus formas antiguas, cada
 * una con su kanji. Para la información del modelo: cabe también en la columna estrecha de la página del modelo
 */
export function CharacterFormsTable({ characters, prefix }: { characters: CharacterForms_t[], prefix: string }) {
  const { t } = useTranslation()
  return (
    <figure className={'n4l-character-forms'} data-testid={'Test-CharacterForms'}>
      <Table size={'sm'} className={'align-middle mb-1'}>
        <caption className={'caption-top fw-semibold text-body'}>{t(prefix + 'title')}</caption>
        <thead>
          <tr>
            <th scope={'col'}>{t(prefix + 'modern')}</th>
            <th scope={'col'}>{t(prefix + 'old')}</th>
          </tr>
        </thead>
        <tbody>
          {characters.map(({ char, reading, origin, old }) => (
            <tr key={char}>
              <th scope={'row'} className={'n4l-character-modern'}>
                <span lang={'ja'} className={'n4l-character-glyph'}>{char}</span>
                <span className={'n4l-character-reading'}>{reading} · <span lang={'ja'}>{origin}</span></span>
              </th>
              <td>
                <div className={'n4l-character-old-list'}>
                  {old.map(({ image, origin: from }) => (
                    <figure key={image} className={'n4l-character-old'}>
                      <img src={image} width={44} height={44} loading={'lazy'} alt={t(prefix + 'old-alt', { char, origin: from })} />
                      <figcaption lang={'ja'} aria-hidden={true}>{from}</figcaption>
                    </figure>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <figcaption className={'small text-body-secondary'}>{t(prefix + 'note')}</figcaption>
    </figure>
  )
}

type CharacterFormsExamplesProps = {
  characters: CharacterForms_t[]
  /** Cuántas formas antiguas de cada carácter (las primeras) */
  forms     : number
  prefix    : string
  disabled  : boolean
  onClassify: (src: string) => void
}

/** Las imágenes de ejemplo, carácter a carácter: la de hoy y algunas antiguas, y cada una se clasifica al pulsarla */
export function CharacterFormsExamples({ characters, forms, prefix, disabled, onClassify }: CharacterFormsExamplesProps) {
  const { t } = useTranslation()
  return (
    <div className={'n4l-character-examples'} data-testid={'Test-CharacterExamples'}>
      {characters.map(({ char, reading, modern, old }) => (
        <div key={char} className={'n4l-character-example'} role={'group'} aria-label={`${char} (${reading})`}>
          <div className={'n4l-character-example-title'}>
            <span lang={'ja'}>{char}</span><span className={'n4l-character-example-separator'}> · </span><span>{reading}</span>
          </div>
          <div className={'d-flex align-items-end gap-2'}>
            <div className={'text-center'}>
              <button type={'button'} className={'n4l-example-image n4l-character-example-modern'} disabled={disabled}
                onClick={() => onClassify(modern)} aria-label={t(prefix + 'classify-modern', { char })}>
                <img src={modern} alt={''} />
              </button>
              <div className={'n4l-character-example-label'}>{t(prefix + 'modern')}</div>
            </div>
            <div className={'text-center'}>
              <div className={'n4l-character-example-old-list'}>
                {old.slice(0, forms).map(({ image, origin }) => (
                  <div key={image} className={'text-center'}>
                    <button type={'button'} className={'n4l-example-image n4l-character-example-old'} disabled={disabled}
                      onClick={() => onClassify(image)} aria-label={t(prefix + 'classify-old', { char, origin })}>
                      <img src={image} alt={''} />
                    </button>
                    <div className={'n4l-character-example-origin'} lang={'ja'} aria-hidden={true}>{origin}</div>
                  </div>
                ))}
              </div>
              <div className={'n4l-character-example-label'}>{t(prefix + 'old')}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
