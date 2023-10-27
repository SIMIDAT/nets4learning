import React from 'react'
import { Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { CHARTJS_CONFIG_DEFAULT } from '@/CONSTANTS_ChartsJs'
import { Bar } from 'react-chartjs-2'
import { VERBOSE } from '@/CONSTANTS'

export default function ModelReviewTabularClassificationPredict (props) {

  const { prediction } = props
  const { t } = useTranslation()

  if (VERBOSE) console.debug('render ModelReviewTabularClassificationPredict')
  return <>
    <Card className={'mt-3'}>
      <Card.Header>
        <h3>
          <Trans i18nKey={'prediction'} />
        </h3>
      </Card.Header>
      <Card.Body>
        <Bar options={{
          responsive: true,
          plugins   : {
            legend: { position: 'top', display: false },
            title : { display: true, text: t('prediction') },
          },
        }}
             data={{
               // i18n key
               labels  : prediction.labels.map(v => (t(v))),
               datasets: [{
                 label          : t('prediction'),
                 data           : prediction.data,
                 backgroundColor: CHARTJS_CONFIG_DEFAULT.BACKGROUND_COLOR,
                 borderColor    : CHARTJS_CONFIG_DEFAULT.BORDER_COLOR,
                 borderWidth    : 1,
               }],
             }}
        />
      </Card.Body>
    </Card>
  </>
}