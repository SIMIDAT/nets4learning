import DataFrameCard from '@components/dataframe/DataFrameCard'
import PreProcessDataFrame from './PreProcessDataFrame'
import type { PreProcessDataFrameProps_t } from './PreProcessDataFrame'

/**
 * @typedef PreProcessDataFrameProps_t
 * @type {import('./PreProcessDataFrame').PreProcessDataFrameProps_t}
 */


/** 
 * @typedef PreProcessDataFrameCardProps_t
 * @property {boolean} isDataFrameUpload
 */
type PreProcessDataFrameCardProps_t = {
  isDataFrameUpload: boolean
}

/**
 * 
 * @param {PreProcessDataFrameProps_t & PreProcessDataFrameCardProps_t} props 
 * @returns 
 */
type Props = PreProcessDataFrameProps_t & PreProcessDataFrameCardProps_t
export default function PreProcessDataFrameCard(props: Props) {
  const {
    dataFrameOriginal,
    setDataFrameOriginal,
    dataFrameProcessed,
    setDataFrameProcessed,
    isDataFrameProcessed,
    setIsDataFrameProcessed,
    isDataFrameUpload
  } = props

  return (
    <DataFrameCard title={'dataframe-form'} ready={isDataFrameUpload}>
      <PreProcessDataFrame
        dataFrameOriginal={dataFrameOriginal}
        setDataFrameOriginal={setDataFrameOriginal}
        dataFrameProcessed={dataFrameProcessed}
        setDataFrameProcessed={setDataFrameProcessed}
        isDataFrameProcessed={isDataFrameProcessed}
        setIsDataFrameProcessed={setIsDataFrameProcessed} />
    </DataFrameCard>
  )
}
