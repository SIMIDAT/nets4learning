import React from 'react'
import { createContext, useState } from 'react'
import * as dfd from 'danfojs'
import { DEFAULT_DATAFRAME_PLOT_CONFIG } from './CONSTANTS'

const DataFramePlotContext = createContext({})

export function DataFramePlotProvider ({ children }) {

  const [dataFrameLocal, setDataFrameLocal] = useState(new dfd.DataFrame())
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
