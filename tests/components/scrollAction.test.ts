import { describe, expect, test } from 'vitest'
import { NavigationType } from 'react-router'

import { scrollAction } from '@components/navigation/scrollAction'

const page = (pathname: string, hash = '') => ({ pathname, hash })

describe('scrollAction: el scroll al cambiar de página', () => {
  test('una página nueva empieza arriba (también entre conjuntos de datos del mismo entrenador)', () => {
    expect(scrollAction(page('/glossary'), page('/manual'), NavigationType.Push, undefined)).toEqual({ type: 'top' })
    expect(scrollAction(page('/playground/tabular-classification/dataset/IRIS'), page('/playground/tabular-classification/dataset/CAR'), NavigationType.Push, 1200))
      .toEqual({ type: 'top' })
  })

  test('con #sección, a la sección; atrás y adelante, a donde se estaba', () => {
    expect(scrollAction(page('/settings'), page('/terms-and-conditions', '#cookies'), NavigationType.Push, undefined)).toEqual({ type: 'hash', id: 'cookies' })
    expect(scrollAction(page('/manual'), page('/glossary'), NavigationType.Pop, 2400)).toEqual({ type: 'restore', y: 2400 })
    // Sin posición guardada (p. ej. historial de antes de cargar la aplicación): como una página nueva
    expect(scrollAction(page('/manual'), page('/glossary'), NavigationType.Pop, undefined)).toEqual({ type: 'top' })
  })

  test('en la misma página (secciones, ?task=…) no se toca; al entrar, solo la sección si la hay', () => {
    expect(scrollAction(page('/glossary'), page('/glossary', '#glossary-loss'), NavigationType.Push, undefined)).toEqual({ type: 'none' })
    expect(scrollAction(null, page('/learn'), NavigationType.Pop, undefined)).toEqual({ type: 'none' })
    expect(scrollAction(null, page('/learn', '#challenges'), NavigationType.Pop, undefined)).toEqual({ type: 'hash', id: 'challenges' })
  })

  test('lo que va tras # y no es una sección (un enlace compartido) no se busca', () => {
    expect(scrollAction(null, page('/playground/tabular-classification/dataset/IRIS', '#n4z=q1YqKs4vSgk'), NavigationType.Pop, undefined)).toEqual({ type: 'none' })
    expect(scrollAction(page('/'), page('/playground/regression/dataset/SALARY', '#n4z=abc'), NavigationType.Push, undefined)).toEqual({ type: 'top' })
  })
})
