import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TextParallaxContentExample } from './TextParallaxContent'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
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

vi.mock('react-icons/fi', () => ({
  FiArrowUpRight: () => <svg data-testid="arrow-up-right" />,
}))

describe('TextParallaxContentExample', () => {
  it('renders heading', () => {
    render(<TextParallaxContentExample />)
    expect(screen.getByText('Welcome to Vibe')).toBeInTheDocument()
  })

  it('renders "What Vibe is" heading', () => {
    render(<TextParallaxContentExample />)
    expect(screen.getByText('What Vibe is')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<TextParallaxContentExample />)
    expect(screen.getByText(/Empower your organization/i)).toBeInTheDocument()
    expect(screen.getByText(/With a modular system/i)).toBeInTheDocument()
  })

  it('renders learn more button', () => {
    render(<TextParallaxContentExample />)
    const button = screen.getByRole('button', { name: /learn more/i })
    expect(button).toBeInTheDocument()
  })
})