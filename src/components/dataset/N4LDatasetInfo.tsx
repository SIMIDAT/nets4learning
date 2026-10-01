import { useTranslation } from 'react-i18next'

import type { DatasetInfo_t } from '@/TASK_OPTIONS'

/** Resumen del dataset: "150 filas · 4 características · 3 clases" */
export default function N4LDatasetInfo({ info, className = 'card-text small text-body-secondary' }: { info: DatasetInfo_t, className?: string }) {
  const { t, i18n } = useTranslation()
  const format = (value: number) => new Intl.NumberFormat(i18n.language).format(value)
  const prefix = 'pages.menu.info.'
  const parts: string[] = []
  if (info.images) parts.push(t(prefix + 'images', { value: format(info.rows[0]) }))
  else if (info.rows.length === 1) parts.push(t(prefix + 'rows', { value: format(info.rows[0]) }))
  else parts.push(t(prefix + 'rows-files', { files: info.rows.length, values: info.rows.map(format).join(' / ') }))
  if (info.features !== undefined) parts.push(t(prefix + 'features', { value: info.features }))
  if (info.classes !== undefined) parts.push(t(prefix + 'classes', { value: info.classes }))
  if (info.target !== undefined) parts.push(t(prefix + 'target', { value: info.target }))
  return <p className={className}>{parts.join(' · ')}</p>
}
