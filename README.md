Nets4Learning
=============

Web platform for the design and execution of deep learning models for learning and initiation in the study of deep learning models.

The tool proposes different classical machine learning problems with known data sets to study and model different neural network architectures and training parameters. The tool addresses different examples of deep learning models such as
tabular classification, image classifier or object identification.

There are some classical problems prepared and reviewed to make predictions, the tool has the feature to pre process data sets that the user uploads, train models and predict in which class it would be classified.

## Datasets and Models

1. Tabular classification
   - [MODEL_CAR.tsx](src/pages/playground/0_TabularClassification/models/MODEL_CAR.tsx)
   - [MODEL_IRIS.tsx](src/pages/playground/0_TabularClassification/models/MODEL_IRIS.tsx)
   - [MODEL_LYMPHOGRAPHY.tsx](src/pages/playground/0_TabularClassification/models/MODEL_LYMPHOGRAPHY.tsx)
2. Regression
   - [MODEL_1_SALARY.tsx](src/pages/playground/1_Regression/models/MODEL_1_SALARY.tsx)
   - [MODEL_2_AUTO_MPG.tsx](src/pages/playground/1_Regression/models/MODEL_2_AUTO_MPG.tsx)
   - [MODEL_3_HOUSING_PRICES.tsx](src/pages/playground/1_Regression/models/MODEL_3_HOUSING_PRICES.tsx)
   - [MODEL_4_BREAST_CANCER.tsx](src/pages/playground/1_Regression/models/MODEL_4_BREAST_CANCER.tsx)
   - [MODEL_5_STUDENT_PERFORMANCE.tsx](src/pages/playground/1_Regression/models/MODEL_5_STUDENT_PERFORMANCE.tsx) 
   - [MODEL_6_WINE.tsx](src/pages/playground/1_Regression/models/MODEL_6_WINE.tsx) 
3. Image classifier
    - [MODEL_IMAGE_MNIST.tsx](src/pages/playground/3_ImageClassification/models/MODEL_IMAGE_MNIST.tsx)
    - [MODEL_IMAGE_MOBILENET.tsx](src/pages/playground/3_ImageClassification/models/MODEL_IMAGE_MOBILENET.tsx)
4. Object identification
    - [MODEL_1_FACE_DETECTOR.tsx](src/pages/playground/2_ObjectDetection/models/MODEL_1_FACE_DETECTOR.tsx)
    - [MODEL_2_FACE_MESH.tsx](src/pages/playground/2_ObjectDetection/models/MODEL_2_FACE_MESH.tsx)
    - [MODEL_3_MOVE_NET_POSE_NET.tsx](src/pages/playground/2_ObjectDetection/models/MODEL_3_MOVE_NET_POSE_NET.tsx)
    - [MODEL_4_COCO_SSD.tsx](src/pages/playground/2_ObjectDetection/models/MODEL_4_COCO_SSD.tsx)
    - [MODEL_5_FACE_API.tsx](src/pages/playground/2_ObjectDetection/models/MODEL_5_FACE_API.tsx)
    - [MODEL_6_HAND_SIGN.tsx](src/pages/playground/2_ObjectDetection/models/MODEL_6_HAND_SIGN.tsx)

## Install local

```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm install
npm start
```

### Project environment

Create the files `.env`, `.env.development`, `.env.production`, `.env.simidat` and `.env.simidat-beta`.

<details>
<summary> .env </summary>

```dosini
WATCHPACK_POLLING=
FAST_REFRESH=
NODE_ENV=""
PUBLIC_URL=""
VITE_PUBLIC_URL=""
VITE_PATH=""
VITE_ENVIRONMENT=""
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_SHOW_NEW_FEATURE="true"
VITE_NEW_FEATURE=""
GENERATE_SOURCEMAP=true
```

</details>

---

<details>
<summary> .env.development </summary>

```dosini
WATCHPACK_POLLING=true
FAST_REFRESH=true
NODE_ENV="development"
PUBLIC_URL="http://localhost/n4l"
VITE_PUBLIC_URL="https://localhost/n4l"
VITE_PATH="/n4l"
VITE_ENVIRONMENT="development"
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_SHOW_NEW_FEATURE="true"
VITE_NEW_FEATURE="linear-regression"
GENERATE_SOURCEMAP=true
```

</details>

---

<details>
<summary> .env.production </summary>

```dosini
WATCHPACK_POLLING=true
FAST_REFRESH=true
NODE_ENV="production"
PUBLIC_URL="https://simidat.ujaen.es/n4l"
VITE_PUBLIC_URL="https://simidat.ujaen.es/n4l"
VITE_PATH="/n4l"
VITE_ENVIRONMENT="production"
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_SHOW_NEW_FEATURE="true"
VITE_NEW_FEATURE="linear-regression"
GENERATE_SOURCEMAP=false
```

</details>

## Deploy with Traefik and Docker

<details>
<summary> docker-compose.yml </summary>

```bash
docker compose down n4l
docker compose build n4l
docker compose up n4l
```

</details>

### Command matrix

|                  | development    | build                             |
| ---------------- | -------------- | --------------------------------- |
| Development      | `pnpm run dev` |                                   |
| simidat          |                | `pnpm run build:simidat`          |
| netlify          |                | `pnpm run build:netlify`          |
| netlify-snapshot |                | `pnpm run build:netlify-snapshot` |


```bash
node -v 
# v22.13.0
pnpm -v 
# 10.24.0
```