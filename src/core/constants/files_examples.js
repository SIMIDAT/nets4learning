import json_iris from "./template_iris.json";
import json_lymphatcs from "./template_lymphatcs.json";

export const FILE_TEMPLATE = {
  title  : 'plantilla.json',
  content: `{
  "missing_values"   : false,
  "missing_value_key": "?",
  "classes"          : [ 
   { "key": "resultado_1", "name": "Clase 1" },
   { "key": "resultado_2", "name": "Clase 2" },
   { "key": "resultado_3", "name": "Clase 3" },
   { "key": "resultado_4", "name": "Clase 4" },
   { "key": "resultado_5", "name": "Clase 5" },
   { "key": "resultado_6", "name": "Clase 6" }
  ],
  "attributes"       : [
    { "name": "Atributo 1", "index_column": 0, "type": "int32" },
    { "name": "Atributo 2", "index_column": 1, "type": "float32"  },
    { "name": "Atributo 3", "index_column": 2, "type": "float32"  },
    { 
      "name"        : "Atributo m", 
      "index_column": 3,
      "type"        : "label-encoder", 
      "options"     : [ 
        { "value": "option_1", "text": "Opción 1" }, 
        { "value": "option_2", "text": "Opción 2" } 
      ]
    }
  ],
  "header"           : ["Atributo 1", "Atributo 2", "Atributo m", "clase"],
  "data"             : [
    ["dato_entero_01", "dato_decimal_02", "dato_decimal_04", "option_1", "resultado_1"],
    ["dato_entero_11", "dato_decimal_12", "dato_decimal_14", "option_1", "resultado_2"],
    ["dato_entero_21", "dato_decimal_22", "dato_decimal_24", "option_1", "resultado_3"],
    ["dato_entero_31", "dato_decimal_32", "dato_decimal_34", "option_2", "resultado_4"],
    ["dato_entero_41", "dato_decimal_42", "dato_decimal_44", "option_2", "resultado_5"],
    ["dato_entero_51", "dato_decimal_52", "dato_decimal_54", "option_2", "resultado_6"]
  ]
}`
}
export const FILE_TOPOLOGY = {
  title  : 'my-model.json',
  content: `{
  "modelTopology": {
    "class_name": "Sequential",
    "config": {
      "name": "sequential_1",
      "layers": [
        {
          "class_name": "Dense",
          "config": {
            "units": 10,
            "activation": "sigmoid",
            "use_bias": true,
            "kernel_initializer": {
              "class_name": "VarianceScaling",
              "config": {
                "scale": 1,
                "mode": "fan_avg",
                "distribution": "normal",
                "seed": null
              }
            },
            "bias_initializer": { "class_name": "Zeros", "config": {} },
            "kernel_regularizer": null,
            "bias_regularizer": null,
            "activity_regularizer": null,
            "kernel_constraint": null,
            "bias_constraint": null,
            "name": "dense_Dense1",
            "trainable": true,
            "batch_input_shape": [null, 4],
            "dtype": "float32"
          }
        },
        {
          "class_name": "Dense",
          "config": {
            "units": 3,
            "activation": "softmax",
            "use_bias": true,
            "kernel_initializer": {
              "class_name": "VarianceScaling",
              "config": {
                "scale": 1,
                "mode": "fan_avg",
                "distribution": "normal",
                "seed": null
              }
            },
            "bias_initializer": { "class_name": "Zeros", "config": {} },
            "kernel_regularizer": null,
            "bias_regularizer": null,
            "activity_regularizer": null,
            "kernel_constraint": null,
            "bias_constraint": null,
            "name": "dense_Dense2",
            "trainable": true
          }
        }
      ]
    },
    "keras_version": "tfjs-layers 3.14.0",
    "backend": "tensor_flow.js"
  },
  "format": "layers-model",
  "generatedBy": "TensorFlow.js tfjs-layers v3.14.0",
  "convertedBy": null,
  "weightsManifest": [
    {
      "paths": ["./my-model.weights.bin"],
      "weights": [
        { "name": "dense_Dense1/kernel", "shape": [4, 10], "dtype": "float32" },
        { "name": "dense_Dense1/bias", "shape": [10], "dtype": "float32" },
        { "name": "dense_Dense2/kernel", "shape": [10, 3], "dtype": "float32" },
        { "name": "dense_Dense2/bias", "shape": [3], "dtype": "float32" }
      ]
    }
  ]
}`
}

export const FILE_TEMPLATE_IRIS = {
  title  : 'plantilla_iris.json',
  content: JSON.stringify(json_iris)
}
export const FILE_TEMPLATE_LYMPHATCS = {
  title  : 'plantilla_lymphatcs.json',
  content: JSON.stringify(json_lymphatcs)
}