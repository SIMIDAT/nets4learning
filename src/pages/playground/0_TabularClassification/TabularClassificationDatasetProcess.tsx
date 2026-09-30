import { Card } from "react-bootstrap"
import { Trans } from "react-i18next"

import { VERBOSE } from "@/CONSTANTS"
import TabularClassificationDatasetProcessForm from "@pages/playground/0_TabularClassification/TabularClassificationDatasetProcessForm"
import N4LEmptyState from "@components/loading/N4LEmptyState"
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from "@/CONSTANTS_ACTIONS"
import * as _Types from "@core/types"
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'
import N4LHelpLink from "@components/helpLink/N4LHelpLink"


/**
 *
 * @param {PropsTabularClassificationDatasetProcess} props
 * @returns
 */
export default function TabularClassificationDatasetProcess() {
    const { datasets } = useTabularClassificationContext()

  const isFileUploaded = () => {
    if (datasets.datasets.length > 0 && datasets.index >= 0) {
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
              <N4LEmptyState i18nKey={"pages.playground.generator.waiting-for-file"} />
            </>
          )}
          {isFileUploaded() && (
            <>
              <TabularClassificationDatasetProcessForm />
            </>
          )}
        </Card.Body>
        <Card.Footer className="text-end">
          <p className="text-muted mb-0 pb-0">
            <Trans
              i18nKey="more-information-in-link"
              components={{
                link1: (
                  <N4LHelpLink page={"glossary"} action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS} />
                ),
              }}
            />
          </p>
          <p className="text-muted mb-0 pb-0">
            <Trans
              i18nKey="more-information-in-tutorial"
              components={{
                link1: (
                  <N4LHelpLink page={"manual"} action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS} />
                ),
              }}
            />
          </p>
        </Card.Footer>
      </Card>
    </>
  )
}
