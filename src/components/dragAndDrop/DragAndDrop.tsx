import { useId, useMemo } from 'react'
import { useDropzone, type DropEvent, type DropzoneRootProps, type FileRejection } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

import { trackEvent } from '@core/analytics'

// Para las analíticas, del fichero solo la extensión: el nombre puede ser personal
const fileFormat = (fileName: string) => fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : 'none'

const baseStyle = {
  flex           : 1,
  display        : 'flex',
  flexWrap       : 'wrap',
  alignItems     : 'center',
  gap            : '0.75rem',
  padding        : '20px',
  borderWidth    : 2,
  borderRadius   : 3,
  // El borde dice dónde está la zona: al menos 3:1 sobre la tarjeta en los dos temas (WCAG 1.4.11; el #b1b1b1 de antes
  // se quedaba en 2,1:1 sobre blanco)
  borderColor    : 'var(--n4l-input-border-color)',
  borderStyle    : 'dashed',
  backgroundColor: 'var(--bc-drag-and-drop)',
  // El gris secundario del tema: se lee sobre el fondo de la zona en el tema claro y en el oscuro (el #bdbdbd de antes
  // se quedaba en 1,5:1 sobre el gris claro)
  color          : 'var(--bs-secondary-color)',
  transition     : 'border .24s ease-in-out',
} as const

// Al arrastrar un fichero encima: verde si se admite y rojo si no (los de Bootstrap, con contraste en los dos temas)
const acceptStyle = {
  borderColor: 'var(--bs-success)',
}

const rejectStyle = {
  borderColor: 'var(--bs-danger)',
}

/** Los motivos de rechazo de react-dropzone que se traducen (el resto, con su mensaje en inglés) */
const REJECTION_CODES = ['file-invalid-type', 'file-too-large', 'file-too-small', 'too-many-files']

/**
 * Properties for the drop zone component.
 * 
 * @typedef {Object} DragAndDropProps
 * @property {string} name - The name of the drop zone.
 * @property {string} id - The ID of the drop zone.
 * @property {import('react-dropzone').Accept} accept - The accepted file types.
 * @property {string} text - The text to display in the drop zone.
 * @property {string} [labelFiles='Files'] - The label for files (default is 'Files').
 * @property {boolean} [multiple=false] - Whether multiple files can be dropped (default is false).
 * @property {function(File[], import('react-dropzone').DropEvent): void} [function_DropAccepted] - Function called when files are accepted.
 * @property {function(import('react-dropzone').FileRejection[], import('react-dropzone').DropEvent): void} [function_DropRejected] - Function called when files are rejected.
 */
type DragAndDropProps = {
  name                  : string
  id                    : string
  accept                : import('react-dropzone').Accept
  text                  : string
  labelFiles?           : string
  multiple?             : boolean
  function_DropAccepted?: (files: File[], event: DropEvent) => void
  function_DropRejected?: (files: FileRejection[], event: DropEvent) => void
}

/**
 * Drop zone component.
 * 
 * @param {DragAndDropProps} props - The properties for the drop zone component.
 */
export default function DragAndDrop (props: DragAndDropProps) {
  const {
    name,
    id,
    accept,
    text,
    labelFiles = 'Files',
    multiple = false,
    function_DropAccepted = () => {},
    function_DropRejected = () => {},
  } = props
  const { t } = useTranslation()

  const {
    getRootProps,
    getInputProps,
    open,
    isDragAccept,
    isDragReject,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    onDropAccepted: (files, event) => {
      for (const file of files) trackEvent('file_upload', { zone: name, format: fileFormat(file.name), size_kb: Math.round(file.size / 1024) })
      function_DropAccepted(files, event)
    },
    onDropRejected: (files, event) => {
      for (const { file } of files) trackEvent('file_rejected', { zone: name, format: fileFormat(file.name) })
      function_DropRejected(files, event)
    },
    accept    : accept,
    multiple  : multiple,
    // Con el teclado se usa el botón «Elegir fichero» (un botón de verdad, con su nombre): la zona no recibe el foco
    noKeyboard: true,
    noClick   : true,
  })
  const styles = useMemo(() => ({
    ...baseStyle,
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {}),
  }), [
    isDragAccept,
    isDragReject,
  ])
  const helpId = useId()

  const acceptedFileItems = acceptedFiles.map((file) => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
    </li>
  ))
  const rejectionFileItems = fileRejections.map(({ file, errors }) => {
    return (
      <li key={file.name}>
        {file.name} - {file.size} bytes
        <ul>
          {errors.map(e => <li key={e.code}>{REJECTION_CODES.includes(e.code) ? t('drag-and-drop.errors.' + e.code) : e.message}</li>)}
        </ul>
      </li>
    )
  })

  // Con el ratón, un clic en cualquier parte de la zona también abre el selector de ficheros
  const dropzone_root_props: DropzoneRootProps = { style: styles, name, onClick: open }

  return (
    <section className="container p-0">
      {/* Se suelta el fichero en la zona o se elige con el botón; el botón dice qué formatos admite (aria-describedby) */}
      <div {...getRootProps(dropzone_root_props)}>
        <input id={id} {...getInputProps({ 'aria-label': text })} />
        <button type={'button'} className={'btn btn-outline-primary btn-sm'} aria-describedby={helpId}
          onClick={(event) => {
            event.stopPropagation()
            open()
          }}>
          {t(multiple ? 'drag-and-drop.choose-files' : 'drag-and-drop.choose-file')}
        </button>
        <p id={helpId} className={'mb-0'}>{text}</p>
      </div>
      {/* Lo aceptado y lo rechazado se anuncia al cambiar, sin mover el foco (WCAG 4.1.3) */}
      <div className={'mt-2'} role={'status'} aria-live={'polite'}>
        <p className={'text-muted'}>{labelFiles ?? t('Files')}</p>
        <ul>{acceptedFileItems}</ul>
        <ul className={'text-danger-emphasis'}>{rejectionFileItems}</ul>
      </div>
    </section>
  )
}