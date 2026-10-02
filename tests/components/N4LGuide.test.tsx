import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import N4LGuide, { type GuideStep_t } from '@components/guide/N4LGuide'
import { pickVoice, speechLang, splitSentences } from '@components/guide/speech'
import { readGuideProgress, RESTORE_MS, shouldRestore } from '@components/guide/guideProgress'
import { getGuideSettings, resetGuideSettings } from '@components/guide/guideSettings'

// En medio de la pantalla: jsdom no maqueta y así no depende de dónde estén los elementos
const STEPS: GuideStep_t[] = [
  { target: 'body', placement: 'center', title: 'Uno', content: 'El primer paso.' },
  { target: 'body', placement: 'center', title: 'Dos', content: 'El segundo paso.' },
  { target: 'body', placement: 'center', title: '¿Tres?', content: 'El último paso.' },
]

// La voz del navegador, de mentira: jsdom no tiene speechSynthesis
class FakeUtterance {
  text   : string
  lang = ''
  voice  : unknown = null
  onstart: (() => void) | null = null
  onend  : (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}
const spoken: FakeUtterance[] = []
const synth = {
  speak    : vi.fn((utterance: FakeUtterance) => { spoken.push(utterance) }),
  cancel   : vi.fn(),
  getVoices: (): SpeechSynthesisVoice[] => [],
}

const tooltip = () => screen.queryByTestId('Test-GuideTooltip')
const spokenText = () => spoken.map(({ text }) => text).join(' ')
const click = async (element: Element) => {
  await act(async () => {
    fireEvent.click(element)
  })
}

describe('speech', () => {
  test('parte el texto en frases (sin partir los decimales) y las muy largas por sus comas', () => {
    expect(splitSentences('Hola. El valor es 1.5 aquí. ¿Ya?')).toEqual(['Hola.', 'El valor es 1.5 aquí.', '¿Ya?'])
    expect(splitSentences('これは例です。次へ進みます。')).toEqual(['これは例です。', '次へ進みます。'])
    const long = Array.from({ length: 12 }, (_, index) => `una parte bastante larga número ${index}`).join(', ') + '.'
    const chunks = splitSentences(long)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((chunk) => chunk.length <= 180)).toBe(true)
    expect(chunks.join(' ')).toBe(long)
  })

  test('elige la voz de la variante preferida del idioma y, si no, otra del idioma', () => {
    const voice = (lang: string, isDefault = false) => ({ lang, default: isDefault, name: lang }) as SpeechSynthesisVoice
    expect(pickVoice([voice('en-US'), voice('es-MX'), voice('es-ES')], 'es')?.lang).toBe('es-ES')
    expect(pickVoice([voice('en-US'), voice('es-MX')], 'es')?.lang).toBe('es-MX')
    expect(pickVoice([voice('es_ES', true)], 'es')?.lang).toBe('es_ES')
    expect(pickVoice([voice('en-US')], 'ja')).toBeNull()
    expect(speechLang('ja')).toBe('ja-JP')
  })
})

