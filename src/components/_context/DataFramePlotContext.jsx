import React from 'react'
import { createContext, useState } from 'react'
import { DataFrame } from 'danfojs'
import { DEFAULT_DATAFRAME_PLOT_CONFIG } from './CONSTANTS'

/**
 * @typedef DataFramePlotContext_t
 * 
 * @property {DataFrame} dataFrameLocal
 * @property {React.Dispatch<React.SetStateAction<DataFrame>>} setDataFrameLocal
 * 
 * @property {DataframePlotConfig_t} dataframePlotConfig
 * @property {React.Dispatch<React.SetStateAction<DataframePlotConfig_t>>} setDataframePlotConfig
 *
 * @property {boolean} showDescription
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowDescription
 *
 * @property {boolean} showOptions
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowOptions
 */

/** @type {import('react').Context<DataFramePlotContext_t>} */
const DataFramePlotContext = createContext({})

export function DataFramePlotProvider({ children }) {

  const [dataFrameLocal, setDataFrameLocal] = useState(new DataFrame())
  const [dataframePlotConfig, setDataframePlotConfig] = useState(DEFAULT_DATAFRAME_PLOT_CONFIG)
  const [showDescription, setShowDescription] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  return (<DataFramePlotContext.Provider value={{
    dataFrameLocal,
    setDataFrameLocal,

    dataframePlotConfig,
    setDataframePlotConfig,

    showDescription,
    setShowDescription,

    showOptions,
    setShowOptions,
  }}>
    {children}
  </DataFramePlotContext.Provider>)
}

export default DataFramePlotContext
