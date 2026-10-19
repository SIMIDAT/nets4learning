import { TASKS } from '@/TASKS'
import type { MenuModel_t } from '@/DATA_MODEL'
import { n4lTaskText } from '@core/n4l/format'
import type { N4LPackage_t } from '@core/n4l/source'
import N4LPackageDescription from '@components/n4l/N4LPackageDescription'

/**
 * Lo que los menús saben de una serie de un paquete .n4l (la de su modelo ya entrenado y la de entrenar): su nombre y
 * la descripción del paquete, con las métricas de su modelo
 */
export default class MODEL_N4L implements MenuModel_t {
  readonly pkg       : N4LPackage_t
  readonly i18n_TITLE: string

  constructor(pkg: N4LPackage_t) {
    this.pkg = pkg
    this.i18n_TITLE = n4lTaskText(pkg.namespace, TASKS.TIME_SERIES) + 'name'
  }

  DESCRIPTION() {
    return <N4LPackageDescription manifest={this.pkg.manifest} namespace={this.pkg.namespace} task={TASKS.TIME_SERIES} />
  }
}
