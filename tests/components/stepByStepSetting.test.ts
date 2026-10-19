import { describe, test, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  isStepByStepEnabled, resetStepByStep, setStepByStepEnabled, STEP_BY_STEP_STORAGE_KEY, useStepByStepEnabled,
} from '@components/neural-network/stepByStep/stepByStepSetting'

describe('ajuste de Paso a paso', () => {
  beforeEach(() => resetStepByStep())

  test('está oculto por defecto; al activarlo se guarda y las páginas se enteran al momento', () => {
    const { result } = renderHook(() => useStepByStepEnabled())
    expect(result.current).toBe(false)
    expect(localStorage.getItem(STEP_BY_STEP_STORAGE_KEY)).toBeNull()
    act(() => setStepByStepEnabled(true))
    expect(result.current).toBe(true)
    expect(isStepByStepEnabled()).toBe(true)
    expect(localStorage.getItem(STEP_BY_STEP_STORAGE_KEY)).toBe('true')
    // Desactivado no se guarda nada: vuelve a ser lo de por defecto
    act(() => setStepByStepEnabled(false))
    expect(result.current).toBe(false)
    expect(localStorage.getItem(STEP_BY_STEP_STORAGE_KEY)).toBeNull()
  })
})
