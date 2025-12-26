import { Card } from "react-bootstrap"
import { Trans } from "react-i18next"

import { VERBOSE } from "@/CONSTANTS"
import { Link } from "react-router-dom"
import TabularClassificationDatasetProcessForm from "@pages/playground/0_TabularClassification/TabularClassificationDatasetProcessForm"
import WaitingPlaceholder from "@components/loading/WaitingPlaceholder"
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from "@/CONSTANTS_ACTIONS"
import * as _Types from "@core/types"
/**
 * @typedef PropsTabularClassificationDatasetProcess
 * @property {_Types.DatasetProcessed_t[]} datasets
 * @property {React.Dispatch<React.SetStateAction<Array<_Types.DatasetProcessed_t>>>} setDatasets
 * @property {number} datasetIndex
 * @property {React.Dispatch<React.SetStateAction<number>>} setDatasetIndex
 */

type PropsTabularClassificationDatasetProcess = {
  datasets   : { index: number, datasets: _Types.DatasetProcessed_t[] }
  setDatasets: React.Dispatch<React.SetStateAction<{ index: number, datasets: _Types.DatasetProcessed_t[] }>>
}

/**
 *
 * @param {PropsTabularClassificationDatasetProcess} props
 * @returns
 */
export default function TabularClassificationDatasetProcess(props: PropsTabularClassificationDatasetProcess) {
  const { datasets, setDatasets } = props

  const isFileUploaded = () => {
    if (datasets.datasets.length > 0 && datasets.index >= 0) {
      console.log({ dataset: datasets })
      return datasets.datasets[datasets.index] && datasets.datasets[datasets.index].is_dataset_upload
    }
  }

  if (VERBOSE) console.debug("render TabularClassificationDatasetProcess")
  return (
    <>
      <Card className="mt-3">
        <Card.Header>
          <h3>
            <Trans i18nKey={"Data set processing"} />
          </h3>
        </Card.Header>
        <Card.Body>
          {!isFileUploaded() && (
            <>
              <WaitingPlaceholder i18nKey_title={"pages.playground.generator.waiting-for-file"} />
            </>
          )}
          {isFileUploaded() && (
            <>
              <TabularClassificationDatasetProcessForm
                datasets={datasets}
                setDatasets={setDatasets}
              />
            </>
          )}
        </Card.Body>
        <Card.Footer className="text-end">
          <p className="text-muted mb-0 pb-0">
            <Trans
              i18nKey="more-information-in-link"
              components={{
                link1: (
                  <Link
                    className="text-info"
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
          <p className="text-muted mb-0 pb-0">
            <Trans
              i18nKey="more-information-in-tutorial"
              components={{
                link1: (
                  <Link
                    className="text-info"
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
        </Card.Footer>
      </Card>
    </>
  )
}
