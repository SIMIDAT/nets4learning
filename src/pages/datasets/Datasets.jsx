import { Trans, useTranslation } from 'react-i18next'
import { Card, Col, Container, Row, Tab, Table, Tabs } from 'react-bootstrap'

export default function Datasets () {
  const { t } = useTranslation()

  // @formatter:off
  const tabular_classification_datasets_list = [
    {
      title       : 'car.csv',
      url_download: 'car.csv',
      url_original: 'https://archive.ics.uci.edu/ml/datasets/Car+Evaluation',
      size        : 1728,
      i18n        : 'datasets.download-dataset-car',
    },
    {
      title       : 'hepatitis-c.csv',
      url_download: 'hepatitis-c.csv',
      url_original: 'https://archive.ics.uci.edu/ml/datasets/HCV+data',
      size        : 589,
      i18n        : 'datasets.download-dataset-hepatitis-c',
    },
    {
      title       : 'ecoli.csv',
      url_download: 'ecoli.csv',
      url_original: 'https://github.com/jbrownlee/Datasets/blob/master/ecoli.names',
      size        : 336,
      i18n        : 'datasets.download-dataset-ecoli',
    },
    {
      title       : 'new-thyroid.csv',
      url_download: 'new-thyroid.csv',
      url_original: 'https://github.com/jbrownlee/Datasets/blob/master/new-thyroid.names',
      size        : 215,
      i18n        : 'datasets.download-dataset-new-thyroid',
    },
    {
      title       : 'wine.csv',
      url_download: 'wine.csv',
      url_original: 'https://github.com/jbrownlee/Datasets/blob/master/wine.names',
      size        : 178,
      i18n        : 'datasets.download-dataset-wine',
    },
    {
      title       : 'iris.csv',
      url_download: 'iris.csv',
      url_original: 'https://archive.ics.uci.edu/ml/datasets/iris',
      size        : 150,
      i18n        : 'datasets.download-dataset-iris',
    },
    {
      title       : 'titanic.csv',
      url_download: 'titanic.csv',
      url_original: 'https://web.stanford.edu/class/archive/cs/cs109/cs109.1166/problem12.html',
      size        : 887,
      i18n        : 'datasets.download-dataset-titanic',
    }]
  const linear_regression_datasets_list = [
    {
      title       : 'salary/salary.csv',
      url_download: 'salary/salary.csv',
      url_original: 'https://www.kaggle.com/code/snehapatil01/linear-regression-on-salary-dataset/notebook',
      size        : 31,
      i18n        : 'datasets.download.dataset.1-linear-regression.salary',
    },
    {
      title       : 'auto-mpg/auto-mpg.csv',
      url_download: 'auto-mpg/auto-mpg.csv',
      url_original: 'https://archive.ics.uci.edu/ml/datasets/auto+mpg',
      size        : 396,
      i18n        : 'datasets.download.dataset.1-linear-regression.auto-mpg',
    },
    {
      title       : 'boston-housing/housing.csv',
      url_download: 'boston-housing/housing.csv',
      url_original: 'https://archive.ics.uci.edu/ml/datasets/Housing',
      size        : 506,
      i18n        : 'datasets.download.dataset.1-linear-regression.boston',
    },
    {
      title       : 'breast-cancer/wdbc.csv',
      url_download: 'breast-cancer/wdbc.csv',
      url_original: 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic',
      size        : 570,
      i18n        : 'datasets.download.dataset.1-linear-regression.breast-cancer-wdbc',
    },
    {
      title       : 'breast-cancer/wpbc.csv',
      url_download: 'breast-cancer/wpbc.csv',
      url_original: 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic',
      size        : 199,
      i18n        : 'datasets.download.dataset.1-linear-regression.breast-cancer-wpbc',
    },
    {
      title       : 'student-performance/student-mat.csv',
      url_download: 'student-performance/student-mat.csv',
      url_original: 'https://archive.ics.uci.edu/dataset/320/student+performance',
      size        : 396,
      i18n        : 'datasets.download.dataset.1-linear-regression.student-performance-mathematics',
    },
    {
      title       : 'student-performance/student-por.csv',
      url_download: 'student-performance/student-por.csv',
      url_original: 'https://archive.ics.uci.edu/dataset/320/student+performance',
      size        : 650,
      i18n        : 'datasets.download.dataset.1-linear-regression.student-performance-portuguese',
    },
    {
      title       : 'wine-quality/wine-quality-red.csv',
      url_download: 'wine-quality/wine-quality-red.csv',
      url_original: 'https://archive.ics.uci.edu/dataset/186/wine+quality',
      size        : 1600,
      i18n        : 'datasets.download.dataset.1-linear-regression.wine-red',
    },
    {
      title       : 'wine-quality/wine-quality-white.csv',
      url_download: 'wine-quality/wine-quality-white.csv',
      url_original: 'https://archive.ics.uci.edu/dataset/186/wine+quality',
      size        : 4899,
      i18n        : 'datasets.download.dataset.1-linear-regression.wine-white',
    }]
  // @formatter:on

  return <>
    <main className={'mb-3'} data-title={'Datasets'}>
      <Container id={'Datasets'} className={'mt-3 mb-3'}>
        <Row className={'mt-3'}>
          <Col><h1><Trans i18nKey={'pages.contribute.title'} /></h1></Col>
        </Row>
        <Row className={'mt-3'}>
          <Col>
            <Card>
              <Card.Header><h2><Trans i18nKey={'datasets.title'} /></h2></Card.Header>
              <Card.Body>
                <Tabs defaultActiveKey={'tabular-classification'} justify>
                  <Tab eventKey="tabular-classification" title={t('pages.index.tabular-classification.1-title')}>
                    <Table className={'mt-3'} responsive={true}>
                      <thead>
                      <tr>
                        <th>{t('datasets.dataset-name')}</th>
                        <th>{t('datasets.dataset-size')}</th>
                        <th>{t('datasets.dataset-web')}</th>
                        <th>{t('download')}</th>
                      </tr>
                      </thead>
                      <tbody>
                      {tabular_classification_datasets_list.map((value, index) => {

                        return <tr key={index}>
                          <td>{t(value.i18n)}</td>
                          <td>{value.size}</td>
                          <td><a className="link-secondary" href={value.url_original} rel="noreferrer" target="_blank">web</a></td>
                          <td>
                            <a href={process.env.REACT_APP_PATH + '/datasets/' + value.url_download}
                               className={'btn btn-outline-primary btn-sm mt-2'}
                               download>
                              {t('download')}
                            </a>
                          </td>
                        </tr>
                      })}
                      </tbody>
                    </Table>
                  </Tab>
                  {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&
                    <Tab eventKey="linear-regression" title={t('pages.index.linear-regression.1-title')}>
                      <Table className={'mt-3'} responsive={true}>
                        <thead>
                        <tr>
                          <th>{t('datasets.dataset-name')}</th>
                          <th>{t('datasets.dataset-size')}</th>
                          <th>{t('datasets.dataset-web')}</th>
                          <th>{t('download')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {linear_regression_datasets_list.map((_value, index) => {
                          return <tr key={index}>
                            <td>{t(_value.i18n)}</td>
                            <td>{_value.size}</td>
                            <td><a className="link-secondary" href={_value.url_original} rel="noreferrer" target="_blank">web</a></td>
                            <td>
                              <a download href={process.env.REACT_APP_PATH + '/datasets/01-linear-regression/' + _value.url_download}
                                 className={'btn btn-outline-primary btn-sm mt-2'}>
                                {t('download')}
                              </a>
                            </td>
                          </tr>
                        })}
                        </tbody>
                      </Table>
                    </Tab>
                  }
                  {/*<Tab eventKey="object-detection" title={t("pages.index.object-detection.1-title")}>*/}
                  {/*TODO*/}
                  {/*</Tab>*/}
                  {/*<Tab eventKey="image-classification" title={t("pages.index.image-classification.1-title")}>*/}
                  {/*TODO*/}
                  {/*</Tab>*/}
                </Tabs>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  </>
}