import { createContext, useState } from "react"
import { DataFrame } from "danfojs"

import { DEFAULT_DATAFRAME_PLOT_CONFIG } from "./CONSTANTS"
import type { DataframePlotConfig_t } from "@core/types"

/**
 * @typedef DataFramePlotContext_t
 *
 * @property {DataFrame} dataFrameLocal
 * @property {React.Dispatch<React.SetStateAction<DataFrame>>} setDataFrameLocal
 * @property {DataframePlotConfig_t} dataframePlotConfig
 * @property {React.Dispatch<React.SetStateAction<DataframePlotConfig_t>>} setDataframePlotConfig
 * @property {boolean} showDescription
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowDescription
 * @property {boolean} showOptions
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowOptions
 */
type DataFramePlotContext_t = {
  dataFrameLocal        : DataFrame
  setDataFrameLocal     : React.Dispatch<React.SetStateAction<DataFrame>>
  dataframePlotConfig   : DataframePlotConfig_t
  setDataframePlotConfig: React.Dispatch<React.SetStateAction<DataframePlotConfig_t>>
  showDescription       : boolean
  setShowDescription    : React.Dispatch<React.SetStateAction<boolean>>
  showOptions           : boolean
  setShowOptions        : React.Dispatch<React.SetStateAction<boolean>>
}

/** @type {import('react').Context<DataFramePlotContext_t>} */
// TypeScript change antes {} en vez de null
const DataFramePlotContext = createContext(null as unknown as DataFramePlotContext_t)

export function DataFramePlotProvider({ children }: { children: React.ReactNode }) {
  const [dataFrameLocal, setDataFrameLocal] = useState(new DataFrame())
  const [dataframePlotConfig, setDataframePlotConfig] = useState(DEFAULT_DATAFRAME_PLOT_CONFIG)
  const [showDescription, setShowDescription] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  return (
    <DataFramePlotContext.Provider
      value={{
        dataFrameLocal,
        setDataFrameLocal,

        dataframePlotConfig,
        setDataframePlotConfig,

        showDescription,
        setShowDescription,

        showOptions,
        setShowOptions,
      }}
    >
      {children}
    </DataFramePlotContext.Provider>
  )
}

export default DataFramePlotContext
