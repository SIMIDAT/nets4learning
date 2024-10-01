import * as _Types from '@core/types'

/**
 * 
 * @param {_Types.DatasetColumn_t} v 
 * @returns 
 */
export function F_MAP_LabelEncoder (v) {
  /** @type {_Types.ColumnTransform_t} */ 
  const label = 'label-encoder'
  return { 
    ...v, 
    column_transform: label
  } 
}
/**
 * 
 * @param {_Types.DatasetColumn_t} value
 * @param {number} [_index]
 * @param {_Types.DatasetColumn_t[]} [_array]
 * @returns 
 */
export function F_FILTER_Categorical (value, _index, _array) {
  // /** @type {_Types.ColumnTransform_t} */ 
  // console.log(array.map(v=> (v.column_name)).includes(value.column_name))
  // if (!array.map(v=> (v.column_name)).includes(value.column_name)) {
  //   console.error({array})
  // }
  return value.column_type === 'Categorical' || value.column_type === 'Binary'
}


export function shuffleArray(array) {
  let currentIndex = array.length
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }
}