describe('N4LGuide', () => {
  beforeEach(() => {
    spoken.length = 0
    synth.speak.mockClear()
    synth.cancel.mockClear()
    localStorage.clear()
    resetGuideSettings()
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  })
  afterEach(() => {
    // Se desmonta (y corta la voz) antes de quitar la voz de mentira
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('solo empieza con el botón, lee cada paso en voz alta y se cierra', async () => {
    render(<N4LGuide id={'prueba'} steps={STEPS} />)
    expect(tooltip()).toBeNull()
    expect(synth.speak).not.toHaveBeenCalled()

    await click(screen.getByTestId('Test-GuideButton'))
    expect(await screen.findByText('El primer paso.')).toBeInTheDocument()
    expect(spokenText()).toBe('Uno. El primer paso.')

    // Al pasar de paso se corta lo que se leía y se lee el nuevo
    spoken.length = 0
    await click(screen.getByText('guide.next'))
    expect(await screen.findByText('El segundo paso.')).toBeInTheDocument()
    expect(synth.cancel).toHaveBeenCalled()
    expect(spokenText()).toBe('Dos. El segundo paso.')

    // Sin voz no se lee nada (y la preferencia se recuerda)
    spoken.length = 0
    await click(screen.getByTestId('Test-GuideVoice'))
    await click(screen.getByText('guide.next'))
    expect(await screen.findByText('El último paso.')).toBeInTheDocument()
    expect(spoken).toEqual([])
    expect(getGuideSettings().voice).toBe(false)

    // Con la voz otra vez: un título que acaba en "?" no lleva además un punto
    await click(screen.getByTestId('Test-GuideVoice'))
    expect(spokenText()).toBe('¿Tres? El último paso.')

    await click(screen.getByRole('button', { name: 'guide.close' }))
    expect(tooltip()).toBeNull()
  })

  test('avanzando solo, pasa al siguiente paso al terminar de leer el actual', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<N4LGuide id={'prueba'} steps={STEPS} />)
    await click(screen.getByTestId('Test-GuideButton'))
    expect(await screen.findByText('El primer paso.')).toBeInTheDocument()
    await click(screen.getByTestId('Test-GuideAuto'))

    // Hasta que no termina de leer, sigue en el mismo paso
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.getByText('El primer paso.')).toBeInTheDocument()

    await act(async () => {
      spoken.at(-1)!.onend!()
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(await screen.findByText('El segundo paso.')).toBeInTheDocument()
  })

  test('guarda por qué paso va: cerrada, el botón sigue desde ahí; terminada, vuelve a empezar', async () => {
    render(<N4LGuide id={'prueba'} steps={STEPS} />)
    await click(screen.getByTestId('Test-GuideButton'))
    await click(await screen.findByText('guide.next'))
    expect(await screen.findByText('El segundo paso.')).toBeInTheDocument()
    expect(readGuideProgress('prueba')).toMatchObject({ step: 1, open: true })

    await click(screen.getByRole('button', { name: 'guide.close' }))
    expect(tooltip()).toBeNull()
    expect(readGuideProgress('prueba')).toMatchObject({ step: 1, open: false })
    expect(screen.getByTestId('Test-GuideButton')).toHaveTextContent('guide.resume')

    await click(screen.getByTestId('Test-GuideButton'))
    expect(await screen.findByText('El segundo paso.')).toBeInTheDocument()
    // "Volver al principio"
    await click(screen.getByTestId('Test-GuideRestart'))
    expect(await screen.findByText('El primer paso.')).toBeInTheDocument()
    expect(readGuideProgress('prueba')).toMatchObject({ step: 0, open: true })

    await click(screen.getByText('guide.next'))
    await click(await screen.findByText('guide.next'))
    await click(await screen.findByText('guide.finish'))
    expect(tooltip()).toBeNull()
    expect(readGuideProgress('prueba')).toBeNull()
    expect(screen.getByTestId('Test-GuideButton')).toHaveTextContent('guide.button')
  })

  test('abierta al recargar la página, se vuelve a abrir sola en su paso y lo lee al tocar la página', async () => {
    localStorage.setItem('n4l-guide-progress.prueba', JSON.stringify({ step: 1, open: true, savedAt: Date.now() }))
    // Recién cargada, el navegador no deja hablar hasta que se toca algo
    Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: false }, configurable: true })
    try {
      render(<N4LGuide id={'prueba'} steps={STEPS} />)
      expect(await screen.findByText('El segundo paso.')).toBeInTheDocument()
      expect(synth.speak).not.toHaveBeenCalled()

      await click(document.body)
      expect(spokenText()).toBe('Dos. El segundo paso.')
    } finally {
      Reflect.deleteProperty(navigator, 'userActivation')
    }
  })

  test('el desplegable de pasos va directamente a cualquiera', async () => {
    render(<N4LGuide id={'prueba'} steps={STEPS} />)
    await click(screen.getByTestId('Test-GuideButton'))
    expect(await screen.findByText('El primer paso.')).toBeInTheDocument()
    await act(async () => {
      fireEvent.change(screen.getByTestId('Test-GuideStepSelect'), { target: { value: '2' } })
    })
    expect(await screen.findByText('El último paso.')).toBeInTheDocument()
    expect(readGuideProgress('prueba')).toMatchObject({ step: 2, open: true })
  })

  test('el desplegable de voces tiene las del idioma de la aplicación y, al cambiarla, vuelve a leer el paso con ella', async () => {
    const voice = (name: string, lang: string, localService = true) => ({ name, lang, voiceURI: name, localService, default: false }) as SpeechSynthesisVoice
    const voices = [voice('Laura', 'es-ES'), voice('Jorge', 'es-MX', false), voice('Samantha', 'en-US')]
    vi.spyOn(synth, 'getVoices').mockReturnValue(voices)
    // El t de los tests no tiene idioma: el del navegador de jsdom es inglés
    Object.defineProperty(navigator, 'language', { value: 'es-ES', configurable: true })
    try {
      render(<N4LGuide id={'prueba'} steps={STEPS} />)
      await click(screen.getByTestId('Test-GuideButton'))
      expect(await screen.findByText('El primer paso.')).toBeInTheDocument()
      const select = screen.getByTestId('Test-GuideVoiceSelect') as HTMLSelectElement
      // Automática, las dos de español (la de España primero) y la que funciona en un servidor, marcada
      expect(Array.from(select.options).map(({ text }) => text)).toEqual(['guide.voice-auto', 'Laura', 'Jorge · guide.voice-online'])

      spoken.length = 0
      await act(async () => {
        fireEvent.change(select, { target: { value: 'Jorge' } })
      })
      expect(getGuideSettings().voices).toEqual({ es: 'Jorge' })
      expect(spoken.at(-1)?.voice).toBe(voices[1])
      expect(spokenText()).toBe('Uno. El primer paso.')
    } finally {
      Reflect.deleteProperty(navigator, 'language')
    }
  })

  test('abierta hace más de una hora, no se abre sola: se sigue con el botón', async () => {
    localStorage.setItem('n4l-guide-progress.prueba', JSON.stringify({ step: 2, open: true, savedAt: Date.now() - RESTORE_MS - 1000 }))
    render(<N4LGuide id={'prueba'} steps={STEPS} />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
    })
    expect(tooltip()).toBeNull()
    expect(screen.getByTestId('Test-GuideButton')).toHaveTextContent('guide.resume')
  })
})

describe('guideProgress', () => {
  test('lo guardado mal o a medias no cuenta', () => {
    localStorage.setItem('n4l-guide-progress.mal', '{no es json')
    expect(readGuideProgress('mal')).toBeNull()
    localStorage.setItem('n4l-guide-progress.mal', JSON.stringify({ step: -1, savedAt: 1 }))
    expect(readGuideProgress('mal')).toBeNull()
    expect(shouldRestore({ step: 3, open: false, savedAt: Date.now() })).toBe(false)
    expect(shouldRestore({ step: 3, open: true, savedAt: Date.now() })).toBe(true)
    expect(shouldRestore(null)).toBe(false)
  })
})
