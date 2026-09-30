import * as tfjs from '@tensorflow/tfjs'


export const parseLogs = (logs: Array<number | string | tfjs.Tensor>) => {
  if (logs instanceof tfjs.Tensor) {
    return logs.dataSync()[logs.size - 1].toFixed(2)
  } 
  if (logs.length === 0) {
    return '0.00'
  }

  const last = logs[logs.length - 1]
  const value = typeof last === 'number' ? last : parseFloat(last.toString())

  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}
