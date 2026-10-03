import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Settings from '@pages/settings/Settings'
import { resetAllSettings } from '@pages/settings/storedSettings'
import { getGuideSettings, resetGuideSettings, updateGuideSettings } from '@components/guide/guideSettings'
import { readConsent } from '@core/analytics'
import { isStepByStepEnabled, resetStepByStep } from '@components/neural-network/stepByStep/stepByStepSetting'

// La voz del navegador, de mentira: jsdom no tiene speechSynthesis
class FakeUtterance {
  text: string
  constructor(text: string) {
    this.text = text
  }
}
const synth = { speak: vi.fn(), cancel: vi.fn(), getVoices: (): SpeechSynthesisVoice[] => [] }

const section = (id: string) => within(screen.getByTestId('Test-Settings-' + id))

function renderSettings() {
  render(<MemoryRouter><Settings /></MemoryRouter>)
}

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear()
    resetGuideSettings()
    document.cookie = 'n4l-accept-cookies=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  test('el tema: el elegido se recuerda y "como el sistema" lo olvida', () => {
    renderSettings()
    const select = section('appearance').getByLabelText('pages.settings.appearance.theme')
    expect(select).toHaveValue('system')

    fireEvent.change(select, { target: { value: 'dark' } })
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark')

    fireEvent.change(select, { target: { value: 'system' } })
    expect(localStorage.getItem('theme')).toBeNull()
  })

  test('la voz de las guías: los mismos ajustes que usa la guía', () => {
    renderSettings()
    const speech = section('speech')
    fireEvent.click(speech.getByLabelText('pages.settings.speech.auto'))
    expect(getGuideSettings().auto).toBe(true)
    fireEvent.change(speech.getByLabelText('pages.settings.speech.rate'), { target: { value: '1.5' } })
    expect(getGuideSettings().rate).toBe(1.5)

    // Y al revés: lo que cambia la guía se ve aquí
    act(() => updateGuideSettings({ voice: false }))
    expect(speech.getByLabelText('pages.settings.speech.voice')).not.toBeChecked()
    expect(speech.getByTestId('Test-Settings-SpeechTest')).toBeDisabled()
  })

  test('las guías, también las de entrenamiento, vuelven a empezar desde el principio', () => {
    localStorage.setItem('n4l-guide-progress.train.tabular-classification.CAR', JSON.stringify({ step: 5, open: false, savedAt: 1 }))
    localStorage.setItem('n4l-guide-progress.regression.WINE', JSON.stringify({ step: 3, open: false, savedAt: 1 }))
    renderSettings()
    const tutorials = section('tutorials')
    fireEvent.click(tutorials.getByText('pages.settings.tutorials.guides-reset'))
    expect(Object.keys(localStorage).filter((key) => key.startsWith('n4l-guide-progress.'))).toEqual([])
    expect(tutorials.getByRole('status')).toHaveTextContent('pages.settings.tutorials.done')
  })

  test('Paso a paso está oculto por defecto y se activa desde aquí', () => {
    resetStepByStep()
    renderSettings()
    const learning = section('learning')
    const toggle = learning.getByLabelText('pages.settings.learning.step-by-step')
    expect(toggle).not.toBeChecked()
    fireEvent.click(toggle)
    expect(isStepByStepEnabled()).toBe(true)
    expect(toggle).toBeChecked()
  })

  test('las cookies se aceptan y se rechazan desde aquí', () => {
    renderSettings()
    const privacy = section('privacy')
    expect(privacy.getByText('pages.settings.privacy.status-undecided')).toBeInTheDocument()
    fireEvent.click(privacy.getByLabelText('pages.settings.privacy.analytics'))
    expect(readConsent()).toBe('accepted')
    fireEvent.click(privacy.getByLabelText('pages.settings.privacy.analytics'))
    expect(readConsent()).toBe('rejected')
  })

  test('restablecer todo borra los ajustes de la aplicación y nada más', async () => {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('language', 'ja')
    localStorage.setItem('tf-backend', 'wasm')
    localStorage.setItem('n4l-guide-progress.regression.WINE', JSON.stringify({ step: 3, open: false, savedAt: 1 }))
    localStorage.setItem('tabular-classification.joyride-CAR', '{}')
    localStorage.setItem('n4l-step-by-step', 'true')
    localStorage.setItem('n4l-download-warning', 'always')
    localStorage.setItem('n4l-downloads-accepted', '["object-detection/COCO-SSD"]')
    localStorage.setItem('n4l-learning-path', JSON.stringify({ started: true, done: ['train'] }))
    localStorage.setItem('otra-web', 'no se toca')
    updateGuideSettings({ auto: true })
    document.cookie = 'n4l-accept-cookies=true;path=/'

    await resetAllSettings()
    expect(Object.keys(localStorage)).toEqual(['otra-web'])
    expect(isStepByStepEnabled()).toBe(false)
    expect(getGuideSettings().auto).toBe(false)
    expect(readConsent()).toBeNull()
  })
})
