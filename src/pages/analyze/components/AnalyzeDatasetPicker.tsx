import { Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import type { DropEvent, FileRejection } from 'react-dropzone'

import { TASKS } from '@/TASKS'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import { PROJECT_DATASETS, fileName, type ProjectDataset_t } from '@pages/analyze/projectDatasets'
import { DATASET_ACCEPT } from '@core/dataframe/datasetFormats'

type AnalyzeDatasetPickerProps = {
  /** CSV del proyecto elegido (null si es uno propio o ninguno) */
  selectedFile: string | null
  isLoading   : boolean
  onProject   : (dataset: ProjectDataset_t) => void
  onUpload    : (file: File) => void
  onRejected  : (files: FileRejection[], event: DropEvent) => void
}

const GROUPS = [
  { task: TASKS.TABULAR_CLASSIFICATION, i18n: 'modality.0' },
  { task: TASKS.REGRESSION, i18n: 'modality.1' },
]

/** Elegir qué analizar: uno de los CSV del proyecto (con la ficha de sus variables) o uno propio */
export default function AnalyzeDatasetPicker({ selectedFile, isLoading, onProject, onUpload, onRejected }: AnalyzeDatasetPickerProps) {
  const prefix = 'pages.dataframe.picker.'
  const { t } = useTranslation()

  return (
    <Card data-testid={'Test-AnalyzePicker'}>
      <Card.Body>
        <Row className={'g-4'}>
          <Col lg={6}>
            <Form.Group controlId={'analyze-project-dataset'}>
              <Form.Label className={'fw-semibold'}>{t(prefix + 'project')}</Form.Label>
              <div className={'d-flex align-items-center gap-2'}>
                <Form.Select value={selectedFile ?? ''} disabled={isLoading}
                  onChange={(e) => {
                    const dataset = PROJECT_DATASETS.find(({ file }) => file === e.target.value)
                    if (dataset) onProject(dataset)
                  }}>
                  <option value={''} disabled={true}>{t(prefix + 'placeholder')}</option>
                  {GROUPS.map(({ task, i18n }) => (
                    <optgroup key={task} label={t(i18n)}>
                      {PROJECT_DATASETS.filter((dataset) => dataset.task === task).map(({ file, i18n: label }) => (
                        <option key={file} value={file}>{t(label)} · {fileName(file)}</option>
                      ))}
                    </optgroup>
                  ))}
                </Form.Select>
                {isLoading && <Spinner size={'sm'} role={'status'} aria-label={t(prefix + 'loading')} />}
              </div>
              <Form.Text>{t(prefix + 'project-help')}</Form.Text>
            </Form.Group>
          </Col>
          <Col lg={6}>
            <div className={'fw-semibold mb-2'}>{t(prefix + 'upload')}</div>
            <DragAndDrop
              id={'dataset-upload'}
              name={'csv'}
              accept={DATASET_ACCEPT}
              text={t('drag-and-drop.dataset')}
              labelFiles={t('drag-and-drop.label-files-one')}
              function_DropAccepted={(files) => files[0] && onUpload(files[0])}
              function_DropRejected={onRejected} />
            <Form.Text>{t(prefix + 'upload-help')}</Form.Text>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}
