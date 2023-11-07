import React, { useContext } from 'react'
import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import LinearRegressionContext from '@context/LinearRegressionContext'
import alertHelper from '@utils/alertHelper'
import { UPLOAD } from '@/DATA_MODEL'

import LinearRegressionDatasetForm from './LinearRegressionDatasetForm'
import { VERBOSE } from '@/CONSTANTS'

export default function LinearRegressionDataset ({ dataset }) {

  const { t } = useTranslation()
  const {
    setDatasets,
    datasetLocal,
    iModelInstance,
  } = useContext(LinearRegressionContext)

  const handleChange_FileUpload_CSV = async (files, _event) => {
    if (files.length < 1) {
      console.error(t('error.load-json-csv'))
      return
    }
    try {
      const file_csv = new File([files[0]], files[0].name, { type: files[0].type })
      dfd.readCSV(file_csv).then((_dataframe) => {
        setDatasets((prevState) => ([...prevState,
            {
              is_dataset_upload   : true,
              is_dataset_processed: false,
              csv                 : files[0].name,
              info                : '',
              path                : '',
              dataframe_original  : _dataframe,
              dataframe_processed : _dataframe,
              dataframe_transforms: []
            }]
        ))
      })
      await alertHelper.alertSuccess(t('alert.file-upload-success'))
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange_FileUpload_CSV_reject = (files, _event) => {
    if (VERBOSE) console.debug({ files })
  }

  const handleSubmit_ProcessDataset = (_event) => {

  }

  if (VERBOSE) console.debug('render LinearRegressionDataset')
  return <>
    {dataset === UPLOAD && <>
      <DragAndDrop name={'csv'}
                   accept={{ 'text/csv': ['.csv'] }}
                   text={t('drag-and-drop.csv')}
                   labelFiles={t('drag-and-drop.label-files-one')}
                   function_DropAccepted={handleChange_FileUpload_CSV}
                   function_DropRejected={handleChange_FileUpload_CSV_reject} />

      {datasetLocal.dataframe_original && <>
        <Form onSubmit={handleSubmit_ProcessDataset}>
          <LinearRegressionDatasetForm />
        </Form>
      </>}
      {!datasetLocal.dataframe_original && <>
        <p className="placeholder-glow">
          <small className={'text-muted'}>{t('pages.playground.generator.waiting-for-file')}</small>
          <span className="placeholder col-12"></span>
        </p>
      </>}
    </>}
    {dataset !== UPLOAD && <>{iModelInstance.DESCRIPTION()}</>}
  </>
}
