import type { ClassLayer_t } from '@core/types';
import type { ChartOptions } from 'chart.js'

/** Una capa de la red de imágenes (conv2d, maxPooling2d, flatten o dense), como la edita su editor de capas */
export type ImageLayer_t = {
  _class            : ClassLayer_t;
  _protected?       : boolean;
  // Solo en las capas que las usan (dense y conv2d)
  activation?       : string | null;
  units?            : number;
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