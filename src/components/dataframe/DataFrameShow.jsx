import { useEffect, useId } from 'react'

import { TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 } from '@/CONSTANTS_DanfoJS'

export default function DataFrameShow({ dataframe }) {

    const dataframeID = useId()

    useEffect(() => {
        dataframe
            .plot(dataframeID)
            .table({ config: TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 })
    }, [dataframe, dataframeID])

    return <>
        <div id={dataframeID}></div>
    </>
}