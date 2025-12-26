import { Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import N4LEcharts from '@components/echarts/N4LEcharts'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'


type DataFrameEchartCardProps = {
	isDataFrameProcessed: boolean
}
export default function DataFrameEchartCard(props: DataFrameEchartCardProps) {
	const { isDataFrameProcessed } = props
	return <>
		<Card className={'mt-3'}>
			<Card.Header className={'d-flex align-items-center justify-content-between'}>
				<h3><Trans i18nKey={'dataframe.echart.title'} /></h3>
			</Card.Header>
			<Card.Body>
				{!isDataFrameProcessed && <>
					<WaitingPlaceholder i18nKey_title={'Waiting'} />
				</>}
				{isDataFrameProcessed && <>
					<N4LEcharts
						option={{
							xAxis: {
								type: 'category',
								data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
							},
							yAxis: {
								type: 'value'
							},
							series: [
								{
									data: [120, 200, 150, 80, 70, 110, 130],
									type: 'bar'
								}
							]
						}}
					/>
				</>}
			</Card.Body>
		</Card>
	</>
}