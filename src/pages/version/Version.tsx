import { Card, Col, Container, Row, Table } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import packageInfo from '../../../package.json'

export default function Version () {

  return <>
    <Container className={'mt-3 mb-3'}>
      <Row>
        <Col>
          <h1><Trans i18nKey={'pages.version.title'} /> N4L App {packageInfo.version}</h1>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card className={'mt-3'}>
            <Card.Header>
              <h2><Trans i18nKey={'Dependencies'} /></h2>
            </Card.Header>
            <Card.Body>
              <Table responsive={true} bordered={true} striped={true} hover={true} variant={''} size={'sm'}>
                <thead>
                <tr>
                  <th><Trans i18nKey={'Package'} /></th>
                  <th><Trans i18nKey={'Version'} /></th>
                </tr>
                </thead>
                <tbody>
                {Object.entries(packageInfo.dependencies).map(([dependency_name, dependency_version], index) => {
                  return <tr key={index}>
                    <td>{dependency_name}</td>
                    <td>{dependency_version}</td>
                  </tr>
                })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className={'mt-3'}>
            <Card.Header>
              <h2><Trans i18nKey={'Dev dependencies'} /></h2>
            </Card.Header>
            <Card.Body>
              <Table responsive={true} bordered={true} striped={true} hover={true} variant={''} size={'sm'}>
                <thead>
                <tr>
                  <th><Trans i18nKey={'Package'} /></th>
                  <th><Trans i18nKey={'Version'} /></th>
                </tr>
                </thead>
                <tbody>
                {Object.entries(packageInfo.devDependencies).map(([dependency_name, dependency_version], index) => {
                  return <tr key={index}>
                    <td>{dependency_name}</td>
                    <td>{dependency_version}</td>
                  </tr>
                })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  </>
}
