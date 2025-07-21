import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    // Initial value should be returned immediately
    expect(result.current).toBe('initial')

    // Update the value
    rerender({ value: 'updated', delay: 500 })

    // Value should still be the initial value before debounce delay
    expect(result.current).toBe('initial')

    // Fast-forward time by 499ms (less than delay)
    act(() => {
      jest.advanceTimersByTime(499)
    })

    // Should still be initial value
    expect(result.current).toBe('initial')

    // Fast-forward the remaining time
    act(() => {
      jest.advanceTimersByTime(1)
    })

    // Now should be updated value
    expect(result.current).toBe('updated')
  })

  it('should reset debounce timer on value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    // Update the value
    rerender({ value: 'first-update', delay: 500 })

    // Fast-forward time by 300ms
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Update the value again before delay completes
    rerender({ value: 'second-update', delay: 500 })

    // Fast-forward time by 300ms (total 600ms from first update)
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Should still be initial value as timer was reset
    expect(result.current).toBe('initial')

    // Fast-forward remaining time for second update
    act(() => {
      jest.advanceTimersByTime(200)
    })

    // Now should be the second update
    expect(result.current).toBe('second-update')
  })
})
