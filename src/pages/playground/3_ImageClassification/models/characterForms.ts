import type { N4LTask_t } from '@core/n4l/format'
import { n4lImageExamples } from '@core/n4l/imageClassification'

/** Una forma antigua de un carácter: su imagen y el kanji del que viene */
export type OldForm_t = {
  /** Dirección de la imagen */
  image : string
  origin: string
}

/** Un carácter que se escribía de varias formas: cómo es hoy y sus formas antiguas, para enseñarlas juntas */
export type CharacterForms_t = {
  /** El carácter de hoy */
  char   : string
  /** Cómo se lee (en rōmaji) */
  reading: string
  /** El kanji del que viene la forma de hoy */
  origin : string
  /** Dirección de la imagen del carácter de hoy */
  modern : string
  /** Formas antiguas: las FEATURED_FORMS primeras se enseñan en los ejemplos; todas, en la información del modelo */
  old    : OldForm_t[]
}

/** Formas antiguas de cada carácter en los ejemplos */
export const FEATURED_FORMS = 3

/**
 * Los caracteres de un paquete con formas antiguas (KMNIST): sus clases con cómo se leen (`reading`) y, de sus imágenes
 * de ejemplo, la de hoy y las antiguas (`old`), en su orden. null si sus clases no son caracteres. `urlOf`: la
 * dirección de cada imagen
 */
export function n4lCharacterForms(section: N4LTask_t, urlOf: (file: string) => string): CharacterForms_t[] | null {
  const classes = section.classes ?? []
  if (!classes.some(({ reading }) => reading !== undefined)) return null
  const images = n4lImageExamples(section)
  return classes.map(({ id, reading = '', origin = '' }) => {
    const own = images.filter(({ expected }) => expected === id)
    const modern = own.find(({ old }) => old !== true)
    return {
      char  : id,
      reading,
      origin,
      modern: modern === undefined ? '' : urlOf(modern.file),
      old   : own.filter(({ old }) => old === true).map(({ file, origin: from = '' }) => ({ image: urlOf(file), origin: from })),
    }
  })
}
