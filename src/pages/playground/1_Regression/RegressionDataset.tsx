import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataFrameReadCSV } from '@core/dataframe/DataFrameUtils'

import * as _Types from '@core/types'
import { useRegressionContext } from '@context/useRegressionContext'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import alertHelper from '@utils/alertHelper'
import { TASKS, UPLOAD } from '@/TASKS'
import { VERBOSE } from '@/CONSTANTS'
import type { DropEvent, FileRejection } from 'react-dropzone'
import { DATASET_ACCEPT } from '@core/dataframe/datasetFormats'
import { useProjectDatasetUpload } from '@hooks/useProjectDatasetUpload'

type RegressionDatasetProps_t = {
  dataset: string
}

export default function RegressionDataset({ dataset }: RegressionDatasetProps_t) {

  const { t } = useTranslation()
  const {
    datasets,
    setDatasets,


    iModelInstance,
  } = useRegressionContext()

  const [showDatasetInfo, setShowDatasetInfo] = useState(false)

  const handleChange_FileUpload_CSV = async (files: File[], _event: DropEvent) => {
    if (files.length < 1) {
      console.error(t('error.load-json-csv'))
      return
    }
    try {
      const file_csv = new File([files[0]], files[0].name, { type: files[0].type })
      const _dataframeOriginal = await DataFrameReadCSV(file_csv)
      const _dataframeProcessed = await DataFrameReadCSV(file_csv)

      // Sin procesar: hasta pasar por el formulario de procesamiento no hay entradas ni objetivo, ni se puede entrenar
      // (antes se marcaba como procesado con todo vacío y el botón de entrenar se activaba)
      const newDataset: _Types.DatasetProcessed_t = {
        is_dataset_upload   : true,
        is_dataset_processed: false,
        csv                 : files[0].name,
        path                : '',
        info                : '',
        container_info      : '',
        dataset             : [],
        dataframe_original  : _dataframeOriginal,
        dataframe_processed : _dataframeProcessed,
        dataset_transforms  : [],
      }
      setDatasets((prevState) => {
        return {
          ...prevState,
          data: [
            ...prevState.data,
            newDataset
          ],
          index: datasets.data.length
        }
      })
      setShowDatasetInfo(true)
      await alertHelper.alertSuccess(t('alert.file-upload-success'))
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange_FileUpload_CSV_reject = (files: FileRejection[], _event: DropEvent) => {
    if (VERBOSE) console.debug({ files })
  }

  // Desde «Entrenar» en /datasets (?dataset=wdbc): el CSV del proyecto, como si se hubiera arrastrado
  useProjectDatasetUpload(TASKS.REGRESSION, dataset === UPLOAD, (files) => handleChange_FileUpload_CSV(files, {} as DropEvent))

  if (VERBOSE) console.debug('render RegressionDataset')
  return <>
    {dataset === UPLOAD && <>
      <DragAndDrop
        id={'drop-zone-regression-dataset'}
        name={'csv'}
        accept={DATASET_ACCEPT}
        text={t('drag-and-drop.dataset')}
        labelFiles={t('drag-and-drop.label-files-one')}
        function_DropAccepted={handleChange_FileUpload_CSV}
        function_DropRejected={handleChange_FileUpload_CSV_reject} />

      {!showDatasetInfo && <>
        <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-file'} />
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
    {dataset !== UPLOAD && <>{iModelInstance?.DESCRIPTION()}</>}
  </>
}
