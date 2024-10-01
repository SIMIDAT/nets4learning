# DataFrameUtils

This is a list of utilities to easily pre-process a data set so that the data set can be prepared for a deep learning model.

---

## `DataFrameEncoder`

| Parameters | Type                                                                                  | Description | Default |
|------------|---------------------------------------------------------------------------------------|-------------|---------|
| dataframe  | `DataFrame`                                                                           |             |         |
| transforms | `Array<{column_name: string, column_transform:'label-encoder'\|'one-hot-encoder'}>`   |             |         |

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 *
 * @param {dfd.DataFrame} dataframe
 * @param {Array<{column_name: string, column_transform:'label-encoder'|'one-hot-encoder'}>} transforms
 * @return {EncoderMap_t}
 */
export function DataFrameEncoder (dataframe, transforms) {}
```

```js
const dataframe = await dfd.readCSV(dataset_path + 'DATASET.csv')
const transforms = [
  { column_transform: 'label-encoder', column_name: 'COLUMN_NAME' },
  { column_transform: 'label-encoder', column_name: 'COLUMN_NAME_TARGET' },
]
const encoders = DataFrameUtils.DataFrameEncoder(dataframe, transforms)
```

</details>

---

## `DataFrameTransform`

| Parameters | Type                                | Description | Default |
|------------|-------------------------------------|-------------|---------|
| dataframe  | `DataFrame`                         |             |         |
| transforms | `Array<DataFrameColumnTransform_t>` |             |         |

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 * @param {dfd.DataFrame} dataframe
 * @param {DataFrameColumnTransform_t[]} transforms
 * @return {dfd.DataFrame}
 */
export function DataFrameTransform (dataframe, transforms) {}
```

```js
let dataframe = await dfd.readCSV(dataset_path + 'DATASET.csv')
const transforms = [
  { column_transform: 'drop', column_name: 'COLUMN_NAME_1' },
  { column_transform: 'int32', column_name: 'COLUMN_NAME_2' },
  { column_transform: 'float32', column_name: 'COLUMN_NAME_3' },
  { column_transform: 'label-encoder', column_name: 'COLUMN_NAME_TARGET' },
]
dataframe = DataFrameUtils.DataFrameTransform(dataframe, transforms)

```

</details>

---

## `DataFrameApplyEncoders`

| Parameters | Type                   | Description | Default |
|------------|------------------------|-------------|---------|
| encoders   | `EncoderMap_t`         |             |         |
| values     | `Object.<string\|any>` |             |         |
| columns    | `Array<string>`        |             |         |

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 *
 * @param {EncoderMap_t} encoders
 * @param {Object.<string, int32|float32|string|boolean>} values
 * @param {string[]} columns
 * @returns {number[]}
 */
function DataFrameApplyEncoders (encoders, values, columns) {}
```

```js
const columns = [
  "COLUMN_NAME_1",
  "COLUMN_NAME_2"
]
const dataToPredict = {
  "COLUMN_NAME_1": 3,
  "COLUMN_NAME_2": 'COLUMN_2_VALUE',
}
const vectorValuesEncoders = DataFrameUtils.DataFrameApplyEncoders(encoders, dataToPredict, columns)

```

</details>

---

## `DataFrameApplyEncodersVector`

| Parameters | Type                    | Description | Default |
|------------|-------------------------|-------------|---------|
| encoders   | `EncoderMap_t`          |             |         |
| input      | `Array<string\|number>` |             |         |
| columns    | `Array<string>`         |             |         |

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 *
 * @param {EncoderMap_t} encoders
 * @param {Array<string|number>} input
 * @param {string[]} columns
 * @return {number[]}
 */
export function DataFrameApplyEncodersVector (encoders, input, columns) {}
```

```js
const columns = ['COLUMN_NAME_1', 'COLUMN_NAME_2', 'COLUMN_NAME_TARGET']
const inputDataToPredict = ['column_1_class_1', 3.3, "class_target_3"]
const inputVectorToPredict = DataFrameUtils.DataFrameApplyEncodersVector(encoders, inputDataToPredict, columns)
// [0, 3.3, 2]
```

</details>

---

## `@type {EncoderMap_t}`

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 * @typedef {Object} EncoderObject_t
 * @property {'label-encoder' | 'one-hot-encoder'} type
 * @property {dfd.LabelEncoder | dfd.OneHotEncoder} encoder
 */

/**
 * @typedef {Object.<string, EncoderObject_t>} EncoderMap_t
 */
```

</details>

---

## `@type {DataFrameColumnTransform_t}`

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 * @typedef {'one-hot-encoder'|'label-encoder'|'int32'|'float32'|'string'|'drop'|'dropNa'|'dropNa'|'ignored'|'replace_<match>_NaN'} Transform_t
 */

/**
 * @typedef DataFrameColumnTransform_t
 * @property {string}      column_name
 * @property {Transform_t} column_transform
 * @property {string} [match]
 */
```

</details>

---

## `DataFrameDeepCopy`

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 *
 * @param {dfd.DataFrame} dataframe
 * @return {dfd.DataFrame}
 */
export function DataFrameDeepCopy (dataframe): DataFrame {}
```

```js
const dataframe_original = await dfd.readCSV("../dataset.csv")
let dataframe_processed = DataFrameUtils.DataFrameDeepCopy(dataframe_original)
```

</details>

---

## `DataFrameIterRows`

<details>
<summary class="n4l-summary-wiki">Code example</summary>

```js
/**
 * @param {dfd.DataFrame} dataframe
 * @return {Array<Array<string|float32|int32|boolean>>}
 */
export function DataFrameIterRows (dataframe) {}
```

</details>

