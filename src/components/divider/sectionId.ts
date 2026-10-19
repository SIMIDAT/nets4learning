/** id del separador de una sección (N4LDivider), al que enlaza el índice lateral (N4LSectionNav) */
export const sectionId = (i18nKey: string) => 'n4l-section-' + i18nKey.replace(/[^a-z0-9]+/gi, '-')
