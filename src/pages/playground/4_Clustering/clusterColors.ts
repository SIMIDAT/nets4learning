import { categoryColor, type ChartColor_t } from '@core/chartColors'
import type { Theme_t } from '@core/theme'

/** Un color por grupo (los mismos en todas las gráficas y tablas del agrupamiento), en el tono del tema */
const CLUSTER_ORDER: readonly ChartColor_t[] = ['blue', 'orange', 'green', 'pink', 'purple', 'teal', 'red', 'yellow', 'cyan', 'gray']

export const clusterColor = (cluster: number, theme: Theme_t) => categoryColor(CLUSTER_ORDER, cluster, theme)
