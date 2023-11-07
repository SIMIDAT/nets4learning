import React from 'react'
import { useParams } from 'react-router'

import NotFoundPage from '../notFound/NotFoundPage'

import TabularClassification from './0_TabularClassification/TabularClassification'
import ModelReviewTabularClassification from './0_TabularClassification/ModelReviewTabularClassification'

import LinearRegression from './1_LinearRegression/LinearRegression'
import ModelReviewLinearRegression from './1_LinearRegression/ModelReviewLinearRegression'

import ModelReviewObjectDetection from './2_ObjectDetection/ModelReviewObjectDetection'

import ImageClassification from './3_ImageClassification/ImageClassification'
import ModelReviewImageClassification from './3_ImageClassification/ModelReviewImageClassification'

import { LinearRegressionProvider } from '@context/LinearRegressionContext'
import { TASKS } from '@/DATA_MODEL'

export default function Playground () {
  const { id, option, example } = useParams()

  const PrintHTMLPlaygroundView = () => {
    switch (id.toString()) {
      case TASKS.TABULAR_CLASSIFICATION: {
        if (option === 'model') {
          return <ModelReviewTabularClassification dataset={example} />
        } else if (option === 'dataset') {
          return <TabularClassification dataset={example} />
        }
        break
      }
      case TASKS.LINEAR_REGRESSION: {
        if (option === 'model') {
          return <ModelReviewLinearRegression dataset={example} />
        } else if (option === 'dataset') {
          return <>
            <LinearRegressionProvider>
              <LinearRegression dataset={example} />
            </LinearRegressionProvider>
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

  return (
    <>
      <main className={`mb-3`} data-title={'Playground'} data-testid={'Test-Playground'}>
        <PrintHTMLPlaygroundView />
      </main>
    </>
  )
}

