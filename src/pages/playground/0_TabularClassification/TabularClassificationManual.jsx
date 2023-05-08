import "./TabularClassificationManual.css";
import React from "react";
import { Trans } from "react-i18next";

/**
 *
 * @return {JSX.Element}
 * @constructor
 */
export default function TabularClassificationManual() {
  const prefix = "pages.playground.0-tabular-classification.generator.manual.";

  console.debug("render TabularClassificationCustomDatasetManual");
  return <>
    <details>
      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "details-edit-layers.title"} /></summary>
      <p><Trans i18nKey={prefix + "details-edit-layers.text-0"} /></p>
      <ul>
        <li><Trans i18nKey={prefix + "details-edit-layers.list.0"} /></li>
        <li><Trans i18nKey={prefix + "details-edit-layers.list.1"} /></li>
      </ul>
    </details>

    <details>
      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "details-hyper-parameters-editor.title"} /></summary>
      <p><Trans i18nKey={prefix + "details-hyper-parameters-editor.text-0"} /></p>
      <ul>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-editor.list.0"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-editor.list.1"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-editor.list.2"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-editor.list.3"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-editor.list.4"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-editor.list.5"} /></li>
      </ul>
    </details>

    <details>
      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "details-hyper-parameters-info.title"} /></summary>
      <ul>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-info.list.0"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-info.list.1"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-info.list.2"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-info.list.3"} /></li>
        <li><Trans i18nKey={prefix + "details-hyper-parameters-info.list.4"} /></li>
      </ul>
    </details>

    <details>
      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "details-create-and-train-models.title"} /></summary>
      <p><Trans i18nKey={prefix + "details-create-and-train-models.text-0"} /></p>
      <p><Trans i18nKey={prefix + "details-create-and-train-models.text-1"} /></p>
      <p><Trans i18nKey={prefix + "details-create-and-train-models.text-2"} /></p>
      <p><Trans i18nKey={prefix + "details-create-and-train-models.text-3"} /></p>
      <p><Trans i18nKey={prefix + "details-create-and-train-models.text-4"} /></p>
    </details>

    <details>
      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "details-export-models.title"} /></summary>
      <p><Trans i18nKey={prefix + "details-export-models.text-0"} /></p>
    </details>

    <details>
      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "details-prediction.title"} /></summary>
      <p><Trans i18nKey={prefix + "details-prediction.text-0"} /></p>
      <p><Trans i18nKey={prefix + "details-prediction.text-1"} /></p>
    </details>
  </>;
}