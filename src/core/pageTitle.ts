import type { TFunction } from 'i18next'

import { pageContextFromPath } from '@core/analyticsPage'
import { taskOptions } from '@/TASK_OPTIONS'
import { isTask, TASK_INFO } from '@components/task/taskInfo'
import { projectDatasetByKey } from '@pages/analyze/projectDatasets'
import { UPLOAD } from '@/TASKS'

// El título de cada página (WCAG 2.4.2): lo primero que anuncia el lector de pantalla al llegar y lo que se ve en la
// pestaña y en el historial. De lo más concreto a lo más general: «Pasajeros de avión - Series temporales - Nets4Learning»

export const APP_NAME = 'Nets4Learning'

/** Las páginas fijas y la clave de su título */
const PAGE_TITLES: Record<string, string> = {
  home                  : 'header.home',
  manual                : 'pages.manual.title',
  glossary              : 'pages.glossary.title',
  datasets              : 'datasets.title',
  packages              : 'header.packages',
  analyze               : 'pages.dataframe.title',
  contribute            : 'pages.contribute.title',
  terms                 : 'pages.terms.title',
  version               : 'pages.version.title',
  settings              : 'pages.settings.title',
  accessibility         : 'pages.accessibility.title',
  learn                 : 'pages.learn.title',
  lab                   : 'pages.lab.title',
  report                : 'report.title',
  not_found             : 'pages.not-found.title',
  regression_description: 'pages.regression-description.title',
}

/** Las partes del título de una ruta (sin el nombre de la aplicación), ya traducidas */
export function pageTitleParts(pathname: string, search: string, t: TFunction): string[] {
  const { page_type, task, mode, item } = pageContextFromPath(pathname, search)
  const taskTitle = isTask(task) ? t(TASK_INFO[task].i18nTitle) : undefined
  const withTask = (...parts: string[]) => [...parts, ...(taskTitle !== undefined ? [taskTitle] : [])]

  switch (page_type) {
    case 'task':
      return withTask()
    case 'select_model':
      return withTask(t('breadcrumb.models'))
    case 'select_dataset':
      return withTask(t('breadcrumb.datasets'))
    case 'playground': {
      const kind = mode === 'pretrained' ? 'model' : 'dataset'
      const option = item === undefined || task === undefined ? undefined : taskOptions(task, kind).find(({ value }) => value === item)
      const name = item === UPLOAD ? t('pages.task.upload') : option !== undefined ? t(option.i18n) : item
      return withTask(...(name !== undefined ? [name] : []), t(kind === 'model' ? 'breadcrumb.models' : 'breadcrumb.datasets'))
    }
    case 'datasets': {
      const datasetsTask = new URLSearchParams(search).get('task') ?? undefined
      return [t(PAGE_TITLES.datasets), ...(isTask(datasetsTask) ? [t(TASK_INFO[datasetsTask].i18nTitle)] : [])]
    }
    case 'analyze': {
      const dataset = item === undefined ? undefined : projectDatasetByKey(item)
      return [...(dataset !== undefined ? [t(dataset.i18n)] : []), t(PAGE_TITLES.analyze)]
    }
    default:
      return PAGE_TITLES[page_type] !== undefined ? [t(PAGE_TITLES[page_type])] : []
  }
}

/** El título completo: las partes y, al final, el nombre de la aplicación */
export const pageTitle = (parts: string[]) => [...parts, APP_NAME].join(' - ')
