import { afterEach, describe, expect, test } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { askBeforeDownload, cancelPendingDownload, downloadReason, getDownloadWarning, resetDownloadConsent, setDownloadWarning, usePendingDownload } from '@core/models/downloadConsent'

describe('downloadConsent: preguntar antes de descargar un modelo grande', () => {
  afterEach(() => {
    cancelPendingDownload()
    resetDownloadConsent()
  })

  test('el motivo: ahorro de datos o conexión lenta en automático; siempre o nunca, según se pida', () => {
    expect(downloadReason('auto', { saveData: true, effectiveType: '4g' })).toBe('save-data')
    expect(downloadReason('auto', { effectiveType: '3g' })).toBe('slow')
    expect(downloadReason('auto', { effectiveType: '4g' })).toBeNull()
    expect(downloadReason('auto', undefined)).toBeNull()
    expect(downloadReason('always', undefined)).toBe('always')
    expect(downloadReason('never', { saveData: true })).toBeNull()
  })

  test('sin motivo, o con un modelo pequeño o sin tamaño conocido, la descarga sigue sin preguntar', async () => {
    await expect(askBeforeDownload('object-detection', 'COCO-SSD')).resolves.toBeUndefined()
    setDownloadWarning('always')
    await expect(askBeforeDownload('tabular-classification', 'IRIS')).resolves.toBeUndefined()
  })

  test('con «preguntar siempre», espera a que se acepte; lo aceptado ya no se vuelve a preguntar', async () => {
    setDownloadWarning('always')
    const { result } = renderHook(() => usePendingDownload())
    let finished = false
    let download: Promise<void> = Promise.resolve()
    act(() => {
      download = askBeforeDownload('object-detection', 'COCO-SSD').then(() => { finished = true })
    })
    expect(result.current).toMatchObject({ model: 'object-detection/COCO-SSD', mb: 17.7, reason: 'always' })
    await Promise.resolve()
    expect(finished).toBe(false)

    act(() => result.current!.accept())
    await download
    expect(finished).toBe(true)
    expect(result.current).toBeNull()
    await expect(askBeforeDownload('object-detection', 'COCO-SSD')).resolves.toBeUndefined()
    expect(result.current).toBeNull()
  })

  test('la preferencia se guarda en el navegador y "Restablecer todo" la devuelve a automático', () => {
    setDownloadWarning('never')
    expect(localStorage.getItem('n4l-download-warning')).toBe('never')
    resetDownloadConsent()
    expect(getDownloadWarning()).toBe('auto')
    expect(localStorage.getItem('n4l-download-warning')).toBeNull()
  })
})
