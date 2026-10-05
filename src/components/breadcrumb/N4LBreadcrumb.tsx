import { Dropdown } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import { TASK_INFO } from '@components/task/taskInfo'
import { taskOptions, type TaskKind_t } from '@/TASK_OPTIONS'
import { UPLOAD, type TASKS_TYPE_V } from '@/TASKS'
import { useLocalPackageName } from '@hooks/useLocalPackages'

const KIND_I18N: Record<TaskKind_t, string> = {
  model  : 'breadcrumb.models',
  dataset: 'breadcrumb.datasets',
}

// Desde un modelo preentrenado se puede ir a entrenar con su dataset, y al revés (comparten la clave)
const OTHER_KIND: Record<TaskKind_t, { kind: TaskKind_t, i18n: string }> = {
  model  : { kind: 'dataset', i18n: 'breadcrumb.train-with-dataset' },
  dataset: { kind: 'model', i18n: 'breadcrumb.try-pretrained' },
}

type N4LBreadcrumbProps = {
  task    : TASKS_TYPE_V
  /** Sin él, la última miga es la tarea (su página: /task/<tarea>) */
  kind?   : TaskKind_t
  /** Modelo o dataset abierto en el playground; sin él, la última miga es la página de selección */
  example?: string
}

/**
 * Inicio › tarea › modelos preentrenados o entrenar › modelo o dataset abierto. La tarea lleva a su página (elegir
 * entre los modelos ya entrenados y diseñar una red) y la última miga es un desplegable para cambiar a otro modelo o dataset de la misma lista sin volver a la
 * página de selección (y, si existe, al dataset del modelo o al modelo del dataset). Siempre en una línea: si no cabe,
 * los nombres se recortan con puntos suspensivos.
 */
export default function N4LBreadcrumb(props: N4LBreadcrumbProps) {
  const { t } = useTranslation()
  const { i18nTitle } = TASK_INFO[props.task]
  if (props.kind === undefined) {
    return (
      <nav aria-label={t('breadcrumb.label')} className={'n4l-breadcrumb'} data-task={props.task} data-testid={'Test-Breadcrumb'}>
        <ol className={'breadcrumb mb-0'}>
          <li className={'breadcrumb-item'}>
            <Link to={'/'}><Trans i18nKey={'header.home'} /></Link>
          </li>
          <li className={'breadcrumb-item active'} aria-current={'page'}><span className={'text-truncate'}><Trans i18nKey={i18nTitle} /></span></li>
        </ol>
      </nav>
    )
  }
  return <N4LBreadcrumbKind {...props} kind={props.kind} />
}

function N4LBreadcrumbKind({ task, kind, example }: N4LBreadcrumbProps & { kind: TaskKind_t }) {
  const { t } = useTranslation()
  const { i18nTitle } = TASK_INFO[task]
  const options = taskOptions(task, kind)
  const current = options.find((option) => option.value === example)
  const upload = options.find(({ value }) => value === UPLOAD)
  const examples = options.filter(({ value }) => value !== UPLOAD)
  const other = OTHER_KIND[kind]
  const hasOther = example !== undefined && example !== UPLOAD && taskOptions(task, other.kind).some(({ value }) => value === example)
  const href = (value: string, itemKind: TaskKind_t = kind) => `/playground/${task}/${itemKind}/${value}`
  // Un paquete .n4l abierto por el usuario (local-<id>): su nombre, el guardado con él
  const localName = useLocalPackageName(task, example)
  const exampleName = (value: string) => localName ?? value

  const item = ({ i18n, value }: { i18n: string, value: string }) => (
    <Dropdown.Item key={value} as={Link} to={href(value)}
      active={value === example}
      aria-current={value === example ? 'page' : undefined}>
      {t(i18n)}
    </Dropdown.Item>
  )

  return (
    <nav aria-label={t('breadcrumb.label')} className={'n4l-breadcrumb'} data-task={task} data-testid={'Test-Breadcrumb'}>
      <ol className={'breadcrumb mb-0'}>
        <li className={'breadcrumb-item'}>
          <Link to={'/'}><Trans i18nKey={'header.home'} /></Link>
        </li>
        <li className={'breadcrumb-item n4l-breadcrumb-task'}>
          <Link to={`/task/${task}`}><Trans i18nKey={i18nTitle} /></Link>
        </li>
        {example === undefined
          ? <li className={'breadcrumb-item active'} aria-current={'page'}><span className={'text-truncate'}><Trans i18nKey={KIND_I18N[kind]} /></span></li>
          : <li className={'breadcrumb-item n4l-breadcrumb-kind'}>
            {/* Un paquete .n4l abierto por el usuario sale en su página, no en el menú de la tarea */}
            {localName !== null
              ? <Link className={'text-truncate'} to={'/packages'}><Trans i18nKey={'n4l.local.title'} /></Link>
              : <Link className={'text-truncate'} to={`/select-${kind}/${task}`}><Trans i18nKey={KIND_I18N[kind]} /></Link>}
          </li>
        }
        {example !== undefined &&
          <li className={'breadcrumb-item active n4l-breadcrumb-current'} aria-current={'page'}>
            <Dropdown className={'n4l-breadcrumb-dropdown'}>
              <Dropdown.Toggle variant={'link'} className={'n4l-breadcrumb-toggle'} title={t('breadcrumb.change')}>
                <span className={'text-truncate'}>{current !== undefined ? t(current.i18n) : exampleName(example)}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className={'n4l-breadcrumb-menu'}>
                {upload !== undefined && <>
                  {item(upload)}
                  <Dropdown.Divider />
                  <Dropdown.Header><Trans i18nKey={'pages.menu-selection-dataset.example-datasets'} /></Dropdown.Header>
                </>}
                {examples.map(item)}
                {hasOther && <>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to={href(example, other.kind)} data-testid={'Test-Breadcrumb-OtherKind'}>
                    <Trans i18nKey={other.i18n} /> →
                  </Dropdown.Item>
                </>}
              </Dropdown.Menu>
            </Dropdown>
          </li>
        }
      </ol>
    </nav>
  )
}
