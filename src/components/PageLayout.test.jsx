import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageLayout from './PageLayout'

vi.mock('./Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}))

vi.mock('./Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

const TestChild = () => <div data-testid="page-content">Page Content</div>

describe('PageLayout', () => {
  it('renders Navbar', () => {
    render(<PageLayout><TestChild /></PageLayout>)
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('renders Footer', () => {
    render(<PageLayout><TestChild /></PageLayout>)
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(<PageLayout><TestChild /></PageLayout>)
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('has correct layout structure', () => {
    render(<PageLayout><TestChild /></PageLayout>)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('flex-grow')
    expect(main).toHaveClass('pt-20')
  })

  it('has min-h-screen on wrapper', () => {
    const { container } = render(<PageLayout><TestChild /></PageLayout>)
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('min-h-screen')
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('flex-col')
  })
})