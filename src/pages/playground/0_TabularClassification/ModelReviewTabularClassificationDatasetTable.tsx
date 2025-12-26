import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Card } from 'react-bootstrap'

import N4LTablePagination from '@components/table/N4LTablePagination'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import { VERBOSE } from '@/CONSTANTS'

type ModelReviewTabularClassificationDatasetTableProps = {
  iModelInstance: any
}

export default function ModelReviewTabularClassificationDatasetTable (props: ModelReviewTabularClassificationDatasetTableProps) {

  const { iModelInstance } = props
  const { t } = useTranslation()

  const [tableHead, setTableHead] = useState<string[]>([])
  const [tableBody, setTableBody] = useState<any[][]>([])

  useEffect(() => {
    const init = async () => {
      if (!iModelInstance) return
      const datasets = await iModelInstance.DATASETS()
      if (datasets.length === 0) return
      setTableHead(iModelInstance.TABLE_HEADER)
      setTableBody(DataFrameUtils.DataFrameIterRows(datasets[0].dataframe_original))
    }
    init().then((_r) => {
      if (VERBOSE) console.debug('init ModelReviewTabularClassificationDatasetTable')
    })
  }, [iModelInstance])

  if (VERBOSE) console.debug('render ModelReviewTabularClassificationDatasetTable')
  return <>
    <Card className={'mt-3'}>
      <Card.Header>
        <h3><Trans i18nKey={'table.dataset'} /></h3>
      </Card.Header>
      <Card.Body className={'overflow-x-scroll'}>
        {/* i18n key */}
        <N4LTablePagination
          data_head={tableHead.map(v => t(v))}
          data_body={tableBody} 
        />
      </Card.Body>
    </Card>
  </>
}