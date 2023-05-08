import "./TabularClassification.css";
import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import ReactGA from "react-ga4";
import { Accordion, Button, Card, Col, Container, Form, Row, Table } from "react-bootstrap";
import { getKeyDatasetByID_TabularClassification, MODEL_UPLOAD, MODEL_CAR, MODEL_IRIS, MODEL_LYMPHOGRAPHY, } from "../../../DATA_MODEL";
import { createTabularClassificationCustomDataSet, createTabularClassificationCustomDataSet_upload, } from "../../../core/nn-utils/ArchitectureHelper";
import { TYPE_ACTIVATION, TYPE_LOSSES, TYPE_METRICS, TYPE_OPTIMIZER, } from "../../../core/nn-utils/ArchitectureTypesHelper";
import json_cars from "../../../core/constants/template_car.json";
import json_iris from "../../../core/constants/template_iris.json";
import json_lymphatics from "../../../core/constants/template_lymphatcs.json";
import * as alertHelper from "../../../utils/alertHelper";
import DragAndDrop from "../../../components/dragAndDrop/DragAndDrop";
import GraphicRed from "../../../utils/graphicRed/GraphicRed";
import TabularClassificationForm from "./TabularClassificationForm";
import TabularClassificationManual from "./TabularClassificationManual";
import TabularClassificationPredictionDynamicForm from "./TabularClassificationPredictionDynamicForm";
import N4LTablePagination from "../../../components/table/N4LTablePagination";

import { isProduction } from "../../../utils/utils";
import { Trans, useTranslation } from "react-i18next";
import { MODEL_TABULAR_CLASSIFICATION } from "./models/_model";
import * as dfd from "danfojs";
import * as errorUtils from "../../../core/error-utils";

const DEFAULT_LEARNING_RATE = 1;
const DEFAULT_NUMBER_EPOCHS = 20;
const DEFAULT_TEST_SIZE = 10;
const DEFAULT_ID_OPTIMIZATION = "adam";
const DEFAULT_ID_LOSS = "metrics-categoricalCrossentropy";
const DEFAULT_ID_METRICS = "accuracy";

const DEFAULT_START_LAYER_UNITS = 10;
const DEFAULT_START_LAYER_ACTIVATION = "sigmoid";
const DEFAULT_END_LAYER_UNITS = 3;
const DEFAULT_END_LAYER_ACTIVATION = "softmax";
const DEFAULT_LAYERS = [
  { units: DEFAULT_START_LAYER_UNITS, activation: DEFAULT_START_LAYER_ACTIVATION },
  { units: DEFAULT_END_LAYER_UNITS, activation: DEFAULT_END_LAYER_ACTIVATION },
];
// Por defecto dejamos la configuración óptima para el modelo del titanic
const DEFAULT_LAYERS_UPLOAD = [
  { units: 124, activation: "relu" },
  { units: 64, activation: "relu" },
  { units: 32, activation: "relu" },
  { units: 2, activation: "softmax" },
];


/**
 * Se ha dividido en modelos entrenados y modelos creados,
 * Las siguientes funciones corresponder a subir un modelo, pre procesar los datos, entrenar y predecir
 *
 *                                                            Upload
 * 1. Subir conjunto de datos:                                |
 * handleChange_FileUpload_CSV()                <-------------|
 * handleChange_FileUpload_CSV_reject()         <-------------|
 * $ <TabularClassificationCustomDatasetForm />               |
 *                                                            |
 * > handleChange_cType()                       <-------------|
 *                                                            |
 * -- Pre procesamiento                                       |
 * > handleSubmit_ProcessDataFrame()            <-------------|
 * > > Parser.transform()                       <-------------|
 *                                                            |
 * 2. Entrenar modelo:                                        |
 * handleSubmit_CreateModel_upload()            <-------------|
 *                                                            |
 * 3. Predecir con el modelo:                                 |
 * $ <TabularClassificationDynamicFormPrediction />           |
 *                                                            |
 * Case 1. -- Cambiar datos de todas las columnas             |
 * > handleChange_ROW()                                       |
 * Case 2. -- Cambiar dato de una columna                     |
 * > handleChange_Float()                                     |
 * > handleChange_Number()                                    |
 * > handleChange_Select()                                    |
 *                                                            |
 * -- Predecir                                                |
 * > handleClick_TestVector_upload()            <-------------|
 *
 */
