import { lazy, Suspense } from 'react'
import { useParams } from 'react-router'
import { Container } from 'react-bootstrap'

import NotFoundPage from '../notFound/NotFoundPage'
import Loading from '../Loading'
import { RegressionProvider } from '@context/RegressionContext'
import { TabularClassificationProvider } from '@context/TabularClassificationContext'
import { TASKS } from '@/TASKS'
import N4LBreadcrumb from '@components/breadcrumb/N4LBreadcrumb'
import { isTask } from '@components/task/taskInfo'

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

const Clustering = lazy(() => import('./4_Clustering/Clustering'))


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
        return (
          // key: cada dataset empieza con su propio estado (modelos entrenados, predicción…)
          <TabularClassificationProvider key={example}>
            <TabularClassification dataset={example} />
          </TabularClassificationProvider>
        )
      }
      break
    }
    case TASKS.REGRESSION: {
      if (option === 'model') {
        return <ModelReviewRegression dataset={example} />
      } else if (option === 'dataset') {
        return <>
          <RegressionProvider key={example}>
            <Regression dataset={example} />
          </RegressionProvider>
        </>
      }
      break
    }
    case TASKS.OBJECT_DETECTION: {
      // Solo hay modelos preentrenados: no existe vista de entrenamiento con dataset
      if (option === 'model') {
        return <ModelReviewObjectDetection dataset={example} />
      }
      break
    }
    case TASKS.IMAGE_CLASSIFICATION: {
      if (option === 'model') {
        return <ModelReviewImageClassification dataset={example} />
      } else if (option === 'dataset') {
        return <ImageClassification dataset={example} />
      }
      break
    }
    case TASKS.CLUSTERING: {
      // Se agrupa al momento: no hay modelos preentrenados
      if (option === 'dataset') return <Clustering key={example} dataset={example} />
      break
    }
  }
  // Tarea u opción no reconocida
  return <NotFoundPage />
}

export default function Playground() {
  const { id, option, example } = useParams<MisParams>()
  if (!id || !option || !example) return null
  const kind = option === 'model' || option === 'dataset' ? option : undefined

  return (
    <>
      <main className={'mb-3'} data-title={'Playground'} data-testid={'Test-Playground'}>
        {isTask(id) && kind !== undefined &&
          <Container className={'mt-3 n4l-container-wide'}>
            <N4LBreadcrumb task={id} kind={kind} example={example} />
          </Container>
        }
        <Suspense fallback={<Loading />}>
          {/* Otra tarea, opción o ejemplo (p. ej. desde el desplegable de las migas de pan) es otra página: se monta de
              nuevo en vez de reutilizar el estado del anterior (el modelo de Car con los datos del formulario de Iris) */}
          <PrintHTMLPlaygroundView
            key={`${id}/${option}/${example}`}
            id={id}
            option={option}
            example={example}
          />
        </Suspense>
      </main>
    </>
  )
}

