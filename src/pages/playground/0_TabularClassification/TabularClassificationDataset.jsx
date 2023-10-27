import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import DragAndDrop from '@components/dragAndDrop/DragAndDrop'

import { UPLOAD } from '@/DATA_MODEL'
import alertHelper from '@utils/alertHelper'
import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import { Link } from 'react-router-dom'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

export default function TabularClassificationDataset (props) {
  const {
    dataset,
    /** @type  I_MODEL_TABULAR_CLASSIFICATION*/
    iModelInstance,
    /*** @type DatasetProcessed_t[] */
    datasets,
    /** @type React.Dispatch<Array<DatasetProcessed_t>>*/
    setDatasets,

    /** @type React.Dispatch<number> */
    setDatasetIndex,
  } = props

  const { t } = useTranslation()
  // region Dataset
  const handleChange_FileUpload_CSV = async (files, _event) => {
    if (files.length !== 1) {
      console.error(t('error.load-json-csv'))
      return
    }
    try {
      const file_csv = new File([files[0]], files[0].name, { type: files[0].type })
      // Por un bug de referencias, el dataframe original y el procesado se comunican y no debe
      // la función dataframe.copy() no funciona correctamente
      const D_original = await dfd.readCSV(file_csv)
      const D_processed = await dfd.readCSV(file_csv)
      setDatasets((prevState) => {
        return [...prevState, {
          is_dataset_upload   : true,
          is_dataset_processed: false,
          path                : '',
          info                : '',
          csv                 : '',
          dataset_transforms  : [],
          dataframe_original  : D_original,
          dataframe_processed : D_processed,
          data_processed      : {}
        }]
      })
      setDatasetIndex((prevState) => prevState + 1)
      await alertHelper.alertSuccess(t('success.file-upload'))
    } catch (error) {
      await alertHelper.alertError(t('error.file-upload'))
      console.error(error)
    }
  }

  const handleChange_FileUpload_CSV_reject = async (_files, _event) => {
    await alertHelper.alertError(t('error.file-not-valid'))
  }
  // endregion

  if (VERBOSE) console.debug('render TabularClassificationDataset')
  return <>
    {dataset === UPLOAD && <>
      <DragAndDrop name={'csv'}
                   accept={{ 'text/csv': ['.csv'] }}
                   text={t('drag-and-drop.csv')}
                   labelFiles={t('drag-and-drop.label-files-one')}
                   function_DropAccepted={handleChange_FileUpload_CSV}
                   function_DropRejected={handleChange_FileUpload_CSV_reject} />
      {datasets.length === 0 && <>
        <WaitingPlaceholder title={'pages.playground.generator.waiting-for-file'} />

        <p className={'text-end text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-link'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/glossary/',
                                  state   : {
                                    action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS,
                                  },
                                }}
                   />
                 }}
          />
        </p>

        <p className={'text-end text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-tutorial'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/manual/',
                                  state   : {
                                    action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS,
                                  },
                                }}
                   />
                 }}
          />
        </p>
      </>}
    </>}
    {dataset !== UPLOAD && <>{iModelInstance.DESCRIPTION()}</>}
  </>
}