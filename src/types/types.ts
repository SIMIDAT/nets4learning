import type { ClassLayer_t } from '@core/types';
import type { ChartOptions } from 'chart.js'

/**
 * @typedef {Object} Layer_t
 * @property {string} _class // MaxPooling2D or Conv2D
 * // if _class === Conv2D
 * @property {number} kernelSize
 * @property {number} filters
 * @property {number} strides
 * @property {string} activation
 *
 * @property {string} kernelInitializer
 * @property {number} poolSize
 * @property {number} strides
 */
export type Layer_t = {
  _class            : ClassLayer_t;
  _protected?       : boolean;
  // Dense layer properties
  activation        : string | null;
  units             : number;
  // if _class === Conv2D
  kernelSize?       : number;
  inputShape?       : number[];
  filters?          : number;
  strides?          : number;
  kernelInitializer?: string;
  poolSize?         : number;
}

export type BasicLayer_t = {
  units     : number,
  activation: string,
}


/**
 * @typedef {import('react-chartjs-2/dist/types').TypedChartComponent<"bar">} BarOptions_t
*/
export type BarOptions_t = ChartOptions<'bar'>;