import * as tf from "@tensorflow/tfjs";
import * as dfd from "danfojs";


export function transform_datasetJSON_To_DataFrame(dataset_JSON) {
  const data_parsed = dataset_JSON.data.map((row) => {
    return row.map((item) => {
      if (dataset_JSON?.missing_value_key === item) return NaN
      else return item
    })
  })
  const columns_number = dataset_JSON.attributes.filter(({ type }) => {
    return type === "int32";
  })
  const columns_float = dataset_JSON.attributes.filter(({ type }) => {
    return type === "float32";
  })
  const columns_select = dataset_JSON.attributes.filter(({ type }) => {
    return type === "string";
  })
  let df = new dfd.DataFrame(data_parsed)

  console.log({ columns_number, columns_float, columns_select })
  console.log({ data_parsed, df })

  for (const column of columns_number) {
    let index_column = column?.index_column.toString()
    let value_to_fill = parseInt(df[index_column].median())
    df = df.fillNa(value_to_fill, { columns: [index_column] })
  }
  for (const column of columns_float) {
    let index_column = column?.index_column.toString()
    let value_to_fill = df[index_column].median()
    df = df.fillNa(value_to_fill, { columns: [index_column] })
  }

  let encoder = new dfd.LabelEncoder()

  columns_select.forEach((col) => {
    let index_column = col?.index_column.toString()

    encoder.fit(df[index_column])
    let enc_val = encoder.transform(df[index_column])
    df.addColumn(index_column, enc_val, { inplace: true })
  })

  console.log("ENCODER", { df })


  return df
}

export function convertToTensorsDataFrame(df, dataset_JSON) {


  return []
}

export function getClassesFromDataSet(dataset_JSON) {
  try {

    let data = []
    const num_attributes = dataset_JSON.attributes.length
    for (let i = 0; i <= num_attributes; i++) {
      data.push([])
    }

    for (const array of dataset_JSON.data) {
      for (let index = 0; index <= num_attributes; index++) {
        data[index].push(array[index])
      }
    }

    // Pasamos los atributos a identificadores
    // Por columna (atributo) vamos Mapa con K = el valor del atributo y V = ID del atributo
    const Array_MAPS_WITH_INDEX = []
    for (let i = 0; i <= num_attributes; i++) {
      const mySet = new Set(data[i])
      let map = new Map()
      let j = 0
      for (const [element] of mySet.entries()) {
        map.set(element, j)
        j++
      }
      Array_MAPS_WITH_INDEX.push(map)
    }

    data = []
    for (const array of dataset_JSON.data) {
      let aux = []
      for (let index = 0; index <= num_attributes; index++) {
        aux.push(Array_MAPS_WITH_INDEX[index].get(array[index]))
      }
      data.push(aux)
    }

    const list_targets = []
    for (let val of Array_MAPS_WITH_INDEX[num_attributes].keys()) {
      list_targets.push(val)
    }
    return [data, list_targets, Array_MAPS_WITH_INDEX]
  } catch (error) {
    console.error(error)
  }
}

function convertToTensors(data, targets, testSize, numClasses) {
  const numExamples = data.length;
  if (numExamples !== targets.length) {
    throw new Error('data and split have different numbers of examples');
  }

  // Randomly shuffle `data` and `targets`.
  const indices = [];
  for (let i = 0; i < numExamples; ++i) {
    indices.push(i);
  }
  tf.util.shuffle(indices);

  const shuffledData = [];
  const shuffledTargets = [];
  for (let i = 0; i < numExamples; ++i) {
    shuffledData.push(data[indices[i]]);
    shuffledTargets.push(targets[indices[i]]);
  }

  // Split the data into a training set and a tet set, based on `testSplit`.
  const numTestExamples = Math.round(numExamples * testSize);
  const numTrainExamples = numExamples - numTestExamples;

  const xDims = shuffledData[0].length;

  // Create a 2D `tf.Tensor` to hold the feature data.
  const xs = tf.tensor2d(shuffledData, [numExamples, xDims]);

  // Create a 1D `tf.Tensor` to hold the labels, and convert the number label
  // from the set {0, 1, 2} into one-hot encoding (.e.g., 0 --> [1, 0, 0]).
  const ys = tf.oneHot(tf.tensor1d(shuffledTargets).toInt(), numClasses);

  // Split the data into training and test sets, using `slice`.
  const xTrain = xs.slice([0, 0], [numTrainExamples, xDims]);
  const xTest = xs.slice([numTrainExamples, 0], [numTestExamples, xDims]);
  const yTrain = ys.slice([0, 0], [numTrainExamples, numClasses]);
  const yTest = ys.slice([0, 0], [numTestExamples, numClasses]);
  return [xTrain, yTrain, xTest, yTest];
}

export function trainTestSplit(data, classes, testSize) {

  return tf.tidy(() => {
    const dataByClass = [];
    const targetByClass = [];
    for (let i = 0; i < classes.length; i++) {
      dataByClass.push([]);
      targetByClass.push([]);
    }

    for (const example of data) {
      const target = example[example.length - 1];
      const data = example.slice(0, example.length - 1);
      dataByClass[target].push(data);
      targetByClass[target].push(target);
    }

    const xTrains = [], yTrains = [], xTests = [], yTests = [];
    for (let i = 0; i < classes.length; i++) {
      const [xTrain, yTrain, xTest, yTest] = convertToTensors(dataByClass[i], targetByClass[i], testSize, classes.length);
      xTrains.push(xTrain);
      yTrains.push(yTrain);
      xTests.push(xTest);
      yTests.push(yTest);
    }

    const concatAxis = 0;
    return [
      tf.concat(xTrains, concatAxis),
      tf.concat(yTrains, concatAxis),
      tf.concat(xTests, concatAxis),
      tf.concat(yTests, concatAxis),
    ];
  });
}