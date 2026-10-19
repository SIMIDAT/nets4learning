import type { TFunction } from 'i18next'

import type { LayerIssue_t } from '@core/nn-utils/checkLayers'
import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'

// Los textos de lo que está mal en las capas (N4LLayerCheck y la alerta que impide entrenar)

export const LAYER_CHECK_PREFIX = 'layer-check.'
const prefix = LAYER_CHECK_PREFIX

/** Los números del texto: la capa desde 1, el nombre del parámetro y el de las activaciones como en el selector */
export function issueValues(t: TFunction, { layer, values }: Pick<LayerIssue_t<unknown>, 'layer' | 'values'>) {
  const activation = (key: unknown) => TYPE_ACTIVATION.find((option) => option.key === key)?.label ?? String(key)
  return {
    ...values,
    layer: layer + 1,
    ...(values.param !== undefined) && { param: t(prefix + 'params.' + values.param) },
    ...(values.activation !== undefined) && { activation: activation(values.activation) },
    ...(values.expected !== undefined) && { expected: activation(values.expected) },
  }
}

/** Lo que dice el aviso de un problema (también en la alerta que impide entrenar) */
export function layerIssueText(t: TFunction, issue: Pick<LayerIssue_t<unknown>, 'kind' | 'layer' | 'values'>) {
  return t(prefix + issue.kind + '.text', issueValues(t, issue))
}

/** Qué capas tienen algo, para marcarlas en el editor (si una tiene un error y un aviso, el error) */
export function flaggedLayers(issues: LayerIssue_t<unknown>[]): Partial<Record<number, 'error' | 'warning'>> {
  const flagged: Partial<Record<number, 'error' | 'warning'>> = {}
  for (const { layer, severity } of issues) if (flagged[layer] !== 'error') flagged[layer] = severity
  return flagged
}
