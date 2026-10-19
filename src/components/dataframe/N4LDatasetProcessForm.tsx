import { useMemo, useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Col, Form, Nav, Row, Tab } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import type * as dfd from 'danfojs'

import type * as _Types from '@core/types'
import { DEFAULT_SCALER } from '@/CONSTANTS'
import { profileColumns, type ColumnProfile_t } from '@core/dataframe/columnProfile'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'

/** Lo elegido en el formulario, ya como transformación de cada columna (las que no se usan, "drop") */
export type DatasetProcessPlan_t = {
  target    : string
  scaler    : _Types.ScalerKey_t
  transforms: _Types.DataFrameColumnTransform_t[]
}

/** Lo que ya se ha procesado, para la pestaña de los datos procesados */
export type DatasetProcessed_t = {
  /** Codificado: cada categoría ya es un número */
  dataframe : dfd.DataFrame
  /** Escalado: lo que recibe la red */
  X         : dfd.DataFrame
  target    : string
  transforms: _Types.DataFrameColumnTransform_t[]
}

type N4LDatasetProcessFormProps = {
  kind     : 'classification' | 'regression'
  /** El conjunto tal como se ha subido */
  dataframe: _Types.DataFrame_t
  processed: DatasetProcessed_t | null
  onProcess: (plan: DatasetProcessPlan_t) => void | Promise<void>
}

type ColumnChoice_t = { use: boolean, transform: _Types.ColumnTransform_t }
type Tab_t = 'original' | 'form' | 'processed'

// Por encima de esto, la columna elegida como clase probablemente no lo es (un número continuo, un identificador…)
const MANY_CLASSES = 20
const prefix = 'dataset-process.'

/** Cómo se convierte en números una columna de entrada: las de texto, solo como categoría; las numéricas, también así */
const transformsFor = (profile: ColumnProfile_t): _Types.ColumnTransform_t[] =>
  (profile.numeric ? [profile.type as _Types.ColumnTransform_t, 'label-encoder'] : ['label-encoder'])

const defaultChoice = (profile: ColumnProfile_t): ColumnChoice_t => ({ use: true, transform: transformsFor(profile)[0] })

/**
 * Preparar un conjunto de datos subido por el usuario, en tres pestañas: los datos tal cual; qué columna se predice,
 * cómo se escalan las entradas y qué columnas se usan y cómo se convierten en números (con el resumen de lo que entrará
 * en la red); y los datos procesados, codificados y escalados. Lo comparten la clasificación tabular y la regresión: cada
 * una procesa a su manera lo elegido (onProcess).
 */
