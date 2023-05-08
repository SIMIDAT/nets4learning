import { MODEL_IMAGE_CLASSIFICATION } from "./_model";
import { Trans } from "react-i18next";

export class MODEL_IMAGE_MOBILENET extends MODEL_IMAGE_CLASSIFICATION {
  static KEY = "IMAGE-MOBILENET"
  TITLE = "datasets-models.3-image-classifier.mobilenet.title"

  DESCRIPTION() {
    const prefix = "datasets-models.3-image-classifier.mobilenet.description."
    return <>
      <p><Trans i18nKey={prefix + "text-0"} /></p>
      <p><Trans i18nKey={prefix + "text-1"} /></p>

      <details>
        <summary><Trans i18nKey={prefix + "details-input.title"} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + "details-input.list.0"} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + "details-output.title"} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + "details-output.list.0"}
                   components={{
                     link1: <a href="https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt" rel="noreferrer" target="_blank">Text</a>
                   }} />
          </li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + "details-references.title"} /></summary>
        <p><Trans i18nKey={prefix + "details-references.text-0"} /></p>
        <ol>
          <li>
            <Trans i18nKey={prefix + "details-references.list.0"}
                   components={{
                     link1: <a href="https://arxiv.org/abs/1801.04381" target="_blank" rel="noreferrer">Text</a>
                   }} />
          </li>
        </ol>
      </details>
    </>
  }
}
