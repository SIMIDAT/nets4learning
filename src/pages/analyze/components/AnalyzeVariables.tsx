import { useMemo, useState } from 'react'
import { Badge, Button, ButtonGroup, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { histogram, type ColumnProfile_t } from '@core/dataframe/eda'
import type { DatasetVariable_t } from '@pages/datasets/datasetVariables'
import { variableOf } from '@pages/analyze/projectDatasets'

type Filter_t = 'all' | 'numeric' | 'categorical'
type View_t = 'cards' | 'table'

type AnalyzeVariablesProps = {
  profiles          : ColumnProfile_t[]
  /** Valores numéricos de cada columna numérica (NaN donde faltan), para los histogramas */
  numbers           : Map<string, number[]>
  target            : string | null
  /** Ficha de las variables (UCI o documentación original), si el CSV es del proyecto */
  variables?        : DatasetVariable_t[]
  /** Lleva a la distribución de la variable */
  onShowDistribution: (column: string) => void
}

/** Una ficha por variable (o una tabla con todas): tipo, ausentes, distintos, estadísticos y forma de los datos */
export default function AnalyzeVariables({ profiles, numbers, target, variables, onShowDistribution }: AnalyzeVariablesProps) {
  const prefix = 'pages.dataframe.variables.'
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter_t>('all')
  const [view, setView] = useState<View_t>('cards')
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }), [i18n.language])
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }), [i18n.language])

  const counts = {
    all        : profiles.length,
    numeric    : profiles.filter(({ kind }) => kind === 'numeric').length,
    categorical: profiles.filter(({ kind }) => kind === 'categorical').length,
  }
  const visible = profiles.filter((profile) => (filter === 'all' || profile.kind === filter) &&
    profile.name.toLowerCase().includes(search.trim().toLowerCase()))
  const metaOf = (name: string) => variableOf(variables, name)
  const rows = (profile: ColumnProfile_t) => profile.count + profile.missing

  return <>
    <div className={'d-flex flex-wrap align-items-center gap-2 mb-3'}>
      <Form.Control size={'sm'} type={'search'} style={{ maxWidth: '18rem' }}
        aria-label={t(prefix + 'search')} placeholder={t(prefix + 'search')}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <ButtonGroup size={'sm'} aria-label={t(prefix + 'type')}>
        {(['all', 'numeric', 'categorical'] as const).map((key) => (
          <Button key={key} variant={filter === key ? 'primary' : 'outline-primary'} onClick={() => setFilter(key)} aria-pressed={filter === key}>
            {t(prefix + key)} <Badge bg={filter === key ? 'light' : 'secondary'} text={filter === key ? 'dark' : undefined}>{counts[key]}</Badge>
          </Button>
        ))}
      </ButtonGroup>
      <ButtonGroup size={'sm'} className={'ms-auto'}>
        {(['cards', 'table'] as const).map((key) => (
          <Button key={key} variant={view === key ? 'secondary' : 'outline-secondary'} onClick={() => setView(key)} aria-pressed={view === key}>
            {t(prefix + 'view-' + key)}
          </Button>
        ))}
      </ButtonGroup>
    </div>

    {visible.length === 0 && <p className={'text-body-secondary'}>{t(prefix + 'no-results')}</p>}

    {view === 'table' && visible.length > 0 &&
      <div className={'overflow-x-auto'}>
        <Table size={'sm'} hover className={'n4l-eda-table align-middle'}>
          <thead>
            <tr>
              <th>{t(prefix + 'column')}</th>
              <th>{t(prefix + 'type')}</th>
              <th className={'text-end'}>{t(prefix + 'missing')}</th>
              <th className={'text-end'}>{t(prefix + 'distinct')}</th>
              <th className={'text-end'}>{t(prefix + 'mean')}</th>
              <th className={'text-end'}>{t(prefix + 'std')}</th>
              <th className={'text-end'}>{t(prefix + 'min')}</th>
              <th className={'text-end'}>{t(prefix + 'median')}</th>
              <th className={'text-end'}>{t(prefix + 'max')}</th>
              <th>{t(prefix + 'top')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((profile) => (
              <tr key={profile.name} className={profile.name === target ? 'n4l-eda-target-row' : undefined}>
                <th scope={'row'}><code>{profile.name}</code></th>
                <td>{t(prefix + 'kind-' + profile.kind)}</td>
                <td className={'text-end'}>{profile.missing > 0 ? `${format.format(profile.missing)} (${percent.format(profile.missing / rows(profile))})` : '0'}</td>
                <td className={'text-end'}>{format.format(profile.distinct)}</td>
                {(['mean', 'std', 'min', 'median', 'max'] as const).map((stat) => (
                  <td key={stat} className={'text-end'}>{profile.numeric ? format.format(profile.numeric[stat]) : '—'}</td>
                ))}
                <td className={'text-truncate'} style={{ maxWidth: '12rem' }}>{profile.top[0] ? `${profile.top[0].value} (${format.format(profile.top[0].count)})` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>}

    {view === 'cards' &&
      <Row xs={1} md={2} xxl={3} className={'g-3'}>
        {visible.map((profile) => (
          <Col key={profile.name}>
            <VariableCard profile={profile}
              numbers={numbers.get(profile.name)}
              isTarget={profile.name === target}
              meta={metaOf(profile.name)}
              format={format}
              percent={percent}
              onShowDistribution={() => onShowDistribution(profile.name)} />
          </Col>
        ))}
      </Row>}
  </>
}

type VariableCardProps = {
  profile           : ColumnProfile_t
  numbers?          : number[]
  isTarget          : boolean
  meta?             : DatasetVariable_t
  format            : Intl.NumberFormat
  percent           : Intl.NumberFormat
  onShowDistribution: () => void
}

function VariableCard({ profile, numbers, isTarget, meta, format, percent, onShowDistribution }: VariableCardProps) {
  const prefix = 'pages.dataframe.variables.'
  const { t } = useTranslation()
  const rows = profile.count + profile.missing
  return (
    <Card className={'h-100 n4l-eda-variable' + (isTarget ? ' n4l-eda-variable-target' : '')} data-testid={'Test-AnalyzeVariable'}>
      <Card.Body className={'d-flex flex-column gap-2'}>
        <div className={'d-flex flex-wrap align-items-center gap-2'}>
          <h4 className={'h6 mb-0 me-auto text-break'}><code className={'fs-6'}>{profile.name}</code></h4>
          {isTarget && <Badge bg={''} className={'n4l-target-badge'}>{t(prefix + 'target')}</Badge>}
          <Badge bg={profile.kind === 'numeric' ? 'primary' : 'secondary'}>{t(prefix + 'kind-' + profile.kind)}</Badge>
        </div>
        {(meta?.description || meta?.units) &&
          <p className={'small text-body-secondary mb-0'}>
            {meta.description}
            {meta.units && <>{meta.description ? ' · ' : ''}{t(prefix + 'units', { units: meta.units })}</>}
          </p>}
        <div className={'small d-flex flex-wrap column-gap-3'}>
          <span className={profile.missing > 0 ? 'text-warning-emphasis' : undefined}>
            {t(prefix + 'missing')}: <b>{format.format(profile.missing)}</b>{profile.missing > 0 && ` (${percent.format(profile.missing / rows)})`}
          </span>
          <span>{t(prefix + 'distinct')}: <b>{format.format(profile.distinct)}</b></span>
        </div>

        {profile.numeric && numbers && <>
          <MiniHistogram values={numbers} isTarget={isTarget} label={t(prefix + 'histogram-of', { column: profile.name })} />
          <dl className={'n4l-eda-stats small mb-0'}>
            {(['min', 'median', 'mean', 'max', 'std'] as const).map((stat) => (
              <div key={stat}><dt>{t(prefix + stat)}</dt><dd>{format.format(profile.numeric![stat])}</dd></div>
            ))}
          </dl>
        </>}

        {profile.kind === 'categorical' && <TopValues profile={profile} format={format} percent={percent} isTarget={isTarget} />}

        <div className={'mt-auto pt-1'}>
          <Button variant={'link'} size={'sm'} className={'p-0'} onClick={onShowDistribution}>{t(prefix + 'show-distribution')}</Button>
        </div>
      </Card.Body>
    </Card>
  )
}

/** Histograma pequeño en SVG: la forma de la distribución de un vistazo (sin ejes; el detalle está en Distribuciones) */
function MiniHistogram({ values, isTarget, label }: { values: number[], isTarget: boolean, label: string }) {
  const { counts } = useMemo(() => histogram(values), [values])
  const max = Math.max(...counts, 1)
  const width = 100 / Math.max(counts.length, 1)
  return (
    <svg className={'n4l-eda-histogram' + (isTarget ? ' n4l-eda-histogram-target' : '')} viewBox={'0 0 100 40'} preserveAspectRatio={'none'} role={'img'} aria-label={label}>
      {counts.map((count, index) => (
        <rect key={index} x={index * width + width * 0.08} width={width * 0.84} y={40 - (count / max) * 40} height={(count / max) * 40} />
      ))}
    </svg>
  )
}

/** Los valores más frecuentes con una barra de su proporción */
function TopValues({ profile, format, percent, isTarget }: { profile: ColumnProfile_t, format: Intl.NumberFormat, percent: Intl.NumberFormat, isTarget: boolean }) {
  const { t } = useTranslation()
  const shown = profile.top.slice(0, 5)
  return (
    <div className={'small'}>
      <div className={'text-body-secondary mb-1'}>{t('pages.dataframe.variables.top')}</div>
      <ul className={'list-unstyled mb-0 d-flex flex-column gap-1'}>
        {shown.map(({ value, count }) => (
          <li key={value} className={'n4l-eda-top'}>
            <span className={'text-truncate'} title={value}>{value}</span>
            <span className={'n4l-eda-top-bar' + (isTarget ? ' n4l-eda-top-bar-target' : '')} style={{ width: `${(count / profile.count) * 100}%` }} />
            <span className={'text-body-secondary text-nowrap'}>{format.format(count)} · {percent.format(count / profile.count)}</span>
          </li>
        ))}
      </ul>
      {profile.distinct > shown.length &&
        <div className={'text-body-secondary mt-1'}>{t('pages.dataframe.variables.more', { count: profile.distinct - shown.length })}</div>}
    </div>
  )
}
