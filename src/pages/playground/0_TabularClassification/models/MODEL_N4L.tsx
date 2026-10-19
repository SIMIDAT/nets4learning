import { Trans } from 'react-i18next'
import type { TFunction } from 'i18next'

import * as _Types from '@core/types'
import { TASKS } from '@/TASKS'
import { denseLayers, n4lLabelKey, n4lLayersModels, n4lTablePrediction, n4lTaskText, n4lTableView, type N4LDataset_t, type N4LTaskView_t } from '@core/n4l/format'
import type { N4LPackage_t } from '@core/n4l/source'
import { loadN4LLayersModel } from '@core/n4l/tfjsModel'
import { prepareTabularClassification, tabularClassIndex, tabularFields } from '@core/n4l/tabularClassification'
import { N4LError } from '@core/n4l/validate'
import N4LPackageDescription from '@components/n4l/N4LPackageDescription'
import I_MODEL_TABULAR_CLASSIFICATION, { type LoadModelCallbacks_t, type TabularFormField_t } from './_model'

/**
 * Un modelo de clasificación tabular de un paquete .n4l: todo lo que antes escribía a mano cada clase (MODEL_IRIS…)
 * sale de su manifiesto (su sección de clasificación tabular) y sus textos. Cumple la misma interfaz, así que las
 * páginas no cambian
 */
export default class MODEL_N4L extends I_MODEL_TABULAR_CLASSIFICATION {
  readonly pkg : N4LPackage_t
  readonly view: N4LTaskView_t<N4LDataset_t>

  constructor(t: TFunction<'translation', undefined>, callbacks: () => void, pkg: N4LPackage_t) {
    super(t, callbacks)
    const view = n4lTableView(pkg.manifest, TASKS.TABULAR_CLASSIFICATION)
    if (view === undefined) throw new N4LError(pkg.manifest.id, ['no tiene la tarea tabular-classification'])
    this.pkg = pkg
    this.view = view
    const { section, dataset } = view
    const ns = pkg.namespace
    const texts = n4lTaskText(ns, section.task)
    const prediction = n4lTablePrediction(section)
    const examples = prediction?.examples ?? []
    this.KEY = section.key
    this.TITLE = texts + 'title'
    this.i18n_TITLE = texts + 'title'
    this.CLASSES = (section.classes ?? []).map(({ id }) => `${ns}:classes.${n4lLabelKey(id)}`)
    // Las de entrada y el objetivo, en el orden del conjunto de datos
    this.TABLE_HEADER = dataset.columns.filter(({ role }) => role === 'Feature' || role === 'Target').map(({ name }) => `${ns}:columns.${n4lLabelKey(name)}`)
    this.DATA_DEFAULT_KEYS = dataset.columns.filter(({ role }) => role === 'Feature').map(({ name }) => name)
    this.DATA_DEFAULT = prediction?.defaults ?? {}
    this.LIST_EXAMPLES = examples.map(({ values }) => values)
    this.LIST_EXAMPLES_RESULTS = examples.map(({ expected }) => expected)
    this.FORM = tabularFields(view, ns, t) as TabularFormField_t[]
  }

  N4L_PACKAGE() {
    return this.pkg
  }

  MODEL_INPUT() {
    return n4lLayersModels(this.view.section)[0]?.input ?? 'encoded'
  }

  CLASS_INDEX(target: unknown): number {
    const index = tabularClassIndex(this.view.section, target)
    return index !== -1 ? index : super.CLASS_INDEX(target)
  }

  DESCRIPTION() {
    return <N4LPackageDescription manifest={this.pkg.manifest} namespace={this.pkg.namespace} task={this.view.section.task} />
  }

  async DATASETS(): Promise<_Types.DatasetProcessed_t[]> {
    return prepareTabularClassification(this.pkg, this.view, this.FORM)
  }

  async LOAD_LAYERS_MODEL(callbacks: LoadModelCallbacks_t) {
    const [model] = n4lLayersModels(this.view.section)
    return model === undefined ? null : loadN4LLayersModel(this.pkg.source, model.path, callbacks.onProgress)
  }

  DEFAULT_LAYERS(): _Types.Layer_t[] {
    return denseLayers(this.view.section.training?.layers).map(({ class: _class, units, activation }) => ({ _class, units, activation }))
  }

  HTML_EXAMPLE() {
    const texts = n4lTaskText(this.pkg.namespace, this.view.section.task)
    return <>
      <p>
        <Trans i18nKey={texts + 'example.text'} /><br />
        <b><Trans i18nKey={texts + 'example.items'} /></b>
      </p>
    </>
  }
}
