// import the core library.
import ReactEChartsCore from 'echarts-for-react/lib/core'
import type { ComponentType } from 'react'
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core'
import type { EChartsReactProps } from 'echarts-for-react'
// Import charts, all with Chart suffix
import {
  // LineChart,
  BarChart,
  // PieChart,
  // ScatterChart,
  // RadarChart,
  // MapChart,
  // TreeChart,
  // TreemapChart,
  // GraphChart,
  // GaugeChart,
  // FunnelChart,
  // ParallelChart,
  // SankeyChart,
  // BoxplotChart,
  // CandlestickChart,
  // EffectScatterChart,
  // LinesChart,
  // HeatmapChart,
  // PictorialBarChart,
  // ThemeRiverChart,
  // SunburstChart,
  // CustomChart,
} from 'echarts/charts'
// import components, all suffixed with Component
import {
  // GridSimpleComponent,
  GridComponent,
  // PolarComponent,
  // RadarComponent,
  // GeoComponent,
  // SingleAxisComponent,
  // ParallelComponent,
  // CalendarComponent,
  // GraphicComponent,
  // ToolboxComponent,
  TooltipComponent,
  // AxisPointerComponent,
  // BrushComponent,
  TitleComponent,
  // TimelineComponent,
  // MarkPointComponent,
  // MarkLineComponent,
  // MarkAreaComponent,
  // LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
  // DataZoomComponent,
  // DataZoomInsideComponent,
  // DataZoomSliderComponent,
  // VisualMapComponent,
  // VisualMapContinuousComponent,
  // VisualMapPiecewiseComponent,
  // AriaComponent,
  // TransformComponent,
  DatasetComponent,
} from 'echarts/components'
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import {
  CanvasRenderer,
  // SVGRenderer,
} from 'echarts/renderers'

// Register the required components
echarts.use([
  BarChart,

  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,

  CanvasRenderer,
])

echarts.registerTheme('n4l_theme', {
  backgroundColor: '#f4cccc'
})

/**
 * @typedef {import('echarts-for-react').EChartsReactProps} EChartsReactProps
 *
 * @param {EChartsReactProps} props 
 * @returns 
 */
export default function N4LEcharts(props: EChartsReactProps) {

  const {
    option,
    theme = 'n4l_theme',
    lazyUpdate = true,
    notMerge = true,
    onChartReady = (instance) => {
      console.debug(instance)
    },
    onEvents = {},
    opts = {
      renderer: 'svg'
    },
  } = props

  const ReactEChartsComponent = ReactEChartsCore as unknown as ComponentType<EChartsReactProps>

  return <>
    <ReactEChartsComponent
      theme={theme}
      echarts={echarts}
      option={option}
      notMerge={notMerge}
      lazyUpdate={lazyUpdate}
      onChartReady={onChartReady}
      onEvents={onEvents}
      opts={opts}
    />
  </>
}