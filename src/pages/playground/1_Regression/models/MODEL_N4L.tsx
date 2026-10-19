import type { TFunction } from 'i18next'

import * as _Types from '@core/types'
import { TASKS } from '@/TASKS'
import { denseLayers, n4lLayersModels, n4lTaskText, n4lTableView, type N4LDataset_t, type N4LTaskView_t } from '@core/n4l/format'
import { prepareRegression } from '@core/n4l/regression'
import type { N4LPackage_t } from '@core/n4l/source'
import { fileName } from '@core/n4l/tabularData'
import { loadN4LLayersModel } from '@core/n4l/tfjsModel'
import { N4LError } from '@core/n4l/validate'
import N4LPackageDescription from '@components/n4l/N4LPackageDescription'
import I_MODEL_REGRESSION from './_model'

/**
 * Un modelo de regresión de un paquete .n4l: sus conjuntos, sus modelos ya entrenados (los de cada CSV) y la red por
 * defecto salen de su manifiesto (su sección de regresión) y sus textos. Cumple la misma interfaz que las clases de
 * antes, así que las páginas no cambian
 */
export default class MODEL_N4L extends I_MODEL_REGRESSION {
  readonly pkg : N4LPackage_t
  readonly view: N4LTaskView_t<N4LDataset_t>

  constructor(t: TFunction<'translation', undefined>, setAccordionActive: React.Dispatch<React.SetStateAction<string[]>>, pkg: N4LPackage_t) {
    super(t, setAccordionActive)
    const view = n4lTableView(pkg.manifest, TASKS.REGRESSION)
    if (view === undefined) throw new N4LError(pkg.manifest.id, ['no tiene la tarea regression'])
    this.pkg = pkg
    this.view = view
    this._KEY = view.section.key
    this.i18n_TITLE = n4lTaskText(pkg.namespace, TASKS.REGRESSION) + 'title'
    this.URL_DATASET = pkg.manifest.source?.url ?? ''
  }

  /** El paquete del que sale (para descargarlo) */
  N4L_PACKAGE() {
    return this.pkg
  }

  DESCRIPTION() {
    return <N4LPackageDescription manifest={this.pkg.manifest} namespace={this.pkg.namespace} task={TASKS.REGRESSION} />
  }

  /** La misma red para todos sus conjuntos; las capas «locked» no se pueden cambiar (la salida, que da un número) */
  DEFAULT_LAYERS(_dataset: string): _Types.CustomParamsLayerModel_t[] {
    return denseLayers(this.view.section.training?.layers).map(({ units, activation, locked }) => ({ units, activation, is_disabled: locked ?? false }))
  }

  async DATASETS(): Promise<_Types.DatasetProcessed_t[]> {
    return prepareRegression(this.pkg, this.view)
  }

  TEST_METRICS(dataset: string) {
    const ids = this.view.datasets.filter(({ file }) => fileName(file) === dataset).map(({ id }) => id)
    const metrics = this.view.section.models.find((model) => ids.includes(model.dataset))?.metrics
    const { test_r2, test_mae, test_baseline_mae } = metrics ?? {}
    return test_r2 === undefined || test_mae === undefined || test_baseline_mae === undefined ? null : { test_r2, test_mae, test_baseline_mae }
  }

  /** Los modelos ya entrenados con el CSV `dataset` (por su nombre de fichero) */
  async MODELS(dataset = ''): Promise<_Types.CustomModel_t[]> {
    const ids = this.view.datasets.filter(({ file }) => fileName(file) === dataset).map(({ id }) => id)
    const models = n4lLayersModels(this.view.section).filter((model) => ids.includes(model.dataset))
    return Promise.all(models.map(async ({ path }) => ({
      model     : await loadN4LLayersModel(this.pkg.source, path),
      model_path: this.pkg.source.url(path) ?? path,
    })))
  }
}
