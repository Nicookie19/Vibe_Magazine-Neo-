import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  const currentYear = new Date().getFullYear()

  it('renders university name', () => {
    render(<Footer />)
    expect(screen.getByText('University of the Immaculate Conception')).toBeInTheDocument()
  })

  it('renders department name', () => {
    render(<Footer />)
    expect(screen.getByText('Department of Digital Innovation')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    render(<Footer />)
    expect(screen.getByText(`© ${currentYear} All Rights Reserved`)).toBeInTheDocument()
  })

  it('renders Facebook link with correct href', () => {
    render(<Footer />)
    const facebookLink = screen.getByRole('link', { name: 'Follow us on Facebook' })
    expect(facebookLink).toHaveAttribute('href', 'https://www.facebook.com/uicvibe')
    expect(facebookLink).toHaveAttribute('target', '_blank')
    expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders UIC logo image', () => {
    render(<Footer />)
    const logo = screen.getByAltText('University of the Immaculate Conception Logo')
    expect(logo).toHaveAttribute('src', 'https://raw.githubusercontent.com/NotJayDee119/pic/refs/heads/main/uic-logo2-(1).png')
  })

  it('has correct footer styling classes', () => {
    render(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('bg-[#0b1012]', 'border-brand-500/30')
  })
})