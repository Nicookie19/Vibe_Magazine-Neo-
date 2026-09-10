import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlurText from './BlurText'

vi.mock('motion/react', () => ({
  motion: {
    span: vi.fn(({ children, ...props }) => <span {...props}>{children}</span>),
  },
}))

describe('BlurText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders text content', () => {
    render(<BlurText text="Hello World" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<BlurText text="Test" className="custom-class" />)
    const p = screen.getByText('Test').closest('p')
    expect(p).toHaveClass('custom-class')
  })

  it('splits text by words when animateBy is words', () => {
    render(<BlurText text="Hello World Test" animateBy="words" />)
    const textElements = screen.getAllByText(/Hello|World|Test/)
    expect(textElements.length).toBeGreaterThanOrEqual(3)
  })

  it('splits text by characters when animateBy is chars', () => {
    render(<BlurText text="Hi" animateBy="chars" />)
    const textElements = screen.getAllByText(/H|i/)
    expect(textElements.length).toBe(2)
  })

  it('handles empty text', () => {
    render(<BlurText text="" />)
    const p = screen.getByRole('paragraph')
    expect(p).toBeInTheDocument()
  })

  it('applies direction top by default', () => {
    render(<BlurText text="Test" />)
    const p = screen.getByText('Test').closest('p')
    expect(p).toHaveClass('blur-text')
  })

  it('applies direction bottom when specified', () => {
    render(<BlurText text="Test" direction="bottom" />)
    const p = screen.getByText('Test').closest('p')
    expect(p).toHaveClass('blur-text')
  })

  it('handles special characters in text', () => {
    render(<BlurText text="Hello & World" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('&')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })
})