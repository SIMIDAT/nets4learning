/**
 *
 * @param {CustomModel_t} tmpModel
 * @return {CustomModel_t}
 */
export function cloneTmpModel (tmpModel) {
  return {
    ...tmpModel,
    original : tmpModel.original.slice(0, tmpModel.original.length),
    predicted: tmpModel.predicted.slice(0, tmpModel.predicted.length),
  }
}