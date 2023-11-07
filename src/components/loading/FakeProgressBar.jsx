import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { ProgressBar } from 'react-bootstrap';
import { VERBOSE } from '@/CONSTANTS';

export default function FakeProgressBar ({ isLoading }) {

  const { t } = useTranslation()
  const intervalRef = useRef()
  const [progress, setProgress] = useState(0)


  // CSS: animation: fadeHidden 1s ease-in-out forwards;
  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[]')
    let step = 0.25
    let current_progress = 0.1
    if (isLoading === false) {
      setProgress(100)
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      if (isLoading === false) {
        setProgress(100)
        clearInterval(intervalRef.current)
      } else {
        current_progress += step
        const _progress = Math.round(Math.atan(current_progress) / (Math.PI / 2) * 100 * 1000) / 1000
        setProgress(_progress)
        if (_progress >= 100) {
          clearInterval(intervalRef.current)
        } else if (_progress >= 80) {
          step = 0.15
        } else if (_progress >= 70) {
          step = 0.20
        }
      }
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isLoading])

  return <>
    <div className={isLoading ? '' : 'n4l-fade-hidden'}>
      <ProgressBar label={progress < 100 ? t('downloading') + ' ' + progress + '%' : t('downloaded')}
                   striped={true}
                   animated={true}
                   now={isLoading ? progress : 100}
      />
    </div>
  </>
}