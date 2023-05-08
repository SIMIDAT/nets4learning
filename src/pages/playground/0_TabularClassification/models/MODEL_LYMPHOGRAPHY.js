import * as tf from "@tensorflow/tfjs";
import { MODEL_TABULAR_CLASSIFICATION } from "./_model";
import { Trans } from "react-i18next";

export class MODEL_LYMPHOGRAPHY extends MODEL_TABULAR_CLASSIFICATION {
  static KEY = "LYMPHOGRAPHY"
  static URL = "https://archive.ics.uci.edu/ml/datasets/Lymphography"
  static URL_MODEL = "/public/models/classification/car/my-model-lymphography.json"
  static URL_DATASET = "https://archive.ics.uci.edu/ml/machine-learning-databases/lymphography/"
  TITLE = "datasets-models.0-tabular-classification.lymphography.title"

  DESCRIPTION() {
    const prefix = "datasets-models.0-tabular-classification.lymphography.description."
    return <>
      <p><Trans i18nKey={prefix + "text-1"} /></p>
      <details>
        <summary><Trans i18nKey={prefix + "details-input.title"} /></summary>
        <ol>
          {Array
            .from({ length: 17 })
            .map((v, i) => <li key={i}><Trans i18nKey={prefix + "details-input.list." + i} /></li>)}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + "details-output.title"} /></summary>
        <ol>
          {Array
            .from({ length: 4 })
            .map((v, i) => <li key={i}><Trans i18nKey={prefix + "details-output.list." + i} /></li>)}
        </ol>
      </details>
      <details>
        <summary>
          <Trans i18nKey={prefix + "details-references.title"} />
        </summary>
        <ol>
          <li>
            <a href="https://archive.ics.uci.edu/ml/datasets/Lymphography"
               target="_blank"
               rel="noreferrer">
              <Trans i18nKey={prefix + "details-references.list.0"} />
            </a>
          </li>
        </ol>
      </details>
    </>
  }

  HTML_EXAMPLE() {
    const prefix = "datasets-models.0-tabular-classification.lymphography.html-example."
    return <>
      <p>
        <Trans i18nKey={prefix + "text"} />
        <br />
        <b><Trans i18nKey={prefix + "items"} /></b>
      </p>
      <p><Trans i18nKey={prefix + "examples"} /></p>
    </>
  }

  TABLE_HEADER = [
    "lymphatics",
    "block of affere",
    "bl. of lymph. c",
    "bl. of lymph. s",
    "by pass",
    "extravasates",
    "regeneration",
    "early uptake in",
    "lym.nodes dimin",
    "lym.nodes enlar",
    "changes in lym",
    "defect in node",
    "changes in node",
    "changes in stru",
    "special forms",
    "dislocation of",
    "exclusion of",
    "no. of nodes in",
    "Category"
  ]
  loadModel = async () => {
    return await tf.loadLayersModel(process.env.REACT_APP_PATH + "/models/classification/lymphography/my-model-lymphography.json")
  }
  function_v_input = async function (element, index, param = "") {
    return parseInt(element)
  }
  CONFIGURATION = <></>
  EXAMPLES = []
  CLASSES = ["normal find", "metastases", "malign lymph", "fibrosis"]
  NUM_CLASSES = 4
  DATA_OBJECT = {
    "lymphatics"     : ["1", "2", "3", "4"],
    "block of affere": ["1", "2"],
    "bl. of lymph. c": ["1", "2"],
    "bl. of lymph. s": ["1", "2"],
    "by pass"        : ["1", "2"],
    "extravasates"   : ["1", "2"],
    "regeneration"   : ["1", "2"],
    "early uptake in": ["1", "2"],
    "lym.nodes dimin": ["1", "2", "3"],
    "lym.nodes enlar": ["1", "2", "3", "4"],
    "changes in lym" : ["1", "2", "3"],
    "defect in node" : ["1", "2", "3", "4"],
    "changes in node": ["1", "2", "3", "4"],
    "changes in stru": ["1", "2", "3", "4", "5", "6", "7"],
    "special forms"  : ["1", "2", "3"],
    "dislocation of" : ["1", "2"],
    "exclusion of"   : ["1", "2"],
    "no. of nodes in": ["1", "2", "3", "4", "5", "6", "7", "8"]
  }
  DATA_DEFAULT = {
    // 4 -> fibrosis
    "lymphatics"     : "3",
    "block of affere": "1",
    "bl. of lymph. c": "1",
    "bl. of lymph. s": "1",
    "by pass"        : "1",
    "extravasates"   : "2",
    "regeneration"   : "2",
    "early uptake in": "1",
    "lym.nodes dimin": "3",
    "lym.nodes enlar": "1",
    "changes in lym" : "1",
    "defect in node" : "2",
    "changes in node": "1",
    "changes in stru": "4",
    "special forms"  : "2",
    "dislocation of" : "1",
    "exclusion of"   : "1",
    "no. of nodes in": "7"
  }
  DATA_OBJECT_KEYS = [
    "lymphatics",
    "block of affere",
    "bl. of lymph. c",
    "bl. of lymph. s",
    "by pass",
    "extravasates",
    "regeneration",
    "early uptake in",
    "lym.nodes dimin",
    "lym.nodes enlar",
    "changes in lym",
    "defect in node",
    "changes in node",
    "changes in stru",
    "special forms",
    "dislocation of",
    "exclusion of",
    "no. of nodes in"
  ]
  DATA_CLASSES = [
    ["normal", "arched", "deformed", "displaced"],
    ["No", "Yes"],
    ["No", "Yes"],
    ["No", "Yes"],
    ["No", "Yes"],
    ["No", "Yes"],
    ["No", "Yes"],
    ["No", "Yes"],
    ["1", "2", "3"],
    ["1", "2", "3", "4"],
    ["bean", "oval", "round"],
    ["No", "lacunar", "lac. marginal", "lac. central"],
    ["No", "lacunar", "lac. marginal", "lac. central"],
    ["grainy", "drop-like", "coarse", "diluted", "reticular", "stripped", "faint"],
    ["No", "chalices", "vesicles"],
    ["No", "Yes"],
    ["No", "Yes"],
    ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "=>70"]
  ]
  DATA_CLASSES_KEYS = []
  // @formatter:off
  LIST_EXAMPLES_RESULTS = [
    "normal",
    "metastasis",
    "malign lymph",
    "fibrosis",
  ]
  LIST_EXAMPLES    = [
    // Normal
    {
      "lymphatics"     : "1",
      "block of affere": "1",
      "bl. of lymph. c": "1",
      "bl. of lymph. s": "1",
      "by pass"        : "1",
      "extravasates"   : "2",
      "regeneration"   : "1",
      "early uptake in": "2",
      "lym.nodes dimin": "1",
      "lym.nodes enlar": "2",
      "changes in lym" : "2",
      "defect in node" : "1",
      "changes in node": "1",
      "changes in stru": "1",
      "special forms"  : "1",
      "dislocation of" : "1",
      "exclusion of"   : "1",
      "no. of nodes in": "2"
    },
    // metastasis
    {
      "lymphatics"     : "1",
      "block of affere": "1",
      "bl. of lymph. c": "1",
      "bl. of lymph. s": "1",
      "by pass"        : "1",
      "extravasates"   : "1",
      "regeneration"   : "1",
      "early uptake in": "1",
      "lym.nodes dimin": "1",
      "lym.nodes enlar": "1",
      "changes in lym" : "1",
      "defect in node" : "1",
      "changes in node": "1",
      "changes in stru": "1",
      "special forms"  : "1",
      "dislocation of" : "1",
      "exclusion of"   : "1",
      "no. of nodes in": "1"
    },
    // malign lymph
    {
      "lymphatics"     : "2",
      "block of affere": "1",
      "bl. of lymph. c": "1",
      "bl. of lymph. s": "1",
      "by pass"        : "1",
      "extravasates"   : "2",
      "regeneration"   : "1",
      "early uptake in": "2",
      "lym.nodes dimin": "1",
      "lym.nodes enlar": "3",
      "changes in lym" : "3",
      "defect in node" : "4",
      "changes in node": "2",
      "changes in stru": "7",
      "special forms"  : "3",
      "dislocation of" : "2",
      "exclusion of"   : "2",
      "no. of nodes in": "3"
    },
    // fibrosis
    {
      "lymphatics"     : "3",
      "block of affere": "1",
      "bl. of lymph. c": "1",
      "bl. of lymph. s": "1",
      "by pass"        : "1",
      "extravasates"   : "2",
      "regeneration"   : "2",
      "early uptake in": "1",
      "lym.nodes dimin": "3",
      "lym.nodes enlar": "1",
      "changes in lym" : "1",
      "defect in node" : "2",
      "changes in node": "1",
      "changes in stru": "4",
      "special forms"  : "2",
      "dislocation of" : "1",
      "exclusion of"   : "1",
      "no. of nodes in": "7"
    },
  ]
  FORM             = [
    { type: "label-encoder", name: "lymphatics",       options: [{ value: "1", text: "normal" }, { value: "2", text: "arched" },    { value: "3", text: "deformed" },     { value: "4", text: "displaced" }]},
    { type: "label-encoder", name: "block of affere",  options: [{ value: "1", text: "No" },     { value: "2", text: "2" }]},
    { type: "label-encoder", name: "bl. of lymph. c",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "bl. of lymph. s",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "by pass",          options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "extravasates",     options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "regeneration",     options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "early uptake in",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "lym.nodes dimin",  options: [{ value: "1", text: "1" },      { value: "2", text: "2" },         { value: "3", text: "3" }]},
    { type: "label-encoder", name: "lym.nodes enlar",  options: [{ value: "1", text: "1" },      { value: "2", text: "2" },         { value: "3", text: "3" },              { value: "4", text: "4" }]},
    { type: "label-encoder", name: "changes in lym",   options: [{ value: "1", text: "bean" },   { value: "2", text: "oval" },      { value: "3", text: "round" }]},
    { type: "label-encoder", name: "defect in node",   options: [{ value: "1", text: "No" },     { value: "2", text: "lacunar" },   { value: "3", text: "lac. marginal" },  { value: "4", text: "lac. central" }]},
    { type: "label-encoder", name: "changes in node",  options: [{ value: "1", text: "No" },     { value: "2", text: "lacunar" },   { value: "3", text: "lac. marginal" },  { value: "4", text: "lac. central" }]},
    { type: "label-encoder", name: "changes in stru",  options: [{ value: "1", text: "No" },     { value: "2", text: "grainy" },    { value: "3", text: "drop-like" },      { value: "4", text: "coarse" }, { value: "5", text: "diluted" }, { value: "6", text: "reticular" }, { value: "7", text: "stripped" }, { value: "8", text: "faint" }]},
    { type: "label-encoder", name: "special forms",    options: [{ value: "1", text: "No" },     { value: "2", text: "chalices" },  { value: "3", text: "vesicles" }]},
    { type: "label-encoder", name: "dislocation of",   options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "exclusion of",     options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "no. of nodes in",  options: [{ value: "1", text: "0-9" },    { value: "2", text: "10-19" },     { value: "3", text: "20-29" },          { value: "4", text: "30-39" },  { value: "5", text: "40-49" },  { value: "6", text: "50-59" },      { value: "7", text: "60-69" },    { value: "8", text: "=>70" }]}
  ]
  DATA             = [
    [4,2,1,1,1,1,1,2,1,2,2,2,4,8,1,1,2,2,3],
    [3,2,1,1,2,2,1,2,1,3,3,2,3,4,2,2,2,2,2],
    [3,2,2,2,2,2,2,2,1,4,3,3,4,8,3,2,2,7,3],
    [3,1,1,1,1,2,1,2,1,3,3,4,4,4,3,1,2,6,3],
    [3,1,1,1,1,1,1,1,1,2,2,4,3,5,1,2,2,1,2],
    [2,1,1,1,1,1,1,2,1,3,3,3,3,6,3,1,2,4,2],
    [2,2,1,1,1,1,1,2,1,2,3,2,3,8,2,1,1,1,2],
    [3,2,1,1,1,2,1,2,1,2,2,2,2,1,3,1,1,1,2],
    [2,2,1,1,1,1,1,2,1,3,2,2,2,8,3,1,2,5,3],
    [2,1,1,1,1,1,1,2,1,2,2,3,3,5,3,1,1,2,3],
    [2,2,2,1,2,2,1,2,1,3,2,4,3,5,1,2,2,3,2],
    [4,2,1,1,1,2,1,1,1,3,3,4,3,8,3,2,2,2,2],
    [4,2,1,1,1,1,1,2,1,2,2,2,2,3,2,1,1,1,2],
    [4,1,1,1,1,2,1,2,1,4,2,2,4,7,3,2,2,2,3],
    [3,2,2,2,2,2,2,2,3,1,1,2,2,8,1,2,2,4,4],
    [2,2,1,1,1,2,1,2,1,2,3,3,3,5,3,2,2,2,2],
    [3,2,1,1,1,2,1,2,1,2,3,3,3,2,2,2,2,3,2],
    [2,2,1,1,1,2,1,1,1,2,2,2,3,5,2,1,2,2,2],
    [3,1,1,1,1,1,1,2,1,2,2,2,3,2,1,2,2,1,2],
    [2,2,1,1,1,1,1,2,1,3,3,3,3,2,2,2,1,1,2],
    [3,1,1,1,1,1,1,2,1,2,2,4,2,4,3,2,2,3,3],
    [4,1,1,1,2,2,1,2,1,3,3,3,4,5,3,2,2,4,3],
    [4,2,1,1,2,2,1,2,1,4,3,4,3,4,2,2,2,2,2],
    [3,2,1,1,1,1,1,2,1,2,2,2,2,5,1,1,1,1,2],
    [3,1,1,1,1,1,1,2,2,1,2,2,2,8,3,1,2,8,3],
    [3,1,1,1,1,2,1,1,1,3,2,3,3,8,3,2,2,2,3],
    [4,1,1,1,1,2,1,2,1,3,3,4,2,4,3,2,2,4,3],
    [4,1,1,1,1,1,1,2,1,3,2,4,4,8,3,2,2,1,3],
    [4,2,1,1,1,1,1,2,1,2,2,2,3,3,2,2,2,1,2],
    [3,1,1,1,1,1,1,1,1,2,2,4,2,8,2,2,2,1,3],
    [4,2,1,1,1,2,1,2,1,4,3,3,3,7,3,2,2,3,3],
    [2,1,1,1,1,1,1,2,1,3,2,3,3,8,3,2,2,3,3],
    [2,1,1,1,1,1,1,1,1,2,3,2,2,8,1,2,1,1,2],
    [2,2,1,1,1,1,1,1,1,1,2,2,3,3,1,1,1,1,2],
    [4,2,1,1,2,2,1,2,1,3,3,4,3,4,3,2,2,2,2],
    [2,2,2,1,2,2,1,2,1,3,3,3,3,8,3,1,2,2,2],
    [3,1,1,1,2,2,2,1,3,1,1,4,2,5,3,1,2,4,4],
    [3,1,1,1,1,2,1,2,1,4,3,4,2,4,3,2,2,6,3],
    [2,1,1,1,1,1,1,2,1,3,3,2,3,4,3,2,2,2,3],
    [2,1,1,1,1,1,1,2,1,2,2,2,1,7,1,2,2,2,3],
    [2,1,1,1,1,2,1,2,1,2,2,3,3,3,3,1,2,1,3],
    [2,2,2,1,2,2,2,2,1,4,2,2,2,4,3,2,2,6,3],
    [3,2,2,1,1,2,1,1,1,3,2,3,3,4,3,1,2,2,2],
    [4,2,1,1,2,1,1,2,1,3,3,3,3,2,2,2,2,3,2],
    [3,2,2,2,2,2,2,1,2,2,2,4,2,4,3,2,2,7,4],
    [2,1,1,1,1,1,1,2,1,2,2,2,2,8,2,2,2,1,3],
    [3,2,2,1,2,1,1,2,1,2,2,3,3,8,3,1,2,1,2],
    [4,1,1,1,1,1,1,1,2,1,3,4,2,8,1,2,2,1,2],
    [3,2,2,1,1,2,1,1,1,2,3,3,3,5,2,1,2,2,2],
    [2,2,2,1,1,1,1,2,1,2,2,4,3,8,2,2,2,2,2],
    [2,1,1,1,1,1,1,1,1,1,1,2,2,3,1,2,2,1,2],
    [3,2,1,1,1,2,1,2,1,2,2,2,4,8,3,1,2,3,3],
    [3,1,1,1,1,1,2,1,1,2,2,4,3,5,2,1,2,1,2],
    [2,2,1,1,2,2,1,1,1,3,3,4,3,4,3,1,1,1,2],
    [2,2,2,1,2,2,1,1,1,2,2,3,3,4,2,1,2,1,2],
    [4,1,1,1,1,1,1,2,1,2,2,3,3,3,3,2,1,1,3],
    [2,1,1,1,1,1,1,2,1,3,2,4,2,8,3,2,2,4,3],
    [4,2,1,1,2,2,1,2,1,2,3,2,3,2,3,2,2,4,2],
    [4,2,2,2,2,2,2,2,1,4,3,4,4,7,3,2,2,8,3],
    [2,2,2,1,2,2,1,2,1,3,3,3,3,8,3,2,2,2,2],
    [4,1,1,1,1,1,1,2,1,4,2,2,4,7,3,2,2,7,3],
    [3,2,2,1,2,2,1,2,1,3,2,2,3,4,1,2,2,1,2],
    [3,1,1,1,1,2,1,2,1,4,2,4,4,2,3,2,2,3,3],
    [4,2,1,1,1,2,1,1,1,2,3,2,3,2,2,1,1,1,2],
    [2,2,1,1,1,1,1,1,1,2,2,3,3,5,2,2,2,1,2],
    [4,1,1,1,2,1,2,2,1,3,2,3,4,5,3,2,2,7,3],
    [2,1,1,1,1,1,1,2,1,4,3,4,4,5,3,2,2,5,3],
    [3,2,2,1,2,2,1,1,1,3,3,4,3,4,2,2,2,3,2],
    [2,1,1,1,1,1,1,1,1,2,3,2,3,3,2,2,1,1,3],
    [2,1,1,1,1,1,1,2,1,3,2,2,2,6,3,2,2,6,3],
    [3,2,1,1,1,2,1,2,1,3,3,3,3,4,3,2,2,1,2],
    [3,1,1,1,1,1,1,1,1,2,2,2,2,5,1,1,2,2,3],
    [4,2,1,1,2,2,1,1,1,1,3,3,3,3,3,2,2,3,2],
    [3,1,1,1,1,1,1,2,1,4,3,3,4,5,3,2,2,3,3],
    [2,1,1,1,1,2,1,1,1,2,2,2,2,3,1,1,1,1,3],
    [4,2,2,1,2,2,1,2,1,3,3,4,3,8,2,2,2,3,2],
    [4,2,2,1,1,1,1,2,1,2,2,2,3,3,2,2,2,2,2],
    [3,1,1,1,2,1,1,2,1,2,3,3,3,5,3,1,1,1,2],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [3,2,1,1,1,1,1,2,1,3,2,2,4,8,3,2,2,3,3],
    [2,2,1,1,1,2,1,2,1,3,3,3,4,8,3,2,2,2,3],
    [4,2,1,1,1,1,1,1,1,4,3,3,3,4,2,2,1,1,2],
    [2,1,1,1,1,1,1,2,1,3,2,2,2,8,3,2,2,5,3],
    [2,2,2,1,2,2,2,2,1,3,3,4,4,5,3,2,2,5,3],
    [4,1,1,1,1,2,1,2,1,4,3,4,2,5,3,2,2,2,3],
    [2,2,1,1,2,2,1,1,1,2,2,4,2,8,3,2,2,1,2],
    [2,2,1,1,1,1,1,2,1,2,3,3,3,5,2,1,2,1,2],
    [2,2,1,1,1,1,1,2,1,2,2,2,3,8,3,1,2,1,2],
    [2,2,1,1,1,2,1,2,1,3,3,4,2,8,3,2,2,2,3],
    [3,1,1,1,1,1,1,2,1,3,2,2,2,8,1,1,1,1,2],
    [4,2,2,1,2,2,1,2,1,1,2,2,1,3,1,2,2,2,3],
    [2,2,2,1,1,2,1,1,1,2,3,2,3,3,2,1,1,1,2],
    [3,2,2,1,2,2,1,2,1,2,3,3,4,2,2,2,1,1,2],
    [2,1,1,1,1,1,1,1,1,1,2,2,3,3,1,2,2,1,2],
    [2,1,1,1,1,1,1,2,1,3,2,4,4,4,3,2,2,5,3],
    [2,1,1,1,1,1,1,2,1,2,2,4,2,8,3,2,2,3,3],
    [3,2,1,1,1,1,1,1,1,2,2,3,3,3,3,1,1,2,2],
    [2,2,1,1,1,2,1,2,1,2,3,2,2,4,2,1,1,2,2],
    [3,2,1,1,1,1,1,1,1,2,2,3,3,5,1,1,1,1,2],
    [3,2,1,1,1,2,1,1,1,2,2,4,3,4,1,2,2,2,2],
    [2,1,1,1,1,2,1,2,1,3,3,4,2,8,3,2,2,3,3],
    [2,2,1,1,1,1,1,2,1,2,2,3,3,2,3,2,2,2,2],
    [2,1,1,1,1,1,1,2,1,2,2,2,2,4,1,2,1,2,2],
    [3,2,1,1,2,2,1,1,1,2,2,4,3,2,1,2,2,3,2],
    [4,1,1,1,1,1,1,2,1,3,3,2,2,4,2,2,2,2,2],
    [2,2,1,1,1,1,1,2,1,4,3,4,2,7,3,2,2,5,3],
    [3,2,1,1,1,1,1,2,1,2,3,3,3,8,2,2,2,1,2],
    [2,2,1,1,1,2,1,2,1,4,3,4,4,8,3,2,2,7,3],
    [3,2,1,1,1,2,1,1,1,2,3,4,2,4,1,1,1,1,2],
    [2,2,1,1,1,1,1,2,1,2,3,3,3,5,3,1,2,1,2],
    [2,1,1,1,1,1,1,1,1,2,3,3,3,8,3,1,1,1,2],
    [4,1,1,1,1,2,1,2,1,4,3,4,3,3,3,2,2,5,3],
    [2,1,1,1,1,1,1,1,1,2,2,2,2,8,1,1,1,1,2],
    [2,1,1,1,1,2,1,2,1,2,2,2,2,8,2,1,2,2,3],
    [3,1,1,1,1,1,1,2,1,2,2,4,4,2,3,2,1,1,3],
    [3,1,1,1,1,2,1,2,1,2,2,4,3,8,2,2,2,1,3],
    [4,1,1,1,1,1,1,2,1,3,2,2,4,3,2,2,1,1,3],
    [4,2,2,1,1,2,1,2,1,2,2,3,3,8,3,2,2,2,2],
    [2,1,1,1,1,2,1,2,1,3,2,2,2,4,3,1,2,5,3],
    [4,2,1,1,2,2,1,2,1,3,3,4,2,5,3,2,2,3,3],
    [2,1,1,1,1,1,1,1,1,1,2,4,3,8,2,2,2,2,2],
    [2,1,1,1,1,1,1,1,1,2,2,2,3,8,2,1,2,1,2],
    [2,2,2,2,2,2,1,1,1,2,2,4,3,8,2,2,2,3,2],
    [3,1,1,1,1,1,1,1,1,2,3,3,3,4,3,1,2,2,2],
    [4,2,1,1,1,2,1,1,1,2,2,3,3,5,2,1,2,1,2],
    [3,1,1,1,1,2,1,2,1,4,2,2,2,4,3,2,2,7,3],
    [2,2,1,1,1,1,1,2,1,3,3,3,3,3,2,1,2,1,2],
    [2,2,1,1,1,2,1,2,1,2,2,3,3,4,2,1,2,1,2],
    [2,1,1,1,1,2,1,2,1,2,2,2,4,8,1,2,2,2,3],
    [3,2,1,1,1,2,1,2,1,3,2,4,3,4,2,2,2,2,2],
    [2,2,1,1,1,1,1,2,1,4,3,4,2,8,2,1,2,4,2],
    [4,2,2,2,2,2,1,2,1,4,3,4,4,7,3,2,2,6,3],
    [4,1,1,1,1,1,1,2,1,4,2,4,2,8,3,2,2,6,3],
    [3,2,1,1,1,1,1,2,1,2,3,3,3,5,2,2,1,1,2],
    [2,2,1,1,1,2,1,2,1,2,2,4,4,5,3,2,2,1,2],
    [3,2,2,2,2,2,1,2,1,2,3,3,3,4,3,2,2,7,2],
    [1,1,1,1,1,2,1,2,1,2,2,1,1,2,1,1,1,2,1],
    [2,1,1,1,1,2,1,2,1,3,3,2,2,4,3,2,2,6,3],
    [2,2,1,1,1,1,1,1,1,2,3,3,3,3,3,1,2,1,2],
    [3,1,1,1,2,2,2,1,3,1,1,2,1,5,3,1,1,7,4],
    [2,2,1,1,1,1,1,1,1,2,3,3,3,2,2,2,2,1,2],
    [2,1,1,1,1,1,1,2,1,2,2,4,4,8,2,1,2,2,3],
    [2,2,1,1,1,2,1,2,1,2,3,3,3,5,3,2,2,1,2],
    [3,2,1,1,2,2,1,2,1,2,2,4,3,5,2,2,2,4,3],
    [2,1,1,1,1,1,1,1,1,1,1,1,1,3,1,2,2,1,2],
    [2,2,1,1,1,2,1,2,1,3,3,3,3,8,3,2,2,4,3],
    [2,1,1,1,1,1,1,2,1,2,2,4,2,2,1,2,2,1,2],
    [2,2,2,1,2,2,1,2,1,3,3,4,3,4,3,2,2,6,2]
  ]
  // @formatter:on
}
