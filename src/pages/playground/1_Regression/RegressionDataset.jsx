import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import RegressionContext from '@/context/RegressionContext'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import alertHelper from '@utils/alertHelper'
import { UPLOAD } from '@/DATA_MODEL'
import { VERBOSE } from '@/CONSTANTS'

export default function RegressionDataset({ dataset }) {

  const { t } = useTranslation()
  const {
    datasets,
    setDatasets,

    // datasetLocal,
    // setDatasetLocal,

    iModelInstance,
  } = useContext(RegressionContext)

  const [showDatasetInfo, setShowDatasetInfo] = useState(false)

  const handleChange_FileUpload_CSV = async (files, _event) => {
    if (files.length < 1) {
      console.error(t('error.load-json-csv'))
      return
    }
    try {
      const file_csv = new File([files[0]], files[0].name, { type: files[0].type })
      const _dataframeOriginal = await dfd.readCSV(file_csv)
      const _dataframeProcessed = await dfd.readCSV(file_csv)
      
      /**@type {_Types.DatasetProcessed_t} */
      const newDataset = {
        is_dataset_upload   : true,
        is_dataset_processed: true,
        csv                 : files[0].name,
        path                : '',
        info                : '',
        container_info      : '',
        dataset             : [/* TODO */],
        dataframe_original  : _dataframeOriginal,
        dataframe_processed : _dataframeProcessed,
        dataset_transforms  : [],
        data_processed      : {
          /* TODO */
          encoders          : {},
          column_name_target: '',
          scaler            : new dfd.MinMaxScaler(),
          dataframe_X       : new dfd.DataFrame(),
          dataframe_y       : new dfd.DataFrame(),
          X                 : new dfd.DataFrame(),
          y                 : new dfd.DataFrame(),
        }
      }
      setDatasets((prevState) => {
        return {
          data: [
            ...prevState.data, 
            newDataset
          ],
          index: datasets.data.length
        }
      })
      // setIndexDatasetSelected(datasets.length)
      // setDatasetLocal((prevState) => ({
      //   ...prevState,
      //   is_dataset_upload   : true,
      //   is_dataset_processed: false,
      //   dataframe_original  : _dataframeOriginal,
      //   dataframe_processed : _dataframeProcessed,
      //   container_info      : '',
      //   csv                 : files[0].name,
      // }))
      setShowDatasetInfo(true)
      await alertHelper.alertSuccess(t('alert.file-upload-success'))
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange_FileUpload_CSV_reject = (files, _event) => {
    if (VERBOSE) console.debug({ files })
  }

  if (VERBOSE) console.debug('render RegressionDataset')
  return <>
    {dataset === UPLOAD && <>
      <DragAndDrop id={'drop-zone-regression-dataset'}
                   name={'csv'}
                   accept={{ 'text/csv': ['.csv'] }}
                   text={t('drag-and-drop.csv')}
                   labelFiles={t('drag-and-drop.label-files-one')}
                   function_DropAccepted={handleChange_FileUpload_CSV}
                   function_DropRejected={handleChange_FileUpload_CSV_reject} />

      {!showDatasetInfo && <>
        <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-file'} />
      </>}
      {showDatasetInfo && <>
        <ol>
          {datasets.data.map((dataset, index) => {
            return <li key={index}>{dataset.csv}</li>
          })}
        </ol>
        <p><strong>{datasets.data[datasets.index].csv}</strong></p>
      </>}
    </>}
    {dataset !== UPLOAD && <>{iModelInstance.DESCRIPTION()}</>}
  </>
}
