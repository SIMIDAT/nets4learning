// @formatter:off
export const E_PLOTS = {
  BAR_CHARTS       : 'bar-charts',        // TODO
  BOX_PLOTS        : 'box-plots',
  HISTOGRAMS       : 'histograms',
  LINE_CHARTS      : 'line-charts',
  PIE_CHARTS       : 'pie-charts',
  SCATTER_PLOTS    : 'scatter-plots',
  TIME_SERIES_PLOTS: 'time-series-plots', // TODO
  VIOLIN_PLOTS     : 'violin-plots',
}

export const LIST_PLOTS = Object.entries(E_PLOTS).map(([_key, value]) => value)
/**
 *
 * @typedef DataframePlotConfig_t
 * @property {string} PLOT_ENABLE
 * @property {string[]} LIST_OF_AVAILABLE_PLOTS
 * @property {{y_axis: string, x_axis: string, title: string}} LAYOUT,
 * @property {string[]} COLUMNS
 *
 * @property {any} BAR_CHARTS
 * @property {any} BOX_PLOTS
 * @property {any} HISTOGRAMS
 * @property {any} LINE_CHARTS
 * @property {{config: {labels: string}}} PIE_CHARTS
 * @property {any} SCATTER_PLOTS
 * @property {{config: {index: string}}} TIME_SERIES_PLOTS
 * @property {any} VIOLIN_PLOTS
 * @property {{config: {x: string, y: string}}} _DEFAULT_
 */

/**
 *
 * @type {DataframePlotConfig_t}
 */
export const DEFAULT_DATAFRAME_PLOT_CONFIG = {
  PLOT_ENABLE            : E_PLOTS.BOX_PLOTS,
  LIST_OF_AVAILABLE_PLOTS: [],
  LAYOUT                 : { title: '', x_axis: '', y_axis: '' },
  COLUMNS                : [],
  BAR_CHARTS             : {},
  BOX_PLOTS              : {},
  HISTOGRAMS             : {},
  LINE_CHARTS            : {},
  PIE_CHARTS             : { config: { labels: '' } },
  SCATTER_PLOTS          : {},
  TIME_SERIES_PLOTS      : { config: { index: '' } },
  VIOLIN_PLOTS           : {},
  _DEFAULT_              : { config: { x: '', y: '' } }
}
// @formatter:on