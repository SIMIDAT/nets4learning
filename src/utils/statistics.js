/**
 *
 * @param {dfd.DataFrame} dataframe
 * @param {string} column_name_x
 * @param {string} column_name_y
 * @return {number}
 */
export function pearsonCorrelation (dataframe, column_name_x, column_name_y) {
  let si = []
  for (let key in dataframe[column_name_x].values) {
    si.push(key)
  }

  let n = si.length

  if (n === 0) return 0

  let sum1 = 0
  for (let i = 0; i < si.length; i++) sum1 += dataframe[column_name_x].values[si[i]]

  let sum2 = 0
  for (let i = 0; i < si.length; i++) sum2 += dataframe[column_name_y].values[si[i]]

  let sum1Sq = 0
  for (let i = 0; i < si.length; i++) {
    sum1Sq += Math.pow(dataframe[column_name_x].values[si[i]], 2)
  }

  let sum2Sq = 0
  for (let i = 0; i < si.length; i++) {
    sum2Sq += Math.pow(dataframe[column_name_y].values[si[i]], 2)
  }

  let pSum = 0
  for (let i = 0; i < si.length; i++) {
    pSum += dataframe[column_name_x].values[si[i]] * dataframe[column_name_y].values[si[i]]
  }

  let num = pSum - (sum1 * sum2 / n)
  let den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) * (sum2Sq - Math.pow(sum2, 2) / n))

  if (den === 0) return 0

  return num / den
}