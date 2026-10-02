import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { pendingIdleJobs, scheduleIdle } from '@core/scheduler/idleQueue'
import N4LDeferredMount from '@components/loading/N4LDeferredMount'

describe('cola de tiempo libre', () => {

  test('un trabajo por hueco, en orden, y se pueden cancelar', async () => {
    const done: string[] = []
    scheduleIdle(() => done.push('a'))
    const cancel = scheduleIdle(() => done.push('b'))
    scheduleIdle(() => done.push('c'))
    cancel()
    expect(done).toEqual([])
    await vi.waitFor(() => expect(done).toEqual(['a', 'c']))
    expect(pendingIdleJobs()).toBe(0)
  })

  test('un trabajo que falla se registra y no para la cola', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const done: string[] = []
    scheduleIdle(() => { throw new Error('mal') })
    scheduleIdle(() => done.push('después'))
    await vi.waitFor(() => expect(done).toEqual(['después']))
    expect(error).toHaveBeenCalledWith('Idle job failed', expect.objectContaining({ message: 'mal' }))
    error.mockRestore()
  })

  test('N4LDeferredMount reserva el sitio y monta el contenido cuando le toca', async () => {
    render(<N4LDeferredMount minHeight={123}><p>contenido</p></N4LDeferredMount>)
    expect(screen.queryByText('contenido')).toBeNull()
    expect(screen.getByTestId('Test-DeferredMount')).toHaveStyle({ minHeight: '123px' })
    expect(await screen.findByText('contenido')).toBeInTheDocument()
  })
})
