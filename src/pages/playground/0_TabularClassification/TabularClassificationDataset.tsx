import type { DropEvent, FileRejection } from "react-dropzone"
import { Trans, useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import * as dfd from "danfojs"

import alertHelper from "@utils/alertHelper"
import * as _Types from "@core/types"
import { UPLOAD } from "@/DATA_MODEL"
import { VERBOSE } from "@/CONSTANTS"
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from "@/CONSTANTS_ACTIONS"
import WaitingPlaceholder from "@components/loading/WaitingPlaceholder"
import DragAndDrop from "@components/dragAndDrop/DragAndDrop"
import type { I_MODEL_TABULAR_CLASSIFICATION } from "./models"

/**
 * @typedef {object} PropsTabularClassificationDatasetProps_t
 * @property {string} dataset
 * @property {_Types.I_MODEL_TABULAR_CLASSIFICATION_t} iModelInstance
 * @property {_Types.DatasetProcessed_t[]} datasets
 * @property {React.Dispatch<React.SetStateAction<_Types.DatasetProcessed_t[]>>} setDatasets
 * @property {number} datasetIndex
 * @property {React.Dispatch<React.SetStateAction<number>>} setDatasetIndex
 */
type PropsTabularClassificationDatasetProps_t = {
  dataset       : string
  iModelInstance: React.RefObject<I_MODEL_TABULAR_CLASSIFICATION | null>
  datasets      : _Types.DatasetProcessed_t[]
  setDatasets   : React.Dispatch<React.SetStateAction<{ index: number, datasets: _Types.DatasetProcessed_t[] }>>
}

/**
 *
 * @param {PropsTabularClassificationDatasetProps_t} props
 * @returns
 */
export default function TabularClassificationDataset(props: PropsTabularClassificationDatasetProps_t) {
  const { dataset, iModelInstance, datasets, setDatasets } = props

  const { t } = useTranslation()
  // region Dataset
  const handleChange_FileUpload_CSV = async (files: File[], _event: DropEvent) => {
    if (files.length !== 1) {
      console.error(t("error.load-json-csv"))
      return
    }
    try {
      const file_csv = new File([files[0]], files[0].name, { type: files[0].type })
      // Por un bug de referencias, el dataframe original y el procesado se comunican y no debe
      // la función dataframe.copy() no funciona correctamente
      const D_original = await dfd.readCSV(file_csv)
      const D_processed = await dfd.readCSV(file_csv)
      /**@type {_Types.DatasetProcessed_t} */
      const newDataset: _Types.DatasetProcessed_t = {
        is_dataset_upload   : true,
        is_dataset_processed: false,
        path                : "",
        info                : "",
        csv                 : "",
        container_info      : "",
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
      await alertHelper.alertSuccess(t("success.file-upload"))
    } catch (error) {
      await alertHelper.alertError(t("error.file-upload"))
      console.error(error)
    }
  }

  const handleChange_FileUpload_CSV_reject = async (_files: FileRejection[], _event: DropEvent) => {
    await alertHelper.alertError(t("error.file-not-valid"))
  }
  // endregion

  if (VERBOSE) console.debug("render TabularClassificationDataset")
  return (
    <>
      {dataset === UPLOAD && (
        <>
          <DragAndDrop
            id="drag-zone-tabular-classification"
            name={"csv"}
            accept={{ "text/csv": [".csv"] }}
            text={t("drag-and-drop.csv")}
            labelFiles={t("drag-and-drop.label-files-one")}
            function_DropAccepted={handleChange_FileUpload_CSV}
            function_DropRejected={handleChange_FileUpload_CSV_reject}
          />
          {datasets.length === 0 && (
            <>
              <WaitingPlaceholder i18nKey_title={"pages.playground.generator.waiting-for-file"} />

              <p className={"text-end text-muted mb-0 pb-0"}>
                <Trans
                  i18nKey={"more-information-in-link"}
                  components={{
                    link1: (
                      <Link
                        className={"text-info"}
                        state={{
                          action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS,
                        }}
                        to={{
                          pathname: "/glossary/",
                        }}
                      />
                    ),
                  }}
                />
              </p>

              <p className={"text-end text-muted mb-0 pb-0"}>
                <Trans
                  i18nKey={"more-information-in-tutorial"}
                  components={{
                    link1: (
                      <Link
                        className={"text-info"}
                        state={{
                          action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS,
                        }}
                        to={{
                          pathname: "/manual/",
                        }}
                      />
                    ),
                  }}
                />
              </p>
            </>
          )}
        </>
      )}
      {dataset !== UPLOAD && <>{iModelInstance.current?.DESCRIPTION()}</>}
    </>
  )
}
