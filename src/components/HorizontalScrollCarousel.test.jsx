import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HorizontalScrollCarousel from './HorizontalScrollCarousel'

vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useScroll: () => ({ scrollYProgress: { current: 0 } }),
  useTransform: (source, input, output) => output[0],
  useRef: () => ({ current: null }),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useRef: () => ({ current: null }),
  }
})

describe('HorizontalScrollCarousel', () => {
  it('renders without crashing', () => {
    render(<HorizontalScrollCarousel />)
    const section = screen.getByText('Title 1').closest('section')
    expect(section).toBeInTheDocument()
  })

  it('renders cards with titles', () => {
    render(<HorizontalScrollCarousel />)
    expect(screen.getByText('Title 1')).toBeInTheDocument()
    expect(screen.getByText('Title 2')).toBeInTheDocument()
    expect(screen.getByText('Title 8')).toBeInTheDocument()
  })

  it('has correct number of card titles', () => {
    render(<HorizontalScrollCarousel />)
    const titles = screen.getAllByText(/Title \d+/)
    expect(titles).toHaveLength(8)
  })

  it('cards have correct image URLs in style', () => {
    render(<HorizontalScrollCarousel />)
    const firstCard = screen.getByText('Title 1').closest('div')
    expect(firstCard).toHaveStyle({ backgroundImage: expect.stringContaining('https://www.ppa.com/assets/images/ppmag_articles/header-72020jaimayhew9.jpg') })
  })
})