export default function N4LDatasetProcessForm({ kind, dataframe, processed, onProcess }: N4LDatasetProcessFormProps) {
  const { t, i18n } = useTranslation()
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }), [i18n.language])
  const profiles = useMemo(() => profileColumns(dataframe), [dataframe])

  const [tab, setTab] = useState<Tab_t>(processed === null ? 'form' : 'processed')
  const [target, setTarget] = useState(() => dataframe.columns.at(-1) ?? '')
  const [scaler, setScaler] = useState<_Types.ScalerKey_t>(DEFAULT_SCALER)
  const [choices, setChoices] = useState<Record<string, ColumnChoice_t>>(() => Object.fromEntries(profiles.map((p) => [p.name, defaultChoice(p)])))
  const [isProcessing, setIsProcessing] = useState(false)
  // Otro fichero: el formulario empieza de nuevo
  const [previous, setPrevious] = useState(dataframe)
  if (previous !== dataframe) {
    setPrevious(dataframe)
    setTarget(dataframe.columns.at(-1) ?? '')
    setChoices(Object.fromEntries(profiles.map((p) => [p.name, defaultChoice(p)])))
    setTab('form')
  }

  const targetProfile = profiles.find(({ name }) => name === target)
  const inputs = profiles.filter(({ name }) => name !== target && (choices[name]?.use ?? true))
  const targetIsText = kind === 'regression' && targetProfile !== undefined && !targetProfile.numeric
  const canProcess = inputs.length > 0 && targetProfile !== undefined && !targetIsText

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canProcess) return
    const transforms = profiles.map((profile): _Types.DataFrameColumnTransform_t => {
      const choice = choices[profile.name] ?? defaultChoice(profile)
      // La clase se codifica con un número por clase; el número que se predice se queda como está
      if (profile.name === target) return { column_name: profile.name, column_transform: kind === 'classification' ? 'label-encoder' : profile.type as _Types.ColumnTransform_t }
      return { column_name: profile.name, column_transform: choice.use ? choice.transform : 'drop' }
    })
    setIsProcessing(true)
    try {
      await onProcess({ target, scaler, transforms })
      setTab('processed')
    } finally {
      setIsProcessing(false)
    }
  }

  const describe = (profile: ColumnProfile_t) => profile.numeric && profile.min !== undefined
    ? t(prefix + 'range', { min: number.format(profile.min), max: number.format(profile.max!), count: profile.distinct })
    : t(prefix + 'distinct', { count: profile.distinct, sample: profile.sample.join(', ') })

  const targetInfo = () => {
    if (targetProfile === undefined) return null
    if (kind === 'classification') {
      const many = targetProfile.distinct > MANY_CLASSES
      return <>
        <p className={'small mb-1'} data-testid={'Test-DatasetProcess-TargetInfo'}>
          {t(prefix + 'target-classes', { name: target, count: targetProfile.distinct, sample: targetProfile.sample.join(', ') + (targetProfile.distinct > targetProfile.sample.length ? '…' : '') })}
        </p>
        {many && <Alert variant={'warning'} className={'small py-2 mb-0'}>{t(prefix + 'target-too-many', { count: targetProfile.distinct })}</Alert>}
      </>
    }
    if (targetIsText) return <Alert variant={'danger'} className={'small py-2 mb-0'} data-testid={'Test-DatasetProcess-TargetInfo'}>{t(prefix + 'target-not-numeric', { name: target })}</Alert>
    return <p className={'small mb-1'} data-testid={'Test-DatasetProcess-TargetInfo'}>
      {t(prefix + 'target-range', { name: target, min: number.format(targetProfile.min!), max: number.format(targetProfile.max!), mean: number.format(targetProfile.mean!) })}
    </p>
  }

  const scaled = useMemo(() => processed?.X.round(3) ?? null, [processed])
  const [view, setView] = useState<'encoded' | 'scaled'>('scaled')
  const subtitles = useMemo(() => Object.fromEntries((processed?.transforms ?? []).map(({ column_name, column_transform }) => [column_name, t(prefix + 'transforms.' + column_transform, { defaultValue: column_transform })])), [processed, t])

  return (
    <Tab.Container activeKey={tab} onSelect={(key) => setTab((key as Tab_t | null) ?? 'form')}>
      <Nav variant={'pills'} className={'n4l-process-steps mb-3 gap-2 flex-column flex-sm-row'} data-testid={'Test-DatasetProcess-Tabs'}>
        <Nav.Item><Nav.Link eventKey={'original'}>{t(prefix + 'tabs.original')}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey={'form'}>{t(prefix + 'tabs.form')}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey={'processed'} disabled={processed === null}>{t(prefix + 'tabs.processed')}</Nav.Link></Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey={'original'} mountOnEnter={true}>
          <p className={'text-body-secondary'}>{t(prefix + 'original-help', { rows: dataframe.shape[0], columns: dataframe.shape[1] })}</p>
          <N4LDataFrameTable dataframe={dataframe} target={target} subtitles={'dtype'} />
        </Tab.Pane>

        <Tab.Pane eventKey={'form'}>
          <Form onSubmit={handleSubmit} data-testid={'Test-DatasetProcess-Form'}>
            <Row className={'g-3'}>
              {/* QUÉ SE PREDICE */}
              <Col lg={6}>
                <section className={'n4l-process-block h-100'}>
                  <h4 className={'h6'}>{t(prefix + kind + '.target-title')}</h4>
                  <p className={'small text-body-secondary'}>{t(prefix + kind + '.target-help')}</p>
                  <Form.Group controlId={'n4l-process-target'} className={'mb-2'}>
                    <Form.Label className={'visually-hidden'}>{t(prefix + kind + '.target-title')}</Form.Label>
                    <Form.Select value={target} onChange={(event) => setTarget(event.target.value)}>
                      {profiles.map(({ name }) => <option key={name} value={name}>{name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  {targetInfo()}
                </section>
              </Col>

              {/* ESCALADO */}
              <Col lg={6}>
                <fieldset className={'n4l-process-block h-100'}>
                  <legend className={'h6'}>{t(prefix + 'scaler-title')}</legend>
                  <p className={'small text-body-secondary'}>{t(prefix + 'scaler-help')}</p>
                  {(['min-max-scaler', 'standard-scaler'] as const).map((key) => (
                    <Form.Check key={key} type={'radio'} id={'n4l-process-' + key} name={'n4l-process-scaler'} className={'mb-2'}
                      checked={scaler === key} onChange={() => setScaler(key)}
                      label={<><span className={'fw-semibold'}>{t(prefix + 'scalers.' + key + '.name')}</span>
                        <span className={'d-block small text-body-secondary'}>{t(prefix + 'scalers.' + key + '.help')}</span></>} />
                  ))}
                </fieldset>
              </Col>
            </Row>

            {/* COLUMNAS DE ENTRADA */}
            <section className={'mt-4'}>
              <h4 className={'h6'}>{t(prefix + 'columns-title')}</h4>
              <p className={'small text-body-secondary'}>{t(prefix + 'columns-help')}</p>
              <Row xs={1} sm={2} lg={3} xxl={4} className={'g-2'}>
                {profiles.map((profile) => {
                  const isTarget = profile.name === target
                  const choice = choices[profile.name] ?? defaultChoice(profile)
                  const options = transformsFor(profile)
                  const setChoice = (patch: Partial<ColumnChoice_t>) => setChoices((current) => ({ ...current, [profile.name]: { ...choice, ...patch } }))
                  return (
                    <Col key={profile.name}>
                      <div className={'n4l-process-column h-100' + (isTarget ? ' is-target' : '') + (!isTarget && !choice.use ? ' is-unused' : '')}
                        data-testid={'Test-DatasetProcess-Column-' + profile.name}>
                        <div className={'d-flex align-items-start justify-content-between gap-2'}>
                          <span className={'fw-semibold text-break'} title={profile.name}>{profile.name}</span>
                          {isTarget
                            ? <span className={'badge n4l-target-badge text-nowrap'}>{t(prefix + kind + '.target-badge')}</span>
                            : <Form.Check type={'switch'} id={'n4l-process-use-' + profile.name} label={t(prefix + 'use')} className={'mb-0 text-nowrap'}
                              checked={choice.use} onChange={(event) => setChoice({ use: event.target.checked })} />}
                        </div>
                        <div className={'small text-body-secondary mb-2'}>
                          <Badge bg={'secondary-subtle'} text={'secondary-emphasis'} className={'me-1'}>{t(prefix + 'types.' + profile.type, { defaultValue: profile.type })}</Badge>
                          {describe(profile)}
                        </div>
                        {isTarget
                          ? <p className={'small mb-0'}>{t(prefix + kind + '.target-transform')}</p>
                          : options.length === 1
                            ? <p className={'small mb-0'}>{t(prefix + 'transforms.' + options[0])}</p>
                            : <Form.Select size={'sm'} aria-label={t(prefix + 'transform-of', { name: profile.name })} disabled={!choice.use}
                              value={choice.transform} onChange={(event) => setChoice({ transform: event.target.value as _Types.ColumnTransform_t })}>
                              {options.map((option) => <option key={option} value={option}>{t(prefix + 'transforms.' + option)}</option>)}
                            </Form.Select>}
                      </div>
                    </Col>
                  )
                })}
              </Row>
            </section>

            {/* RESUMEN Y PROCESAR */}
            <div className={'n4l-process-summary mt-4'}>
              <p className={'mb-2'} data-testid={'Test-DatasetProcess-Summary'}>
                {inputs.length === 0
                  ? t(prefix + 'no-inputs')
                  : t(prefix + kind + '.summary', {
                    count  : inputs.length,
                    target,
                    classes: targetProfile?.distinct ?? 0,
                    scaler : t(prefix + 'scalers.' + scaler + '.name'),
                  })}
              </p>
              <div className={'d-grid'}>
                <Button type={'submit'} disabled={!canProcess || isProcessing} data-testid={'Test-DatasetProcess-Submit'}>
                  {t(prefix + 'submit')}
                </Button>
              </div>
            </div>
          </Form>
        </Tab.Pane>

        <Tab.Pane eventKey={'processed'} mountOnEnter={true}>
          {processed !== null && scaled !== null && <>
            <Alert variant={'success'} className={'py-2'} data-testid={'Test-DatasetProcess-Done'}>
              {t(prefix + 'done', { rows: processed.X.shape[0], count: processed.X.shape[1], target: processed.target })}
            </Alert>
            <div className={'d-flex flex-wrap align-items-center gap-2 mb-2'}>
              <ButtonGroup size={'sm'} aria-label={t(prefix + 'view')}>
                <Button variant={view === 'scaled' ? 'primary' : 'outline-primary'} onClick={() => setView('scaled')}>{t(prefix + 'views.scaled')}</Button>
                <Button variant={view === 'encoded' ? 'primary' : 'outline-primary'} onClick={() => setView('encoded')}>{t(prefix + 'views.encoded')}</Button>
              </ButtonGroup>
              <span className={'small text-body-secondary'}>{t(prefix + 'views.' + view + '-help')}</span>
            </div>
            {view === 'scaled'
              ? <N4LDataFrameTable dataframe={scaled} target={null} subtitles={null} />
              : <N4LDataFrameTable dataframe={processed.dataframe} target={processed.target} subtitles={subtitles} />}
          </>}
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  )
}
