import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SmoothScrollHero } from './SmoothScrollHero'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    img: ({ ...props }) => <img {...props} />,
  },
  useAnimation: () => ({ start: vi.fn() }),
  useScroll: () => ({ scrollY: { current: 0 }, scrollYProgress: { current: 0 } }),
  useTransform: (source, input, output) => output[0],
  useMotionTemplate: (strings, ...values) => values.join(''),
  useRef: () => ({ current: null }),
}))

vi.mock('lenis/dist/lenis-react', () => ({
  ReactLenis: ({ children, ...props }) => <div {...props}>{children}</div>,
}))

vi.mock('react-icons/fi', () => ({
  FiMapPin: () => <svg data-testid="map-pin" />,
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useRef: () => ({ current: null }),
    useEffect: (fn) => fn(),
  }
})

describe('SmoothScrollHero', () => {
  it('renders without crashing', () => {
    render(<SmoothScrollHero />)
    expect(screen.getByText('Vibe Event')).toBeInTheDocument()
  })

  it('renders schedule items', () => {
    render(<SmoothScrollHero />)
    expect(screen.getByText('Party')).toBeInTheDocument()
    expect(screen.getByText('Anniversary')).toBeInTheDocument()
    expect(screen.getByText('ASTRA Event')).toBeInTheDocument()
  })

  it('renders schedule dates and locations', () => {
    render(<SmoothScrollHero />)
    expect(screen.getByText('Dec 9th')).toBeInTheDocument()
    const fatherCelga = screen.getAllByText('Father Celga')
    expect(fatherCelga.length).toBeGreaterThanOrEqual(1)
    const boni = screen.getAllByText('Boni')
    expect(boni.length).toBeGreaterThanOrEqual(1)
    const bajada = screen.getAllByText('Bajada')
    expect(bajada.length).toBeGreaterThanOrEqual(1)
  })
})