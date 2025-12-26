import 'bootstrap/dist/css/bootstrap.min.css'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from 'react-bootstrap'
import { VERBOSE } from '@/CONSTANTS'

type FakeProgressBarProps = {
  isLoading: boolean
}
export default function FakeProgressBar(props: FakeProgressBarProps) {
  const { isLoading } = props

  const { t } = useTranslation()
  // const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [progress, setProgress] = useState<number>(0)

  // CSS: animation: fadeHidden 1s ease-in-out forwards;
  // useEffect(() => {
  //   if (VERBOSE) console.debug('useEffect[]')
  //   let step = 0.25
  //   let current_progress = 0.1
  //   if (isLoading === false) {
  //     setProgress(100)
  //     clearInterval(intervalRef.current)
  //   }
  //   intervalRef.current = setInterval(() => {
  //     if (isLoading === false) {
  //       setProgress(100)
  //       clearInterval(intervalRef.current)
  //     } else {
  //       current_progress += step
  //       const _progress = Math.round(Math.atan(current_progress) / (Math.PI / 2) * 100 * 1000) / 1000
  //       setProgress(_progress)
  //       if (_progress >= 100) {
  //         clearInterval(intervalRef.current)
  //       } else if (_progress >= 80) {
  //         step = 0.15
  //       } else if (_progress >= 70) {
  //         step = 0.20
  //       }
  //     }
  //   }, 1000)
  //   return () => clearInterval(intervalRef.current)
  // }, [isLoading])
  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[isLoading]', isLoading);

    // 1. Completion State: If loading is done, snap to 100% immediately
    if (!isLoading) {
      // TODO FIX
      setProgress(100) // eslint-disable-line
      return // Exit the effect, no interval needed
    }

    // 2. Loading State: Initialize variables
    let currentInput = 0 // The 'x' in atan(x)
    let step = 0.05      // Smaller steps because we update more often

    // 3. Start Animation Loop (50ms = 20fps)
    const intervalId = setInterval(() => {
      currentInput += step;

      // Calculate percentage based on atan curve
      // Result is 0.0 to 1.0, multiplied by 100
      const _progress = (Math.atan(currentInput) / (Math.PI / 2)) * 100;

      // Round to 1 decimal place for cleanliness
      setProgress(Math.round(_progress * 10) / 10);

      // Dynamic friction: Slow down the 'step' as we get higher
      if (_progress >= 70) {
        step = 0.01 // Crawl very slowly past 70%
      } else if (_progress >= 50) {
        step = 0.025;
      }

    }, 50) // Updates every 50ms instead of 1000ms

    // 4. Cleanup
    return () => clearInterval(intervalId);
  }, [isLoading]);

  return <>
    <div className={isLoading ? '' : 'n4l-fade-hidden'}>
      <ProgressBar
        label={progress < 100 ? t('downloading') + ' ' + progress + '%' : t('downloaded')}
        striped={true}
        animated={true}
        now={isLoading ? progress : 100}
      />
    </div>
  </>
}