export const PLOTLY_CONFIG_DEFAULT = {
  STYLES: {
    width : '100%',
    height: '100'
  },
  LAYOUT: {
    responsive      : true,
    useResizeHandler: true,
    autoSize        : true,
    height          : undefined,
    width           : undefined
  }
}
export const CHARTJS_CONFIG_DEFAULT = {
  BACKGROUND_COLOR: [
    'rgba(255, 99, 132, 0.4)',
    'rgba(255, 159, 64, 0.4)',
    'rgba(255, 205, 86, 0.4)',
    'rgba(75, 192, 192, 0.4)',
    'rgba(54, 162, 235, 0.4)',
    'rgba(153, 102, 255, 0.4)',
    'rgba(175, 175, 175, 0.4)',
  ],
  BORDER_COLOR: [
    'rgb(255, 99, 132)',
    'rgb(255, 159, 64)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(54, 162, 235)',
    'rgb(153, 102, 255)',
    'rgb(175, 175, 175)',
  ],
  REGRESSION_PREDICTION: {
    elements: {
      point: {
        pointStyle : 'circle',
        borderWidth: 2,
        radius     : 3,
        hoverRadius: 8
      }
    }
  }
}
