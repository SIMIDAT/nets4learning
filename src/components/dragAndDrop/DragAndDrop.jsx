import React, { useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

const baseStyle = {
  flex           : 1,
  display        : 'flex',
  flexDirection  : 'column',
  alignItems     : 'center',
  padding        : '20px',
  borderWidth    : 2,
  borderRadius   : 3,
  borderColor    : '#b1b1b1',
  borderStyle    : 'dashed',
  backgroundColor: 'var(--bc-drag-and-drop)',
  color          : '#bdbdbd',
  outline        : 'none',
  transition     : 'border .24s ease-in-out',
}
//     border-color: rgb(177 177 177);
//     border-style: dashed;
//     background-color: rgb(229 229 229);

const focusedStyle = {
  borderColor: '#2196f3',
}

const acceptStyle = {
  borderColor: '#00e676',
}

const rejectStyle = {
  borderColor: '#ff1744',
}

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

/**
 * Drop zone component.
 * 
 * @param {DragAndDropProps} props - The properties for the drop zone component.
 */
export default function DragAndDrop (props) {
  const {
    name,
    id,
    accept,
    text,
    labelFiles = 'Files',
    multiple = false,
    function_DropAccepted = (files, event) => console.log('function_DropAccepted', { files, event }),
    function_DropRejected = (files, event) => console.log('function_DropRejected', { files, event }),
  } = props
  const { t } = useTranslation()

  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    onDropAccepted: (files, event) => function_DropAccepted(files, event),
    onDropRejected: (files, event) => function_DropRejected(files, event) ,
    accept        : accept,
    multiple      : multiple,
  })
  const styles = useMemo(() => ({
    ...baseStyle,
    ...(isFocused ? focusedStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {}),
  }), [
    isFocused,
    isDragAccept,
    isDragReject,
  ])

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
          {errors.map(e => <li key={e.code}>{e.message}</li>)}
        </ul>
      </li>
    )
  })

  return (
    <section className="container p-0">
      <div {...getRootProps({ style: styles, name })}>
        <input id={id}{...getInputProps()} />
        <p className={'mb-0'}>{text}</p>
      </div>
      <aside className={'mt-2'}>
        <p className={'text-muted'}>{labelFiles ?? t('Files')}</p>
        <ul>{acceptedFileItems}</ul>
        <ul>{rejectionFileItems}</ul>
      </aside>
    </section>
  )
}