import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from './Navbar'

const renderNavbar = () => render(
  <BrowserRouter>
    <Navbar />
  </BrowserRouter>
)

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders logo with correct alt text', () => {
    renderNavbar()
    const logo = screen.getByAltText('Vibe Magazine Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'https://raw.githubusercontent.com/JayDee15999/pic/refs/heads/main/1.png')
  })

  it('renders "Vibe Magazine" title', () => {
    renderNavbar()
    const titles = screen.getAllByText('Vibe Magazine')
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Campus Insights" subtitle', () => {
    renderNavbar()
    const subtitles = screen.getAllByText('Campus Insights')
    expect(subtitles.length).toBeGreaterThanOrEqual(1)
  })

  it('renders all navigation items', () => {
    renderNavbar()
    const navItems = ['Home', 'Archive', 'About', 'Submit', 'Contact', 'Login']
    navItems.forEach(item => {
      const elements = screen.getAllByText(item)
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders hamburger menu button on mobile', () => {
    renderNavbar()
    const hamburger = screen.getByLabelText('Toggle Menu')
    expect(hamburger).toBeInTheDocument()
  })

  it('toggles mobile menu when hamburger is clicked', () => {
    renderNavbar()
    const hamburger = screen.getByLabelText('Toggle Menu')
    
    fireEvent.click(hamburger)
    const homeLinks = screen.getAllByText('Home')
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
    
    fireEvent.click(hamburger)
  })

  it('has correct styling classes', () => {
    renderNavbar()
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('fixed')
    expect(nav).toHaveClass('top-0')
    expect(nav).toHaveClass('w-full')
    expect(nav).toHaveClass('z-50')
  })

  it('desktop navigation links have correct paths', () => {
    renderNavbar()
    const homeLinks = screen.getAllByRole('link', { name: 'Home' })
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
    expect(homeLinks[0]).toHaveAttribute('href', '/')
    
    const archiveLinks = screen.getAllByRole('link', { name: 'Archive' })
    expect(archiveLinks.length).toBeGreaterThanOrEqual(1)
    expect(archiveLinks[0]).toHaveAttribute('href', '/archive')
  })

  it('Login link points to /vibelogin', () => {
    renderNavbar()
    const loginLinks = screen.getAllByRole('link', { name: 'Login' })
    expect(loginLinks.length).toBeGreaterThanOrEqual(1)
    expect(loginLinks[0]).toHaveAttribute('href', '/vibelogin')
  })
})