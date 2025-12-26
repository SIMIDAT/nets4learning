import { useParams } from 'react-router'

import NotFoundPage from '../notFound/NotFoundPage'
// Tabular Classification
import TabularClassification from './0_TabularClassification/TabularClassification'
import ModelReviewTabularClassification from './0_TabularClassification/ModelReviewTabularClassification'
// Regression
import Regression from './1_Regression/Regression'
import ModelReviewRegression from './1_Regression/ModelReviewRegression'
// Object Detection
import ModelReviewObjectDetection from './2_ObjectDetection/ModelReviewObjectDetection'
// Image Classification
import ImageClassification from './3_ImageClassification/ImageClassification'
import ModelReviewImageClassification from './3_ImageClassification/ModelReviewImageClassification'

import { RegressionProvider } from '@context/RegressionContext'
import { TASKS } from '@/DATA_MODEL'


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
        <PrintHTMLPlaygroundView
          id={id}
          option={option}
          example={example}
        />
      </main>
    </>
  )
}

