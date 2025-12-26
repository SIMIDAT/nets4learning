import { Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import PreProcessDataFrame from './PreProcessDataFrame'
import WaitingPlaceholder from '../loading/WaitingPlaceholder'
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

  return <>
    <Card className={'mt-3'}>
      <Card.Header>
        <h3><Trans i18nKey={'dataframe-form'} /></h3>
      </Card.Header>
      <Card.Body>
        {!isDataFrameUpload && <>
          <WaitingPlaceholder i18nKey_title={'Waiting'} />
        </>}
        {isDataFrameUpload && <>
          <PreProcessDataFrame
            dataFrameOriginal={dataFrameOriginal}
            setDataFrameOriginal={setDataFrameOriginal}
            dataFrameProcessed={dataFrameProcessed}
            setDataFrameProcessed={setDataFrameProcessed}
            isDataFrameProcessed={isDataFrameProcessed}
            setIsDataFrameProcessed={setIsDataFrameProcessed} />
        </>}
      </Card.Body>
    </Card>
  </>
}