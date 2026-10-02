import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Settings from '@pages/settings/Settings'
import { countSeenTrainingTutorials, resetAllSettings } from '@pages/settings/storedSettings'
import { getGuideSettings, resetGuideSettings, updateGuideSettings } from '@components/guide/guideSettings'
import { readConsent } from '@core/analytics'

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

  test('los tutoriales de entrenamiento ya vistos vuelven a salir', () => {
    localStorage.setItem('tabular-classification.joyride-CAR', JSON.stringify({ seen: true }))
    localStorage.setItem('regression.joyride-AUTO_MPG', JSON.stringify({ seen: true }))
    renderSettings()
    const tutorials = section('tutorials')
    fireEvent.click(tutorials.getByText('pages.settings.tutorials.training-reset'))
    expect(countSeenTrainingTutorials()).toBe(0)
    expect(tutorials.getByText('pages.settings.tutorials.training-reset')).toBeDisabled()
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

  test('restablecer todo borra los ajustes de la aplicación y nada más', () => {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('language', 'ja')
    localStorage.setItem('tf-backend', 'wasm')
    localStorage.setItem('n4l-guide-progress.regression.WINE', JSON.stringify({ step: 3, open: false, savedAt: 1 }))
    localStorage.setItem('tabular-classification.joyride-CAR', '{}')
    localStorage.setItem('otra-web', 'no se toca')
    updateGuideSettings({ auto: true })
    document.cookie = 'n4l-accept-cookies=true;path=/'

    resetAllSettings()
    expect(Object.keys(localStorage)).toEqual(['otra-web'])
    expect(getGuideSettings().auto).toBe(false)
    expect(readConsent()).toBeNull()
  })
})
