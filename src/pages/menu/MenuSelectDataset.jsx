import React, { useState } from 'react'
import { Form, Button, Row, Col, Container, Card } from 'react-bootstrap'
import { useParams, useHistory } from 'react-router-dom'
import N4LNavbar from '../../components/header/N4LNavbar'
import N4LFooter from '../../components/footer/N4LFooter'
import * as alertHelper from '../../utils/alertHelper'
import { useTranslation } from "react-i18next";

export default function MenuSelectDataset() {
  const { id } = useParams()
  const [dataset_id, setDatasetId] = useState(-1)
  const history = useHistory()
  const { t } = useTranslation()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (dataset_id === -1) {
      await alertHelper.alertWarning(t("alert.menu.need-select-dataset"))
    } else {
      history.push('/playground/' + id + '/' + 1 + '/' + dataset_id)
    }
  }


  const PrintHTML_OPTIONS = (_id) => {
    switch (_id) {
      case '0': {
        // tabular-classification
        return <>
          <option value={0}>{t("pages.menu-selection-dataset.0-tabular-classification.csv")}</option>
          <option value={1}>{t("datasets-models.0-tabular-classification.list-datasets.0-option-1")}</option>
          <option value={2}>{t("datasets-models.0-tabular-classification.list-datasets.0-option-2")}</option>
          <option value={3}>{t("datasets-models.0-tabular-classification.list-datasets.0-option-3")}</option>
        </>
      }
      case '1': {
        // linear-regression
        console.warn("TODO")
        return <>
        </>
      }
      case '2': {
        // object-detection
        console.warn("TODO")
        return <>
        </>
      }
      case '3': {
        // image-classifier
        console.warn("TODO")
        return <>
          <option value={1}>{t("pages.menu-selection-dataset.1-image-classifier")}</option>
        </>
      }
      default: {
        console.error("Opción no disponible")
      }
    }
  }

  console.debug("render MenuSelectDataset")
  return (
    <>
      <Form onSubmit={($event) => handleSubmit($event)}>
        <Container id={"MenuSelectDataset"}>
          <Row className="mt-3 mb-3">
            <Col>
              <Card>
                <Card.Header><h3>{t("modality." + id)}</h3></Card.Header>
                <Card.Body>
                  <Card.Text>
                    {t("pages.menu-selection-dataset.form-description-1")}
                  </Card.Text>
                  <Form.Group className="mb-3" controlId="FormDataSet">
                    <Form.Label>{t("pages.menu-selection-dataset.form-label")}</Form.Label>
                    <Form.Select aria-label={t("pages.menu-selection-dataset.form-label")}
                                 defaultValue={-1}
                                 onChange={(e) => setDatasetId(parseInt(e.target.value))}>
                      <option value={-1} disabled>{t("pages.menu-selection-dataset.form-option-_-1")}</option>
                      {PrintHTML_OPTIONS(id)}
                    </Form.Select>
                  </Form.Group>

                  <Button type="submit">
                    {t("pages.menu-selection-dataset.form-submit")}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Form>
    </>
  )
}
