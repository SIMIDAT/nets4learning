import { useRef } from 'react'
import { Button } from 'react-bootstrap'
import { Trans } from 'react-i18next'

type N4LSessionButtonsProps = {
  onExport: () => void
  /** Recibe el texto del fichero elegido */
  onImport: (text: string) => void
}

/** Exportar e importar la configuración (capas e hiperparámetros) de una página de entrenamiento como JSON */
export default function N4LSessionButtons({ onExport, onImport }: N4LSessionButtonsProps) {
  const input_ref = useRef<HTMLInputElement>(null)

  const handleChange_File = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Se vacía para poder volver a elegir el mismo fichero
    event.target.value = ''
    if (file !== undefined) onImport(await file.text())
  }

  return (
    <>
      <Button size={'sm'} variant={'outline-primary'} className={'text-nowrap'} onClick={onExport}>
        <Trans i18nKey={'session.export'} />
      </Button>
      <Button size={'sm'} variant={'outline-primary'} className={'text-nowrap'} onClick={() => input_ref.current?.click()}>
        <Trans i18nKey={'session.import'} />
      </Button>
      <input ref={input_ref} type={'file'} accept={'.json,application/json'} className={'d-none'}
        data-testid={'Test-SessionImport'} onChange={handleChange_File} />
    </>
  )
}