export default function TabularClassification(props) {
  const { dataset } = props;
  const dataset_key = getKeyDatasetByID_TabularClassification(dataset);

  const { t } = useTranslation();
  const prefix = "pages.playground.0-tabular-classification.generator.";

  const isDebug = process.env.REACT_APP_ENVIRONMENT !== "production";

  // Steps:
  //
  // Upload dataset
  // Select transformations from the xTrain and yTrain set.
  // 1.X. Preprocessing
  //
  // Definition of the model architecture
  // 2.1. Selecting the layers of the architecture
  // 2.2. Selecting the hyper parameters
  // 2.X. Training the model
  //
  // Selecting the trained model
  //
  // Predictions
  // 4.1. Selecting the data to be predicted
  // 4.X. Prediction

  // Dataset
  // dataframe original
  const [dataframeOriginal, setDataframeOriginal] = useState(null);
  /**
   * @typedef {Object | null} DataProcessedState_t
   * @property {dfd.DataFrame} dataframeProcessed
   * @property {string} column_name_target
   * @property {dfd.DataFrame} X
   * @property {dfd.DataFrame} y
   * @property {dfd.MinMaxScaler|dfd.StandardScaler} scaler
   * @property {Object.<string, dfd.LabelEncoder>} obj_encoder
   * @property {Array<TYPE_ATTRIBUTES_OPTIONS|TYPE_ATTRIBUTES_NUMBER>} attributes
   * @property {Array<TYPE_CLASSES>} classes
   */
  const [dataProcessed, setDataProcessed] = useState(/** @type DataProcessedState_t*/null);
  const [isDatasetProcessed, setIsDatasetProcessed] = useState(false);

  // Layers
  const [layers, setLayers] = useState(dataset_key === MODEL_UPLOAD ? DEFAULT_LAYERS_UPLOAD : DEFAULT_LAYERS);

  // Params
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE);
  const [numberEpochs, setNumberEpochs] = useState(DEFAULT_NUMBER_EPOCHS);
  const [testSize, setTestSize] = useState(DEFAULT_TEST_SIZE);
  const [idOptimizer, setIdOptimizer] = useState(DEFAULT_ID_OPTIMIZATION); // OPTIMIZER_TYPE
  const [idLoss, setIdLoss] = useState(DEFAULT_ID_LOSS); // LOSS_TYPE
  const [idMetrics, setIdMetrics] = useState(DEFAULT_ID_METRICS); // METRICS_TYPE

  // Models upload && review
  const [isTraining, setIsTraining] = useState(false);
  /**
   * @typedef {Object} GeneratedModel_t
   * @property {number} idMODEL
   * @property {boolean} isLoad
   * @property {any} model
   * @property {any} TARGET_SET_CLASSES
   * @property {any} DATA_SET_CLASSES
   * @property {number} learningRate
   * @property {number} testSize
   * @property {number} numberOfEpoch
   * @property {Array<{units: number, activation: string}>} layerList
   * @property {string} idOptimizer
   * @property {string} idLoss
   * @property {string} idMetrics
   */
  const [generatedModels, setGeneratedModels] = useState(/** @type Array<GeneratedModel_t> */[]);
  const [generatedModelsIndex, setGeneratedModelsIndex] = useState(-1);
  const [isDisabledDownloadModel, setIsDisabledDownloadModel] = useState(true);
  // Model review
  const [Model, setModel] = useState(null);
  const [DataSetClasses, setDataSetClasses] = useState([]);
  const [TargetSetClasses, setTargetSetClasses] = useState([]);
  // Utils

  /**
   * @typedef {Object | null} CustomDataset_t
   * @property {boolean} missing_values
   * @property {string} missing_value_key
   * @property {Array<any>} attributes
   * @property {Array<any>} classes
   * @property {Array<Array<any>>} data
   */
  const [customDataSet_JSON, setCustomDataSet_JSON] = useState(/** @type CustomDataset_t */   null);

  // Class && Controllers
  const [modelInfo, set_ModelInfo] = useState(new MODEL_TABULAR_CLASSIFICATION(t));

  // Prediction
  const [predictionBar, setPredictionBar] = useState({
    list_encoded_classes: [],
    labels              : [],
    data                : [],
  });
  const [objectToPredict, setObjectToPredict] = useState({});
  const [stringToPredict, setStringToPredict] = useState("");

  const debug = async () => {
    console.log({ customDataSet_JSON, stringToPredict });
  };

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/TabularClassificationCustomDataset/" + dataset_key, title: dataset_key });

    switch (dataset_key) {
      case MODEL_UPLOAD: {
        // TODO
        // const uploadedArchitecture = localStorage.getItem('custom-architecture')
        // if (uploadedArchitecture !== "{}") {
        //   if (!isProduction()) console.log(uploadedArchitecture)
        //   const uploadedJSON = JSON.parse(uploadedArchitecture)
        //   const auxLayer = uploadedJSON?.modelTopology?.config?.layers ?? []
        //   let _layerArray = []
        //   for (let i = 0; i < auxLayer.length; i++) {
        //     _layerArray.push({
        //       units     : auxLayer[i].config.units,
        //       activation: auxLayer[i].config.activation,
        //     })
        //   }
        //   setLayers(_layerArray)
        // }
        setLayers(DEFAULT_LAYERS_UPLOAD);
        setIsDatasetProcessed(false);
        break;
      }
      case MODEL_CAR.KEY: {
        const _model = new MODEL_CAR(t);
        set_ModelInfo(_model);
        setCustomDataSet_JSON(json_cars);
        setIsDatasetProcessed(true);
        setLayers([
          { units: 10, activation: "sigmoid" },
          { units: 4, activation: "softmax" },
        ]);
        break;
      }
      case MODEL_IRIS.KEY: {
        const _model = new MODEL_IRIS(t);
        set_ModelInfo(_model);
        setCustomDataSet_JSON(json_iris);
        setIsDatasetProcessed(true);
        setLayers([
          { units: 10, activation: "sigmoid" },
          { units: 3, activation: "softmax" },
        ]);
        break;
      }
      case MODEL_LYMPHOGRAPHY.KEY: {
        const _model = new MODEL_LYMPHOGRAPHY(t);
        set_ModelInfo(_model);
        setCustomDataSet_JSON(json_lymphatics);
        setIsDatasetProcessed(true);
        setLayers([
          { units: 18, activation: "sigmoid" },
          { units: 10, activation: "relu" },
          { units: 4, activation: "softmax" },
        ]);
        break;
      }
      default: {
        console.error("Error, opción no permitida");
      }
    }
    return () => {
      tfvis.visor().close();
    };
  }, [dataset_key, t]);

  // region Dataset
  const handleChange_FileUpload_CSV = async (files, _event) => {
    if (files.length !== 1) {
      console.error(t("error.load-json-csv"));
      return;
    }
    try {
      const file_csv = new File([files[0]], files[0].name, { type: files[0].type });
      dfd.readCSV(file_csv).then((_dataframe) => {
        setDataframeOriginal(_dataframe);
        setObjectToPredict({});
      });
      await alertHelper.alertSuccess(t("alert.file-upload-success"));
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange_FileUpload_CSV_reject = async (_files, _event) => {
    await alertHelper.alertError(t("alert.file-upload-error-incorrect-format"));
  };
  // endregion

  // region Layers
  const handlerClick_AddLayer_Start = async () => {
    if (layers.length < 10) {
      setLayers(oldLayers => [{
        units     : 10,
        activation: "sigmoid",
      }, ...oldLayers]);
    } else {
      await alertHelper.alertWarning(t("alert.0-tabular-classification.not-more-layers"));
    }
  };

  const handlerClick_AddLayer_End = async () => {
    if (layers.length < 10) {
      let units = customDataSet_JSON?.classes?.length ?? 10;
      if (units === 0) units = 1;
      setLayers(oldLayers => [...oldLayers, {
        units     : units,
        activation: "softmax",
      }]);
    } else {
      await alertHelper.alertWarning("No se pueden añadir más capas");
    }
  };

  const handlerClick_RemoveLayer = async (_idLayer) => {
    const newArray = layers.filter((item, index) => (index !== _idLayer));
    setLayers(newArray);
  };

  const handleChange_Layer = async (_idLayer, _updateLayer) => {
    const newLayers = layers.map((item, index) => {
      if (_idLayer === index) return { units: _updateLayer.units, activation: _updateLayer.activation };
      return { units: item.units, activation: item.activation };
    });
    setLayers(newLayers);
  };
  // endregion

  // region Parameters

  // endregion

  // region Model
  const handleSubmit_CreateModel = async (event) => {
    event.preventDefault();
    console.debug("ID Conjunto de datos: ", { dataset });
    if (customDataSet_JSON === null) {
      await alertHelper.alertError(t("error.need-dataset"));
      return;
    }

    const last_layer_units = layers[layers.length - 1].units ?? 0;
    const classes_length = customDataSet_JSON?.classes?.length ?? 0;

    if (last_layer_units !== classes_length) {
      await alertHelper.alertWarning(t("error.tensor-shape"),
        {
          footer: "",
          text  : "",
          html  : <Trans i18nKey={"error.tensor-shape-change"}
                         values={{
                           last_layer_units: last_layer_units,
                           classes_length  : classes_length,
                         }} />,
        },
      );
      return;
    }

    try {
      setIsTraining(true);
      let _learningRate = learningRate / 100;
      let _numberOfEpoch = numberEpochs;
      let _testSize = testSize / 100;
      let _layerList = layers;

      let _customDataset_JSON = customDataSet_JSON;
      let _idOptimizer = idOptimizer;
      let _idLoss = idLoss;
      let _idMetrics = idMetrics;

      const [model, TARGET_SET_CLASSES, DATA_SET_CLASSES] = await createTabularClassificationCustomDataSet({
        learningRate : _learningRate,
        numberOfEpoch: _numberOfEpoch,
        testSize     : _testSize,
        layerList    : _layerList,
        dataset_JSON : _customDataset_JSON,
        idOptimizer  : _idOptimizer,
        idLoss       : _idLoss,
        idMetrics    : _idMetrics,
      }, t);
      setGeneratedModels(oldArray => [
        ...oldArray.map((oldModel) => {
          return { ...oldModel, isLoad: false };
        }), {
          idMODEL           : oldArray.length,
          isLoad            : true,
          model             : model,
          TARGET_SET_CLASSES: TARGET_SET_CLASSES,
          DATA_SET_CLASSES  : DATA_SET_CLASSES,
          learningRate      : _learningRate,
          testSize          : _testSize,
          numberOfEpoch     : _numberOfEpoch,
          layerList         : JSON.parse(JSON.stringify(_layerList)),
          idOptimizer       : _idOptimizer,
          idLoss            : _idLoss,
          idMetrics         : _idMetrics,
        }],
      );
      setIsTraining(false);
      setIsDisabledDownloadModel(false);
      setDataSetClasses(DATA_SET_CLASSES);
      setTargetSetClasses(TARGET_SET_CLASSES);

      setModel(model);
      await alertHelper.alertSuccess(t("alert.model-train-success"));
    } catch (error) {
      console.error(error);
    } finally {
      setIsTraining(false);
    }
  };

  // TODO
  // Create model Upload
  const handleSubmit_CreateModel_upload = async (event) => {
    event.preventDefault();
    try {
      setIsTraining(true);

      let _learningRate = learningRate / 100;
      let _testSize = testSize / 100;
      let _numberOfEpoch = numberEpochs;
      let _layers = layers;
      let _idOptimizer = idOptimizer;
      let _idLoss = idLoss;
      let _idMetrics = idMetrics;
      const model = await createTabularClassificationCustomDataSet_upload({
        learningRate : _learningRate,
        testSize     : _testSize,
        numberOfEpoch: _numberOfEpoch,
        layerList    : JSON.parse(JSON.stringify(_layers)),
        idOptimizer  : _idOptimizer,
        idLoss       : _idLoss,
        idMetrics    : _idMetrics,
        dataProcessed: dataProcessed,
      }, t);

      setModel(model);
      setGeneratedModels(oldArray => {
          return [
            // Old elements
            ...oldArray.map((oldModel) => {
              return { ...oldModel, isLoad: false };
            }),
            // New element
            {
              idMODEL      : generatedModels.length,
              isLoad       : true,
              model        : model,
              learningRate : _learningRate,
              testSize     : _testSize,
              numberOfEpoch: _numberOfEpoch,
              layerList    : JSON.parse(JSON.stringify(_layers)),
              idOptimizer  : _idOptimizer,
              idLoss       : _idLoss,
              idMetrics    : _idMetrics,
              dataProcessed: dataProcessed,
            },
          ];
        },
      );
      setGeneratedModelsIndex(generatedModels.length);

    } catch (error) {
      console.error(error);
      if (errorUtils.isErrorTargetExpected(error.message)) {
        const match = errorUtils.matchErrorTargetExpected(error.message);
        const error_params = {
          tensor_shape_0       : match.tensor_shape_0,
          tensor_shape_1       : match.tensor_shape_1,
          target_tensor_shape_0: match.target_tensor_shape_0,
          target_tensor_shape_1: match.target_tensor_shape_1,
        };
        const error_message = t("error.tensor-shape-description", error_params);
        await alertHelper.alertError(error_message, { title: "Error" });
      } else {
        await alertHelper.alertError(error.message, { title: "Error" });
      }
    } finally {
      setIsTraining(false);
    }
  };

  const handleClick_LoadGeneratedModel = ({ model, idMODEL }) => {
    const newList = generatedModels.map((item) => {
      if (item.idMODEL === idMODEL) {
        return { ...item, isLoad: true };
      }
      return { ...item, isLoad: false };
    });
    setGeneratedModelsIndex(idMODEL - 1);
    setGeneratedModels(newList);
    setModel(model);
  };

  const handleClick_DownloadGeneratedModel = ({ model, idMODEL }) => {
    model.save("downloads://my-model-" + idMODEL);
  };

  const handleClick_DownloadLastModel = () => {
    Model.save("downloads://my-model");
  };
  // endregion

  // region Prediction
  // TODO Prediction Upload
  const handleClick_PredictVector_upload = async () => {
    const currentDataProcessed = generatedModels[generatedModelsIndex].dataProcessed;
    const currentObjEncoder = currentDataProcessed.obj_encoder;
    const columnNameTarget = currentDataProcessed.column_name_target;
    // Seleccionamos el escalador MinMaxScaler o StandardScaler
    const currentScaler = currentDataProcessed.scaler;
    // Seleccionamos el modelo cargado
    const currentModel = generatedModels[generatedModelsIndex].model;


    const objectToPredict_dataframe_format = {};
    for (const [name, value] of Object.entries(objectToPredict)) {
      objectToPredict_dataframe_format[name] = [value];
    }
    const tempDataFrame = new dfd.DataFrame(objectToPredict_dataframe_format);


    // Escalamos los datos a predecir en función del escalador del preprocesamiento
    const scaledData = currentScaler.transform(tempDataFrame.values[0]);
    // Realizamos la predicción
    const tensor_input = tf.tensor2d([scaledData]);
    const prediction = currentModel.predict(tensor_input);
    // const predictionWithArgMax = prediction.argMax(-1).dataSync();
    const predictionArraySync = prediction.arraySync()[0];
    const labels = currentDataProcessed.classes.map(({ name }) => {
      return name;
    });
    const list_encoded_classes = currentDataProcessed.classes.map(({ name }, index) => {
      const class_target_id = currentObjEncoder[columnNameTarget].$labels[name].toString()
      return <Trans key={index}
                    i18nKey="pages.playground.0-tabular-classification.generator.prediction.class_id_name"
                    values={{ name, class_target_id }} />
    });

    setPredictionBar((old) => {
      return {
        list_encoded_classes: [...list_encoded_classes],
        labels              : [...labels],
        data                : [...predictionArraySync],
      };
    });

    if (!isProduction()) console.debug("Predicción", { prediction, predictionArraySync, wtf: prediction.arraySync() });
    const text = predictionArraySync.map(item => {
      const float = parseFloat(item * 100);
      return float.toFixed(2);
    }).join(", ");
    await alertHelper.alertSuccess(t("prediction"), { text });
  };

  const handleClick_PredictVector = async () => {
    if (dataset_key === MODEL_UPLOAD) {
      if (customDataSet_JSON === null) {
        await alertHelper.alertError("Primero debes de cargar un dataset");
        return;
      }
    }
    if (Model === undefined) {
      await alertHelper.alertError("Primero debes de entrenar el modelo");
      return;
    }
    let dataset_JSON = null;
    let input = [[], [1, stringToPredict.split(";").length]];
    try {
      switch (dataset_key) {
        case MODEL_UPLOAD: {
          dataset_JSON = customDataSet_JSON;
          break;
        }
        case MODEL_CAR.KEY: {
          dataset_JSON = json_cars;
          break;
        }
        case MODEL_IRIS.KEY: {
          dataset_JSON = json_iris;
          break;
        }
        case MODEL_LYMPHOGRAPHY.KEY: {
          dataset_JSON = json_lymphatics;
          break;
        }
        default: {
          console.error("Error, opción no permitida");
          return;
        }
      }
      if (!isProduction()) console.debug("Dataset_JSON", { dataset_JSON });
      if (!isProduction()) console.debug("stringToPredict", { stringToPredict: stringToPredict.split(";") });

      let i = 0;
      for (const element of stringToPredict.split(";")) {
        if (!isProduction()) console.debug("Attribute: ", dataset_JSON.attributes[i]);
        let name = dataset_JSON?.attributes[i].name;
        let type = dataset_JSON?.attributes[i].type;

        let input_number = undefined;
        let input_float = undefined;
        let input_select = undefined;
        switch (type) {
          case "int32": {
            input_number = DataSetClasses[i].get(parseInt(element));
            break;
          }
          case "float32": {
            input_float = parseFloat(element);
            //DataSetClasses[i].get(parseFloat(element))
            break;
          }
          case "string":
          case "label-encoder": {
            input_select = DataSetClasses[i].get(element);
            input_select = input_select ?? DataSetClasses[i].get(parseInt(element));
            break;
          }
          default: {
            console.warn("Tipo de dato desconocido");
            break;
          }
        }
        // Bug: 0||undefined||undefined
        let new_input = (input_number || input_float || input_select) ?? 0;
        input[0].push(new_input);
        if (!isProduction()) console.debug("By column:", name, { element: element, type: type }, [input_number, input_float, input_select], new_input);
        i++;
      }

      if (input[0].some((tag) => tag === undefined)) {
        await alertHelper.alertInfo("Valor indefinido", "Error, input no válido");
        return;
      }

      const tensor = tf.tensor2d(input[0], input[1]);
      const prediction = Model.predict(tensor);
      const predictionWithArgMax = prediction.argMax(-1).dataSync();
      // const predictionArraySync = prediction.arraySync();

      const prediction_class_name = customDataSet_JSON.classes.find((item) => {
        if (isFinite(TargetSetClasses[predictionWithArgMax]))
          return parseInt(item.key) === TargetSetClasses[predictionWithArgMax];
        else
          return item.key === TargetSetClasses[predictionWithArgMax];
      });
      const list_encoded_classes = customDataSet_JSON.classes.map(({ name }) => name);
      if (!isProduction()) console.info("DataSetClasses: ", { DataSetClasses }, ...input[0]);
      if (!isProduction()) console.info("La solución es: ", { prediction, predictionWithArgMax, TargetSetClasses, prediction_class_name });
      if (prediction_class_name !== undefined) {
        await alertHelper.alertInfo(
          "" + prediction_class_name.key,
          "" + prediction_class_name.name,
        );
        setPredictionBar({
          list_encoded_classes: list_encoded_classes,
          labels              : [],
          data                : []
        })
      } else {
        await alertHelper.alertInfo(
          "Tipo: " + TargetSetClasses[predictionWithArgMax],
          `` + TargetSetClasses[predictionWithArgMax],
        );
      }

    } catch (error) {
      console.error(error);
    }
  };
  // endregion

  // Comprueba si se han ejecutado los pasos previos
  const canRender_DynamicFormDataset = () => {
    if (dataset_key === MODEL_UPLOAD) {
      return (customDataSet_JSON || dataProcessed) && Model;
    } else {
      return (customDataSet_JSON) && Model;
    }
  };

  console.debug("render TabularClassificationCustomDataset");
  return (
    <>
      <Container className={"mb-3"}>
        <Row>
          <Col xl={12} className={"mt-3"}>
            <Accordion defaultActiveKey={dataset_key === MODEL_UPLOAD ? "description_dataset" : ""}>
              <Accordion.Item key={"0"} eventKey={"description_architecture_editor"}>
                <Accordion.Header>
                  <h3><Trans i18nKey={prefix + "manual.title"} /></h3>
                </Accordion.Header>
                <Accordion.Body>
                  {/* TabularClassificationCustomDatasetManual */}
                  <TabularClassificationManual />

                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item key={"1"} eventKey={"description_dataset"}>
                <Accordion.Header>
                  <h3>
                    <Trans i18nKey={dataset !== "0" ? modelInfo.TITLE : prefix + "dataset.upload-dataset"} />
                  </h3>
                </Accordion.Header>
                <Accordion.Body>
                  {{
                    "0": <>
                      <DragAndDrop name={"csv"}
                                   accept={{ "text/csv": [".csv"] }}
                                   text={t("drag-and-drop.csv")}
                                   labelFiles={t("drag-and-drop.label-files-one")}
                                   function_DropAccepted={handleChange_FileUpload_CSV}
                                   function_DropRejected={handleChange_FileUpload_CSV_reject} />

                      {dataframeOriginal && <>
                        <TabularClassificationForm dataframeOriginal={dataframeOriginal}
                                                   dataProcessed={dataProcessed}
                                                   setDataProcessed={setDataProcessed}
                                                   setIsDatasetProcessed={setIsDatasetProcessed}
                                                   setCustomDataSet_JSON={setCustomDataSet_JSON}
                                                   setLayers={setLayers} />
                      </>}

                    </>,
                  }[dataset]}
                  {dataset !== "0" ? (
                    modelInfo.DESCRIPTION()
                  ) : ("")}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>

          <Col xl={12} className={"mt-3"}>
            <Card>
              <Card.Header>
                <h3 className={"d-flex align-items-baseline"}>
                  <Trans i18nKey={prefix + "dataset.title"} />
                  {!customDataSet_JSON && <>
                    <div className="ms-4 spinner-border"
                         role="status"
                         style={{
                           fontSize                      : "0.5em",
                           height                        : "1rem",
                           width                         : "1rem",
                           "--bs-spinner-animation-speed": "1.5s",
                         }}>
                      <span className="sr-only"></span>
                    </div>
                  </>}
                </h3>
              </Card.Header>
              <Card.Body className={"overflow-x-scroll"}>

                {customDataSet_JSON &&
                  <>
                    <N4LTablePagination data_head={[...customDataSet_JSON.attributes.map((i) => i.name), "Target"]}
                                        data_body={customDataSet_JSON.data} />

                    <hr />

                    <details>
                      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "dataset.attributes.title"} /></summary>
                      <main>
                        <Row>
                          {customDataSet_JSON.attributes.map((item, i1) => {
                            return <Col lg={2} md={2} sm={3} xs={3} key={i1}>
                              <p><b>{item.name}</b></p>
                              {item.type === "int32" && <p><Trans i18nKey={prefix + "dataset.attributes.int32"} /></p>}
                              {item.type === "float32" && <p><Trans i18nKey={prefix + "dataset.attributes.float32"} /></p>}
                              {item.type === "label-encoder" && <ol start="0">{item.options.map((option, i2) => <li key={i1 + "_" + i2}>{option.text}</li>)}</ol>}
                            </Col>;
                          })}
                        </Row>
                      </main>
                    </details>
                    <details>
                      <summary className={"n4l-summary"}><Trans i18nKey={prefix + "dataset.attributes.classes"} /></summary>
                      <main>
                        <div className="n4l-list">
                          <ol start="0">{customDataSet_JSON.classes.map((item, index) => (<li key={"_" + index}>{item.name}</li>))}</ol>
                        </div>
                      </main>
                    </details>
                  </>
                }
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Form id={"TabularClassificationCustomDataset"} onSubmit={dataset_key === MODEL_UPLOAD ? handleSubmit_CreateModel_upload : handleSubmit_CreateModel}>
        <Container>
          {/* BLOCK 1 */}
          <Row className={"mt-3"}>
            <Col xl={12}>
              <Card>
                <Card.Header>
                  <h3><Trans i18nKey={prefix + "layers.title"} /></h3>
                </Card.Header>
                <Card.Body>
                  <GraphicRed layer={layers}
                              tipo={0} />
                  <Card.Text className={"text-muted text-center"}>
                    <Trans i18nKey={prefix + "layers.page-info"}
                           components={{
                             link1: <a href="https://netron.app/">Text</a>,
                           }} />
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            {/* SPECIFIC PARAMETERS */}
            <Col className={"mt-3"} xl={6}>
              {/* ADD LAYER */}
              <Card>
                <Card.Header className={"d-flex align-items-center justify-content-between"}>
                  <h3><Trans i18nKey={prefix + "editor-layers.title"} /></h3>
                  <div className={"d-flex"}>
                    <Button onClick={() => handlerClick_AddLayer_Start()}
                            size={"sm"}
                            variant="outline-primary">
                      <Trans i18nKey={prefix + "editor-layers.add-layer-start"} />
                    </Button>
                    <Button onClick={() => handlerClick_AddLayer_End()}
                            size={"sm"}
                            variant="outline-primary"
                            className={"ms-3"}>
                      <Trans i18nKey={prefix + "editor-layers.add-layer-end"} />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Accordion>
                    {layers.map((item, index) => {
                      return (
                        <Accordion.Item key={index} eventKey={index.toString()}>
                          <Accordion.Header>
                            <Trans i18nKey={prefix + "editor-layers.layer-id"} values={{ value: index + 1 }} />
                          </Accordion.Header>

                          <Accordion.Body>
                            <div className="d-grid gap-2">
                              <Button onClick={() => handlerClick_RemoveLayer(index)}
                                      variant={"outline-danger"}>
                                <Trans i18nKey={prefix + "editor-layers.delete-layer"} values={{ value: index + 1 }} />
                              </Button>
                            </div>
                            {/* UNITS */}
                            <Form.Group className="mt-3"
                                        controlId={"formUnitsLayer" + index}>
                              <Form.Label>
                                <Trans i18nKey={prefix + "editor-layers.units"} />
                              </Form.Label>
                              <Form.Control type="number"
                                            min={1} max={200}
                                            placeholder={t(prefix + "editor-layers.units-placeholder")}
                                            value={item.units}
                                            onChange={(e) => handleChange_Layer(index, {
                                              units     : parseInt(e.target.value),
                                              activation: item.activation,
                                            })} />
                            </Form.Group>
                            {/* ACTIVATION FUNCTION */}
                            <Form.Group className="m3-3"
                                        controlId={"formActivationLayer" + index}>
                              <Form.Label>
                                <Trans i18nKey={prefix + "editor-layers.activation-function-select"} />
                              </Form.Label>
                              <Form.Select aria-label={"Default select example: " + item.activation}
                                           value={item.activation}
                                           onChange={(e) => handleChange_Layer(index, {
                                             units     : item.units,
                                             activation: e.target.value,
                                           })}>
                                {TYPE_ACTIVATION.map(({ key, label }, index) => {
                                  return (<option key={index} value={key}>{label}</option>);
                                })}
                              </Form.Select>
                              <Form.Text className="text-muted">
                                <Trans i18nKey={prefix + "editor-layers.activation-function-info"} />
                              </Form.Text>
                            </Form.Group>
                          </Accordion.Body>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion>
                </Card.Body>
              </Card>
            </Col>

            {/* GENERAL PARAMETERS */}
            <Col className={"mt-3"} xl={6}>
              <Card className={"sticky-top"} style={{ zIndex: 10 }}>
                <Card.Header><h3><Trans i18nKey={prefix + "general-parameters.title"} /></h3></Card.Header>
                <Card.Body>
                  {/* LEARNING RATE */}
                  <Form.Group className="mb-3" controlId="formTrainRate">
                    <Form.Label>
                      <Trans i18nKey={prefix + "general-parameters.learning-rate"} />
                    </Form.Label>
                    <Form.Control type="number"
                                  min={1} max={100}
                                  placeholder={t(prefix + "general-parameters.learning-rate-placeholder")}
                                  defaultValue={DEFAULT_LEARNING_RATE}
                                  onChange={(e) => setLearningRate(parseInt(e.target.value))} />
                    <Form.Text className="text-muted">
                      <Trans i18nKey={prefix + "general-parameters.learning-rate-info"} />
                    </Form.Text>
                  </Form.Group>

                  {/* Número OT ITERATIONS */}
                  <Form.Group className="mb-3" controlId="FormNumberOfEpochs">
                    <Form.Label>
                      <Trans i18nKey={prefix + "general-parameters.number-of-epochs"} />
                    </Form.Label>
                    <Form.Control type="number"
                                  min={1} max={100}
                                  placeholder={t(prefix + "general-parameters.number-of-epochs")}
                                  defaultValue={DEFAULT_NUMBER_EPOCHS}
                                  onChange={(e) => setNumberEpochs(parseInt(e.target.value))} />
                    <Form.Text className="text-muted">
                      <Trans i18nKey={prefix + "general-parameters.number-of-epochs-info"} />
                    </Form.Text>
                  </Form.Group>

                  {/* TEST SIZE */}
                  <Form.Group className="mb-3" controlId="formTrainRate">
                    <Form.Label>
                      <Trans i18nKey={prefix + "general-parameters.train-rate"} />
                    </Form.Label>
                    <Form.Control type="number"
                                  min={1} max={100}
                                  placeholder={t(prefix + "general-parameters.train-rate-placeholder")}
                                  defaultValue={DEFAULT_TEST_SIZE}
                                  onChange={(e) => setTestSize(parseInt(e.target.value))} />
                    <Form.Text className="text-muted">
                      <Trans i18nKey={prefix + "general-parameters.train-rate-info"} />
                    </Form.Text>
                  </Form.Group>

                  {/* OPTIMIZATION FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormOptimizer">
                    <Form.Label>
                      <Trans i18nKey={prefix + "general-parameters.optimizer-id"} />
                    </Form.Label>
                    <Form.Select aria-label="Default select example"
                                 defaultValue={DEFAULT_ID_OPTIMIZATION}
                                 onChange={(e) => setIdOptimizer(e.target.value)}>
                      {TYPE_OPTIMIZER.map(({ key, label }, index) => {
                        return (<option key={index} value={key}>{label}</option>);
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      <Trans i18nKey={prefix + "general-parameters.optimizer-id-info"} />
                    </Form.Text>
                  </Form.Group>

                  {/* LOSS FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormLoss">
                    <Form.Label>
                      <Trans i18nKey={prefix + "general-parameters.loss-id"} />
                    </Form.Label>
                    <Form.Select aria-label="Selecciona la función de pérdida"
                                 defaultValue={DEFAULT_ID_LOSS}
                                 onChange={(e) => setIdLoss(e.target.value)}>
                      <optgroup label={"Losses"}>
                        {TYPE_LOSSES.map(({ key, label }, index) => {
                          return (<option key={index} value={"losses-" + key}>{label}</option>);
                        })}
                      </optgroup>
                      <optgroup label={"Metrics"}>
                        {TYPE_METRICS.map(({ key, label }, index) => {
                          return (<option key={index} value={"metrics-" + key}>{label}</option>);
                        })}
                      </optgroup>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      <Trans i18nKey={prefix + "general-parameters.loss-id-info"} />
                    </Form.Text>
                  </Form.Group>

                  {/* METRICS FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormMetrics">
                    <Form.Label>
                      <Trans i18nKey={prefix + "general-parameters.metrics-id"} />
                    </Form.Label>
                    <Form.Select aria-label="Selecciona la métrica"
                                 defaultValue={DEFAULT_ID_METRICS}
                                 onChange={(e) => setIdMetrics(e.target.value)}>
                      {TYPE_METRICS.map(({ key, label }, index) => {
                        return (<option key={index} value={key}>{label}</option>);
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      <Trans i18nKey={prefix + "general-parameters.metrics-id-info"} />
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* BLOCK  BUTTON SUBMIT */}
          <Row className={"mt-3"}>
            <Col xl={12}>
              <div className="d-grid gap-2">
                <Button type="submit"
                        disabled={isTraining || !isDatasetProcessed}
                        size={"lg"}
                        variant="primary">
                  <Trans i18nKey={prefix + "models.button-submit"} />
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </Form>

      {/* SALIDA */}
      <Container>
        <Row className={"mt-3"}>
          <Col xl={12}>
            <Card>
              <Card.Header className={"d-flex align-items-center"}>
                <h3><Trans i18nKey={prefix + "models.title"} /> | {generatedModelsIndex + 1}</h3>
                <div className={"d-flex"}>
                  <Button variant={"outline-primary"}
                          className={"ms-3"}
                          size={"sm"}
                          onClick={() => {
                            tfvis.visor().open();
                          }}>
                    <Trans i18nKey={prefix + "models.open-visor"} />
                  </Button>
                  <Button variant={"outline-primary"}
                          className={"ms-1"}
                          size={"sm"}
                          onClick={() => {
                            tfvis.visor().close();
                          }}>
                    <Trans i18nKey={prefix + "models.close-visor"} />
                  </Button>
                  {(Model !== undefined) &&
                    <Button className={"ms-1"}
                            disabled={isDisabledDownloadModel}
                            onClick={() => handleClick_DownloadLastModel()}
                            size={"sm"}
                            variant="outline-primary">
                      <Trans i18nKey={prefix + "models.export-current-model"} />
                    </Button>
                  }
                </div>
              </Card.Header>
              <Card.Body className={"overflow-x-scroll"}>
                <Table size={"sm"}>
                  <thead>
                  <tr>
                    <th><Trans i18nKey={prefix + "table.id"} /></th>
                    <th><Trans i18nKey={prefix + "table.load"} /></th>
                    <th><Trans i18nKey={prefix + "table.learning-rate"} /></th>
                    <th><Trans i18nKey={prefix + "table.number-of-epochs"} /></th>
                    <th><Trans i18nKey={prefix + "table.train-rate"} /></th>
                    <th><Trans i18nKey={prefix + "table.layers"} /></th>
                    <th><Trans i18nKey={prefix + "table.optimizer-id"} /></th>
                    <th><Trans i18nKey={prefix + "table.loss-id"} /></th>
                    <th><Trans i18nKey={prefix + "table.metric-id"} /></th>
                    <th><Trans i18nKey={prefix + "table.download"} /></th>
                  </tr>
                  </thead>
                  <tbody>
                  {generatedModels.map((value, index) => {
                    return (
                      <tr key={"model_list_row_" + index}>
                        <td>{value.idMODEL + 1}</td>
                        <td>
                          <Button variant={value.isLoad ? "outline-success" : "outline-info"}
                                  size={"sm"}
                                  disabled={value.isLoad}
                                  onClick={() => handleClick_LoadGeneratedModel(value)}>
                            {value.isLoad ? "Cargado" : "Cargar"}
                          </Button>
                        </td>
                        <td>{value.learningRate * 100}%</td>
                        <td>{value.numberOfEpoch}</td>
                        <td>{value.testSize * 100}%</td>
                        <td>
                          {value.layerList.map((value, index) => {
                            return (
                              <span key={index} style={{ fontFamily: "monospace" }}>
                                  <small>{value.units.toString().padStart(2, "0")} - {value.activation}</small><br />
                                </span>
                            );
                          })}
                        </td>
                        <td>{value.idOptimizer}</td>
                        <td>{value.idLoss}</td>
                        <td>{value.idMetrics}</td>
                        <td>
                          <Button variant={"outline-primary"}
                                  size={"sm"}
                                  onClick={() => handleClick_DownloadGeneratedModel(value)}>
                            <Trans i18nKey={prefix + "table.download"} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </Table>

                {isTraining ?
                  <p className="placeholder-glow">
                    <span className="placeholder col-12"></span>
                  </p>
                  :
                  <></>
                }

                <div id="salida"></div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Prediction */}
      {canRender_DynamicFormDataset() &&
        (<TabularClassificationPredictionDynamicForm dataset_JSON={customDataSet_JSON}
                                                     dataset={dataset}
                                                     dataset_key={dataset_key}
                                                     stringToPredict={stringToPredict}
                                                     setStringToPredict={setStringToPredict}
                                                     objectToPredict={objectToPredict}
                                                     setObjectToPredict={setObjectToPredict}
                                                     predictionBar={predictionBar}
                                                     handleClick_PredictVector={dataset_key === MODEL_UPLOAD ? handleClick_PredictVector_upload : handleClick_PredictVector} />)
      }

      {isDebug &&
        <Container>
          <Row>
            <Col>
              <Card className={"mt-3"}>
                <Card.Header className={"d-flex align-items-center justify-content-between"}>
                  <h3>Debug</h3>
                  <div className="d-flex">
                    <Button onClick={() => debug()}
                            className={"ms-3"}
                            size={"sm"}
                            variant={"outline-primary"}>
                      Debug
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Button onClick={() => handleClick_PredictVector_upload()}
                          className={"ms-3"}
                          size={"sm"}
                          variant={"outline-primary"}>
                    Debug Prediction
                  </Button>
                  <div id="plot_div"></div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      }
    </>
  );
}
