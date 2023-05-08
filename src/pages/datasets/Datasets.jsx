import { useTranslation } from "react-i18next";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import N4LNavbar from "../../components/header/N4LNavbar";
import N4LFooter from "../../components/footer/N4LFooter";

/**
 * @typedef {Object} File_t
 * @property {string} title
 * @property {string} url
 */


export default function Datasets(props) {
  const { t } = useTranslation();

  const datasets_list = [
    {
      title       : "car.csv",
      url_download: "car.csv",
      url_original: "https://archive.ics.uci.edu/ml/datasets/Car+Evaluation",
      size        : 1728,
      i18n        : "datasets.download-dataset-car"
    },
    {
      title       : "hepatitis-c.csv",
      url_download: "hepatitis-c.csv",
      url_original: "https://archive.ics.uci.edu/ml/datasets/HCV+data",
      size        : 589,
      i18n        : "datasets.download-dataset-hepatitis-c"
    },
    {
      title       : "ecoli.csv",
      url_download: "ecoli.csv",
      url_original: "https://github.com/jbrownlee/Datasets/blob/master/ecoli.names",
      size        : 336,
      i18n        : "datasets.download-dataset-ecoli"
    },
    {
      title       : "new-thyroid.csv",
      url_download: "new-thyroid.csv",
      url_original: "https://github.com/jbrownlee/Datasets/blob/master/new-thyroid.names",
      size        : 215,
      i18n        : "datasets.download-dataset-new-thyroid"
    },
    {
      title       : "wine.csv",
      url_download: "wine.csv",
      url_original: "https://github.com/jbrownlee/Datasets/blob/master/wine.names",
      size        : 178,
      i18n        : "datasets.download-dataset-wine"
    },
    {
      title       : "iris.csv",
      url_download: "iris.csv",
      url_original: "https://archive.ics.uci.edu/ml/datasets/iris",
      size        : 150,
      i18n        : "datasets.download-dataset-iris"
    },
    {
      title       : "titanic.csv",
      url_download: "titanic.csv",
      url_original: "https://web.stanford.edu/class/archive/cs/cs109/cs109.1166/problem12.html",
      size        : 887,
      i18n        : "datasets.download-dataset-titanic"
    }
  ];

  const _download = (filename, textInput) => {
    const link = document.createElement('a')
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textInput));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }

  /**
   * @param {File_t} file
   */
  const handleClick_DownloadDataset = async (file) => {
    const response = await fetch(process.env.REACT_APP_PATH + "/datasets/" + file.url);
    const content = await response.text();
    _download(file.title, content);
  }

  return <>
    <Container id={"Datasets"} className={"mt-3 mb-3"}>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>{t("datasets.title")}</h3>
            </Card.Header>
            <Card.Body>
              <Card.Title>{t("datasets.text-0")}</Card.Title>
              <hr />
              <table className={"table"}>
                <thead>
                <tr>
                  <th>{t("datasets.dataset-name")}</th>
                  <th>{t("datasets.dataset-size")}</th>
                  <th>{t("datasets.dataset-web")}</th>
                  <th>{t("download")}</th>
                </tr>
                </thead>
                <tbody>
                {datasets_list.map(({ title, url_download, url_original, size, i18n }, index) =>
                  <tr key={index}>
                    <td>{t(i18n)}</td>
                    <td>{size}</td>
                    <td><a className="link-secondary" href={url_original} rel="noreferrer" target="_blank">web</a></td>
                    <td>
                      <Button variant="primary"
                              size={"sm"}
                              className={"mt-2"}
                              onClick={() => handleClick_DownloadDataset({ title, url: url_download })}>
                        {t("download")}
                      </Button>
                    </td>
                  </tr>
                )}
                </tbody>
              </table>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  </>
}