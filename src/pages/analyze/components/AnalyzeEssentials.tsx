import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type * as dfd from 'danfojs'

import { dataWarnings, dataframeColumns, naturalCompare, type ColumnData_t, type DataFrameAnalysis_t, type ProblemType_t } from '@core/dataframe/eda'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { analyzeInWorker } from '../analysisClient'
import { datasetKey, datasetVariables, projectDatasetByKey, variableOf } from '../projectDatasets'
import AnalyzeSummary from './AnalyzeSummary'
import AnalyzeRelations from './AnalyzeRelations'

type AnalyzeEssentialsProps = {
  dataframe: dfd.DataFrame
  target   : string | null
  problem  : ProblemType_t
  /** Nombre del CSV: si es uno del proyecto, su ficha (las columnas de identificadores) y el enlace al AED completo */
  csv?     : string
}

/**
 * Lo más importante del análisis exploratorio (AED) de un conjunto ya cargado: tamaño, ausentes y repetidas, la
 * distribución del objetivo, los avisos y las relaciones entre variables (correlaciones y dispersión). El resto, en
 * /analyze. Se analiza en el mismo worker que el AED.
 */
export default function AnalyzeEssentials({ dataframe, target, problem, csv }: AnalyzeEssentialsProps) {
  const prefix = 'pages.dataframe.essentials.'
  const { t } = useTranslation()

  const columns = useMemo(() => dataframeColumns(dataframe), [dataframe])
  // El análisis, con las columnas de las que sale: si cambia el conjunto, el anterior ya no vale
  const [analyzed, setAnalyzed] = useState<{ columns: ColumnData_t[], analysis: DataFrameAnalysis_t } | null>(null)
  useEffect(() => {
    let current = true
    analyzeInWorker(columns).then((analysis) => {
      if (current) setAnalyzed({ columns, analysis })
    }).catch((error) => console.error(error))
    return () => {
      current = false
    }
  }, [columns])
  const analysis = analyzed?.columns === columns ? analyzed.analysis : null

  const project = csv === undefined ? undefined : projectDatasetByKey(datasetKey(csv))
  const variables = useMemo(() => (project ? datasetVariables(project.file) : undefined), [project])

  const profile = analysis?.profile
  const columnValues = useMemo(() => new Map(columns.map(({ name, values }) => [name, values])), [columns])
  const numbers = useMemo(() => new Map(Object.entries(analysis?.numbers ?? {})), [analysis])
  const correlations = useMemo(() => analysis?.correlations ?? { names: [], matrix: [] }, [analysis])
  const targetProfile = profile?.profiles.find(({ name }) => name === target)
  const classes = useMemo(() => (problem === 'classification' && targetProfile
    ? targetProfile.top.map(({ value }) => value).sort(naturalCompare)
    : []), [problem, targetProfile])
  const warnings = useMemo(() => {
    if (!profile) return []
    const identifiers = dataframe.columns.filter((column) => variableOf(variables, column)?.role === 'ID')
    return dataWarnings(profile, target, correlations, { problem, identifiers })
  }, [profile, target, correlations, problem, dataframe, variables])

  if (!profile) return <WaitingPlaceholder i18nKey_title={'pages.dataframe.analyzing'} />

  return <>
    <p className={'text-body-secondary'}>{t(prefix + 'help')}</p>
    <AnalyzeSummary profile={profile}
      targetProfile={targetProfile}
      targetNumbers={target === null ? undefined : numbers.get(target)}
      classes={classes}
      problem={problem}
      warnings={warnings} />

    <h4 className={'h5 mt-4'}>{t('pages.dataframe.relations.title')}</h4>
    <AnalyzeRelations correlations={correlations}
      columnValues={columnValues}
      numbers={numbers}
      target={target}
      problem={problem}
      classes={classes} />

    {project &&
      <div className={'mt-3 text-end'}>
        <Link to={'/analyze?dataset=' + datasetKey(project.file)} className={'btn btn-outline-primary btn-sm'}
          data-testid={'Test-AnalyzeEssentialsLink'}>
          {t(prefix + 'open')}
        </Link>
      </div>}
  </>
}
