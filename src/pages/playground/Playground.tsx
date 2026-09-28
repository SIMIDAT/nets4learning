import { lazy, Suspense } from 'react'
import { useParams } from 'react-router'

import NotFoundPage from '../notFound/NotFoundPage'
import Loading from '../Loading'
import { RegressionProvider } from '@context/RegressionContext'
import { TASKS } from '@/TASKS'

// Cada vista se carga bajo demanda: así una tarea no descarga los modelos y librerías
// de las demás (p. ej. la clasificación tabular no necesita face-api ni mediapipe).
// Tabular Classification
const TabularClassification = lazy(() => import('./0_TabularClassification/TabularClassification'))
const ModelReviewTabularClassification = lazy(() => import('./0_TabularClassification/ModelReviewTabularClassification'))
// Regression
const Regression = lazy(() => import('./1_Regression/Regression'))
const ModelReviewRegression = lazy(() => import('./1_Regression/ModelReviewRegression'))
// Object Detection
const ModelReviewObjectDetection = lazy(() => import('./2_ObjectDetection/ModelReviewObjectDetection'))
// Image Classification
const ImageClassification = lazy(() => import('./3_ImageClassification/ImageClassification'))
const ModelReviewImageClassification = lazy(() => import('./3_ImageClassification/ModelReviewImageClassification'))


type MisParams = {
  id     : string
  option : string
  example: string
}

const PrintHTMLPlaygroundView = ({ id, option, example }: MisParams) => {
  switch (id) {
    case TASKS.TABULAR_CLASSIFICATION: {
      if (option === 'model') {
        return <ModelReviewTabularClassification dataset={example} />
      } else if (option === 'dataset') {
        return <TabularClassification dataset={example} />
      }
      break
    }
    case TASKS.REGRESSION: {
      if (option === 'model') {
        return <ModelReviewRegression dataset={example} />
      } else if (option === 'dataset') {
        return <>
          <RegressionProvider>
            <Regression dataset={example} />
          </RegressionProvider>
        </>
      }
      break
    }
    case TASKS.OBJECT_DETECTION: {
      return <ModelReviewObjectDetection dataset={example} />
    }
    case TASKS.IMAGE_CLASSIFICATION: {
      if (option === 'model') {
        return <ModelReviewImageClassification dataset={example} />
      } else if (option === 'dataset') {
        return <ImageClassification dataset={example} />
      }
      break
    }
    default:
      return <NotFoundPage />
  }
}

export default function Playground() {
  const { id, option, example } = useParams<MisParams>()
  if (!id || !option || !example) return null

  return (
    <>
      <main className={'mb-3'} data-title={'Playground'} data-testid={'Test-Playground'}>
        <Suspense fallback={<Loading />}>
          <PrintHTMLPlaygroundView
            id={id}
            option={option}
            example={example}
          />
        </Suspense>
      </main>
    </>
  )
}

