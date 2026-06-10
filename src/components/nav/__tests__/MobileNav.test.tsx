import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileNav } from '../MobileNav'

// next/navigation is a Next.js internal — mock it so Vitest can import the component.
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// next/link has no real router in jsdom; provide a minimal mock that:
//   - renders children via a plain <a> (so labels/links are visible)
//   - exports useLinkStatus returning pending:false (the idle / non-navigation state)
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
  useLinkStatus: () => ({ pending: false }),
}))

import { usePathname } from 'next/navigation'
const mockUsePathname = usePathname as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockUsePathname.mockReturnValue('/dashboard')
})

describe('MobileNav', () => {
  it('renders all three navigation labels', () => {
    render(<MobileNav />)
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Tariffs')).toBeDefined()
    expect(screen.getByText('Readings')).toBeDefined()
  })

  it('renders links pointing to the correct hrefs', () => {
    const { container } = render(<MobileNav />)
    const anchors = container.querySelectorAll('a')
    const hrefs = Array.from(anchors).map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/tariffs')
    expect(hrefs).toContain('/readings')
  })

  it('applies the active colour class to the current route link', () => {
    mockUsePathname.mockReturnValue('/tariffs')
    const { container } = render(<MobileNav />)
    const anchors = container.querySelectorAll('a')
    const tariffsLink = Array.from(anchors).find(a => a.getAttribute('href') === '/tariffs')!
    const dashboardLink = Array.from(anchors).find(a => a.getAttribute('href') === '/dashboard')!

    expect(tariffsLink.className).toContain('text-green-600')
    expect(dashboardLink.className).not.toContain('text-green-600')
    expect(dashboardLink.className).toContain('text-gray-500')
  })

  it('marks /readings as active when pathname starts with /readings', () => {
    mockUsePathname.mockReturnValue('/readings')
    const { container } = render(<MobileNav />)
    const readingsLink = Array.from(container.querySelectorAll('a')).find(
      a => a.getAttribute('href') === '/readings',
    )!
    expect(readingsLink.className).toContain('text-green-600')
  })

  it('does not apply pending pulse classes when navigation is idle', () => {
    render(<MobileNav />)
    // useLinkStatus returns pending:false via the mock — no animate-pulse on the span
    const spans = screen.getAllByText(/Dashboard|Tariffs|Readings/)
    for (const span of spans) {
      expect(span.className ?? '').not.toContain('opacity-60')
    }
  })
})
