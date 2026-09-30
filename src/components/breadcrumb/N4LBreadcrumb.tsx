import { Dropdown } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import { TASK_INFO } from '@components/task/taskInfo'
import { taskOptions, type TaskKind_t } from '@/TASK_OPTIONS'
import type { TASKS_TYPE_V } from '@/TASKS'

const KIND_I18N: Record<TaskKind_t, string> = {
  model  : 'breadcrumb.models',
  dataset: 'breadcrumb.datasets',
}

type N4LBreadcrumbProps = {
  task    : TASKS_TYPE_V
  kind    : TaskKind_t
  /** Modelo o dataset abierto en el playground; sin él, la última miga es la página de selección */
  example?: string
}

/**
 * Inicio › tarea › modelos preentrenados o entrenar › modelo o dataset abierto. La última miga es un desplegable
 * para cambiar a otro modelo o dataset de la misma lista sin volver a la página de selección.
 */
export default function N4LBreadcrumb({ task, kind, example }: N4LBreadcrumbProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { i18nTitle } = TASK_INFO[task]
  const options = taskOptions(task, kind)
  const current = options.find((option) => option.value === example)

  return (
    <nav aria-label={t('breadcrumb.label')} data-task={task} data-testid={'Test-Breadcrumb'}>
      <ol className={'breadcrumb mb-0 align-items-center'}>
        <li className={'breadcrumb-item'}>
          <Link to={'/'}><Trans i18nKey={'header.home'} /></Link>
        </li>
        <li className={'breadcrumb-item'}>
          <Trans i18nKey={i18nTitle} />
        </li>
        {example === undefined
          ? <li className={'breadcrumb-item active'} aria-current={'page'}><Trans i18nKey={KIND_I18N[kind]} /></li>
          : <li className={'breadcrumb-item'}><Link to={`/select-${kind}/${task}`}><Trans i18nKey={KIND_I18N[kind]} /></Link></li>
        }
        {example !== undefined &&
          <li className={'breadcrumb-item active'} aria-current={'page'}>
            <Dropdown className={'d-inline-block'}>
              <Dropdown.Toggle variant={'link'} className={'n4l-breadcrumb-toggle'} title={t('breadcrumb.change')}>
                {current !== undefined ? t(current.i18n) : example}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {options.map(({ i18n, value }) => (
                  <Dropdown.Item key={value}
                    active={value === example}
                    onClick={() => navigate(`/playground/${task}/${kind}/${value}`)}>
                    {t(i18n)}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </li>
        }
      </ol>
    </nav>
  )
}
