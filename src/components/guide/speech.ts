import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Lectura en voz alta de la guía con la Web Speech API del navegador (speechSynthesis): sin servidor ni claves. Las
// voces son las del sistema; si no hay ninguna del idioma, el navegador lee con la suya por defecto.

/** Idioma de la app → etiqueta de idioma de las voces (la preferida; si no la hay, vale cualquiera del idioma) */
const SPEECH_LANGS: Record<string, string> = { es: 'es-ES', en: 'en-US', ja: 'ja-JP' }

/** Hasta dónde se junta texto en un mismo enunciado: Chrome corta los largos (unos 15 s) sin avisar */
const MAX_CHUNK = 180

export const speechLang = (language: string) => SPEECH_LANGS[language.slice(0, 2)] ?? language

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'

/** El texto en trozos cortos: frase a frase y, si una frase es muy larga, por sus comas */
export function splitSentences(text: string): string[] {
  // Tras ".", "!" o "?" con espacio (no parte "1.5"); en japonés, tras "。", "！" o "？", que no llevan espacio
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+|(?<=[。！？])/u).filter((sentence) => sentence.trim() !== '')
  const chunks: string[] = []
  for (const sentence of sentences) {
    if (sentence.length <= MAX_CHUNK) {
      chunks.push(sentence.trim())
      continue
    }
    let current = ''
    for (const part of sentence.split(/(?<=[,;:、])\s*/u)) {
      if (current !== '' && (current + ' ' + part).length > MAX_CHUNK) {
        chunks.push(current.trim())
        current = part
      } else {
        current = current === '' ? part : current + ' ' + part
      }
    }
    if (current.trim() !== '') chunks.push(current.trim())
  }
  return chunks
}

const normalizeLang = (lang: string) => lang.toLowerCase().replace('_', '-')

/**
 * La voz para un idioma: la elegida (`voiceURI`) si es de ese idioma; si no, la de su variante preferida (es-ES…) y,
 * si no la hay, otra del idioma. Entre varias, la del sistema primero.
 */
export function pickVoice(voices: SpeechSynthesisVoice[], language: string, voiceURI?: string): SpeechSynthesisVoice | null {
  const preferred = speechLang(language).toLowerCase()
  const base = preferred.slice(0, 2)
  const chosen = voiceURI ? voices.find((voice) => voice.voiceURI === voiceURI) : undefined
  if (chosen && normalizeLang(chosen.lang).startsWith(base)) return chosen
  const byDefault = (a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) => Number(b.default) - Number(a.default)
  const exact = voices.filter(({ lang }) => normalizeLang(lang) === preferred).sort(byDefault)
  if (exact.length > 0) return exact[0]
  const sameLanguage = voices.filter(({ lang }) => normalizeLang(lang).startsWith(base)).sort(byDefault)
  return sameLanguage[0] ?? null
}

/** Las voces de un idioma, para elegir: primero las de su variante preferida (es-ES…) y después por nombre */
export function voicesForLanguage(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice[] {
  const preferred = speechLang(language).toLowerCase()
  const base = preferred.slice(0, 2)
  return voices
    .filter(({ lang }) => normalizeLang(lang).startsWith(base))
    .sort((a, b) => Number(normalizeLang(b.lang) === preferred) - Number(normalizeLang(a.lang) === preferred) || a.name.localeCompare(b.name))
}

// Las voces del sistema: algunos navegadores (Chrome) las cargan después y avisan con "voiceschanged". La lista se
// guarda para devolver la misma mientras no cambie (useSyncExternalStore lo necesita)
let voicesSnapshot: SpeechSynthesisVoice[] = []
const NO_VOICES: SpeechSynthesisVoice[] = []

function readVoices() {
  if (!isSpeechSupported()) return NO_VOICES
  const voices = window.speechSynthesis.getVoices()
  const changed = voices.length !== voicesSnapshot.length || voices.some((voice, index) => voice.voiceURI !== voicesSnapshot[index]?.voiceURI)
  if (changed) voicesSnapshot = voices
  return voicesSnapshot
}

function subscribeVoices(listener: () => void) {
  if (!isSpeechSupported()) return () => {}
  const synth = window.speechSynthesis
  synth.addEventListener?.('voiceschanged', listener)
  return () => synth.removeEventListener?.('voiceschanged', listener)
}

/** Las voces del sistema (se actualiza cuando el navegador termina de cargarlas) */
export const useVoices = () => useSyncExternalStore(subscribeVoices, readVoices, () => NO_VOICES)

/** Lo que se tarda en leer un texto en voz alta, más o menos, en ms (para avanzar solo sin voz) */
export const readingMs = (text: string) => Math.max(3000, text.split(/\s+/).length * 380)

type SpeechOptions_t = {
  /** La voz elegida (si es del idioma); sin ella, pickVoice */
  voiceURI?: string
  /** Velocidad: 1 es la normal */
  rate?    : number
}

/**
 * Leer textos en voz alta. `speak` corta lo que se estuviera leyendo; `onEnd` solo llega si el texto se ha leído
 * entero (no si se ha cortado con otro `speak` o con `cancel`).
 */
export function useSpeech(appLanguage: string | undefined, { voiceURI, rate = 1 }: SpeechOptions_t = {}) {
  // Mientras i18next no ha resuelto el idioma, el del navegador
  const language = appLanguage || (typeof navigator === 'undefined' ? 'es' : navigator.language)
  const supported = isSpeechSupported()
  // Cada lectura tiene su número: los avisos de una lectura cortada (Chrome avisa de su fin) no cuentan
  const reading = useRef(0)
  const [speaking, setSpeaking] = useState(false)

  const cancel = useCallback(() => {
    reading.current += 1
    if (isSpeechSupported()) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!supported) return
    const synth = window.speechSynthesis
    const id = ++reading.current
    synth.cancel()
    const chunks = splitSentences(text)
    if (chunks.length === 0) return
    const voice = pickVoice(synth.getVoices(), language, voiceURI)
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk)
      utterance.lang = voice?.lang ?? speechLang(language)
      utterance.rate = rate
      if (voice) utterance.voice = voice
      if (index === 0) utterance.onstart = () => { if (id === reading.current) setSpeaking(true) }
      utterance.onerror = () => { if (id === reading.current) setSpeaking(false) }
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          if (id !== reading.current) return
          setSpeaking(false)
          onEnd?.()
        }
      }
      synth.speak(utterance)
    })
  }, [supported, language, voiceURI, rate])

  // Al salir de la página no se sigue leyendo
  useEffect(() => () => {
    reading.current += 1
    if (isSpeechSupported()) window.speechSynthesis.cancel()
  }, [])

  return { supported, speaking, speak, cancel }
}
