export const TABLE_PLOT_STYLE_HEADER_STYLE = {
  align      : 'center',
  fill       : { color: ['gray'] },
  font       : { family: 'Arial', size: 15, color: 'white' },
  columnwidth: 200,
}
export const TABLE_PLOT_STYLE_CELL_STYLE = {
  align: ['center'],
  line : { color: 'black', width: 1 },
}

export const TABLE_PLOT_STYLE_CONFIG = {
  tableHeaderStyle: TABLE_PLOT_STYLE_HEADER_STYLE,
  tableCellStyle  : TABLE_PLOT_STYLE_CELL_STYLE,
}

export const TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_1 = {
  ...TABLE_PLOT_STYLE_CONFIG,
  tableHeaderStyle: {
    ...TABLE_PLOT_STYLE_CONFIG.tableHeaderStyle,
    fill: { color: ['rgb(48,13,159)'] },
    font: { family: 'Arial', size: 15, color: 'white' },
  }
}

export const TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 = {
  ...TABLE_PLOT_STYLE_CONFIG,
  tableHeaderStyle: {
    ...TABLE_PLOT_STYLE_CONFIG.tableHeaderStyle,
    fill: { color: ['rgb(72,0,105)'] },
    font: { family: 'Arial', size: 15, color: 'white' },
  }
}

export const CONFIG_DANFOJS_FRAME = {
  frameConfig: {
    config: {
      tableMaxColInConsole: 20,
      tableMaxRow         : 40
    }
  }
}