import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from 'react-bootstrap'
import N4LMarkdown from '@components/markdown/N4LMarkdown'

export default function N4LMarkdownDownloader ({ file_name, download = true, base = `${process.env.REACT_APP_PATH}/docs/wiki/` }) {
  const { t } = useTranslation()
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchFile = async (file_name) => {
      try {
        const url = `${base}${file_name}`
        const response = await fetch(url)
        if (!response.ok) {
          console.error('Error, download failed')
        }
        if (response.ok) {
          const reader = response.body.getReader()
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
              content += new TextDecoder('utf-8').decode(value)
            }
            if (!done) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
              return read()
            }
          }

          await read()
          setLoading(false)
          return content
        }
      } catch (error) {
        console.error(`Error in download ${file_name}`, error)
      }
    }
    if (download) {
      fetchFile(file_name)
        .then((file_content) => {
          setData({
            file_name   : file_name,
            file_content: file_content,
          })
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [base, file_name, download])

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