# Directory structure

The code has been organized in such a way that each task is separated, as certain components will have a different UI depending on the task. In order not to repeat code, the logic of the datasets, preprocessing, neural network layers, as
well as the layer models and the graph have been abstracted.

```md
├── src
│ ├── pages/playground/0_TabularClassification/models/
│ │ ├── _model.js
│ │ ├── index.js
│ │ ├── MODEL_NEW_DATASET.js
│ ├── pages/playground/1_LinearRegression/models/
│ │ ├── _model.js
│ │ ├── index.js
│ │ ├── MODEL_NEW_DATASET.js
│ ├── pages/playground/2_ObjectDetection/models/
│ │ ├── _model.js
│ │ ├── index.js
│ │ ├── MODEL_NEW_DATASET.js
│ ├── pages/playground/3_ImageClassification/models/
│ │ ├── _model.js
│ │ ├── index.js
│ │ ├── MODEL_NEW_DATASET.js
│ DATA_MODEL.js
```