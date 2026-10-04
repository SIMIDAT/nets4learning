import type { DropEvent, FileRejection } from 'react-dropzone'
import { Trans, useTranslation } from 'react-i18next'
import { DataFrameReadCSV } from '@core/dataframe/DataFrameUtils'

import alertHelper from '@utils/alertHelper'
import * as _Types from '@core/types'
import { TASKS, UPLOAD } from '@/TASKS'
import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'
import { DATASET_ACCEPT } from '@core/dataframe/datasetFormats'
import { useProjectDatasetUpload } from '@hooks/useProjectDatasetUpload'

type PropsTabularClassificationDatasetProps_t = {
  dataset: string
}

/**
 *
 * @param {PropsTabularClassificationDatasetProps_t} props
 * @returns
 */
export default function TabularClassificationDataset(props: PropsTabularClassificationDatasetProps_t) {
    const { dataset } = props
  const { datasets: datasetsState, setDatasets, iModelInstance } = useTabularClassificationContext()
  const datasets = datasetsState.datasets

  const { t } = useTranslation()
  // region Dataset
  const handleChange_FileUpload_CSV = async (files: File[], _event: DropEvent) => {
    if (files.length !== 1) {
      console.error(t('error.load-json-csv'))
      return
    }
    try {
      const file_csv = new File([files[0]], files[0].name, { type: files[0].type })
      // Por un bug de referencias, el dataframe original y el procesado se comunican y no debe
      // la función dataframe.copy() no funciona correctamente
      const D_original = await DataFrameReadCSV(file_csv)
      const D_processed = await DataFrameReadCSV(file_csv)
      const newDataset: _Types.DatasetProcessed_t = {
        is_dataset_upload   : true,
        is_dataset_processed: false,
        path                : '',
        info                : '',
        csv                 : '',
        container_info      : '',
        dataset_transforms  : [],
        dataframe_original  : D_original,
        dataframe_processed : D_processed,
        // data_processed: {},
        dataset             : [],
      }
      setDatasets((prevState) => {
        return {
          index   : prevState.index,
          datasets: [
            ...prevState.datasets, 
            newDataset
          ]
        }
      })
      await alertHelper.alertSuccess(t('success.file-upload'))
    } catch (error) {
      await alertHelper.alertError(t('error.file-upload'))
      console.error(error)
    }
  }

  const handleChange_FileUpload_CSV_reject = async (_files: FileRejection[], _event: DropEvent) => {
    await alertHelper.alertError(t('error.file-not-valid'))
  }
  // Desde «Entrenar» en /datasets (?dataset=wine): el CSV del proyecto, como si se hubiera arrastrado
  useProjectDatasetUpload(TASKS.TABULAR_CLASSIFICATION, dataset === UPLOAD, (files) => handleChange_FileUpload_CSV(files, {} as DropEvent))
  // endregion

  if (VERBOSE) console.debug('render TabularClassificationDataset')
  return (
    <>
      {dataset === UPLOAD && (
        <>
          <DragAndDrop
            id="drag-zone-tabular-classification"
            name={'csv'}
            accept={DATASET_ACCEPT}
            text={t('drag-and-drop.dataset')}
            labelFiles={t('drag-and-drop.label-files-one')}
            function_DropAccepted={handleChange_FileUpload_CSV}
            function_DropRejected={handleChange_FileUpload_CSV_reject}
          />
          {datasets.length === 0 && (
            <>
              <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-file'} />

              <p className={'text-end text-muted mb-0 pb-0'}>
                <Trans
                  i18nKey={'more-information-in-link'}
                  components={{
                    link1: (
                      <N4LHelpLink page={'glossary'} action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS} />
                    ),
                  }}
                />
              </p>

              <p className={'text-end text-muted mb-0 pb-0'}>
                <Trans
                  i18nKey={'more-information-in-tutorial'}
                  components={{
                    link1: (
                      <N4LHelpLink page={'manual'} action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS} />
                    ),
                  }}
                />
              </p>
            </>
          )}
        </>
      )}
      {dataset !== UPLOAD && <>{iModelInstance?.DESCRIPTION()}</>}
    </>
  )
}
