import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from 'react-bootstrap'
import N4LMarkdown from '@components/markdown/N4LMarkdown'

type N4LMarkdownDownloaderProps = {
  file_name    : string
  download?    : boolean
  base?        : string
  /** Carpeta de la que se descarga el fichero si no existe en `base` (p. ej. un idioma sin traducir). */
  fallbackBase?: string
}

// Si el fichero no existe, el servidor responde con el index.html de la SPA en vez de un 404
const isMarkdownResponse = (response: Response) => {
  return response.ok && !(response.headers.get('content-type') ?? '').includes('text/html')
}

export default function N4LMarkdownDownloader ({ file_name, download = true, base = `${import.meta.env.VITE_PATH}/docs/wiki/`, fallbackBase }: N4LMarkdownDownloaderProps) {
  const { t } = useTranslation()
  const [data, setData] = useState({file_name: '', file_content: ''})
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchFile = async (file_name: string): Promise<string> => {
      try {
        let response = await fetch(`${base}${file_name}`)
        if (!isMarkdownResponse(response) && fallbackBase && fallbackBase !== base) {
          console.warn(`${base}${file_name} not found, using ${fallbackBase}`)
          response = await fetch(`${fallbackBase}${file_name}`)
        }
        if (!isMarkdownResponse(response) || !response.body) {
          console.error('Error, download failed')
          setLoading(false)
          return ''
        }
        const reader = response.body.getReader()
        // Un único decoder en modo stream: un carácter multibyte (p. ej. japonés) puede quedar partido entre dos trozos
        const decoder = new TextDecoder('utf-8')
        const totalSize = Number(response.headers.get('content-length'))
        let totalSizeDownload = 0
        let percentage = 1
        let content = ''

        async function read () {
          const { value, done } = await reader.read()
          if (value) {
            totalSizeDownload += value.length
            percentage = Math.floor((totalSizeDownload / totalSize) * 100)
            setProgress(percentage)
            content += decoder.decode(value, { stream: true })
          }
          if (!done) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return read()
          }
          content += decoder.decode()
        }

        await read()
        setLoading(false)
        return content
      } catch (error) {
        console.error(`Error in download ${file_name}`, error)
        setLoading(false)
      }

      return ''
    }
    if (download) {
      fetchFile(file_name)
        .then((file_content = '') => {
          setData({
            file_name   : file_name,
            file_content: file_content,
          })
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [base, fallbackBase, file_name, download])

  return <>
    {loading && <>
      <ProgressBar label={progress < 100 ? t('downloading') : t('downloaded')}
                   striped={true}
                   animated={true}
                   now={progress} />
    </>}
    {!loading && <>
      <N4LMarkdown>{data.file_content}</N4LMarkdown>
    </>}
  </>
}