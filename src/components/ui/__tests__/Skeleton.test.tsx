import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('renders a div with aria-hidden="true"', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe('DIV')
    expect(el.getAttribute('aria-hidden')).toBe('true')
  })

  it('always includes the base animate-pulse and bg-gray-200 classes', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('animate-pulse')
    expect(el.className).toContain('bg-gray-200')
  })

  it('appends the passed className to the base classes', () => {
    const { container } = render(<Skeleton className="h-8 w-40" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('h-8')
    expect(el.className).toContain('w-40')
    // Base classes are still present
    expect(el.className).toContain('animate-pulse')
  })

  it('renders with no className prop without throwing', () => {
    // className defaults to '' — should not throw or add trailing whitespace issues
    expect(() => render(<Skeleton />)).not.toThrow()
  })
})
