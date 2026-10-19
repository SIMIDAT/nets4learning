import type { TFunction } from 'i18next'

import alertHelper from '@utils/alertHelper'
import type { LayerIssue_t } from '@core/nn-utils/checkLayers'
import { layerIssueText } from '@components/neural-network/layerCheckText'

/**
 * Antes de entrenar: si las capas tienen algún error (checkDenseLayers, checkImageLayers), lo dice y devuelve false;
 * si no, true. Los avisos no impiden entrenar.
 */
export async function layersAreValid(t: TFunction, issues: LayerIssue_t<unknown>[]): Promise<boolean> {
  const error = issues.find(({ severity }) => severity === 'error')
  if (error === undefined) return true
  await alertHelper.alertWarning(t('layer-check.title-error'), { footer: '', text: '', html: <>{layerIssueText(t, error)}</> })
  return false
}
