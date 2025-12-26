export const error_tensor_shape_regex = /target expected a batch of elements where each example has shape \[(?<shape>\d+)\] \(i.e.,tensor shape \[(?<tensor_shape_0>.+),(?<tensor_shape_1>.+)\]\) but the target received an input with (?<size>\d+) examples, each with shape \[(?<target_shape>\d+)\] \(tensor shape \[(?<target_tensor_shape_0>\d+),(?<target_tensor_shape_1>\d+)\]\)/


/**
 *
 * @param {string} message
 * @return {*}
 */
export function isErrorTargetExpected (message: string) {
  return message.includes('target expected a batch of elements')
}

/**
 *
 * @param message
 * @return {ErrorTensorShape_match_groups_t}
 */
export function matchErrorTargetExpected (message: string) {
  const match = message.match(error_tensor_shape_regex) !
  return match.groups
}