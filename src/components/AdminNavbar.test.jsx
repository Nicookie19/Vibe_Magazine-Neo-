import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
  auth: {
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
}))

const renderAdminNavbar = (props = {}) => {
  const defaultProps = {
    activeTab: 'upload',
    setActiveTab: vi.fn(),
    ...props,
  }
  return render(
    <BrowserRouter>
      <AdminNavbar {...defaultProps} />
    </BrowserRouter>
  )
}

describe('AdminNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders logo with correct alt text', () => {
    renderAdminNavbar()
    const logos = screen.getAllByAltText('Vibe Magazine Logo')
    expect(logos.length).toBeGreaterThanOrEqual(1)
    expect(logos[0]).toHaveAttribute('src', 'https://raw.githubusercontent.com/JayDee15999/pic/refs/heads/main/1.png')
  })

  it('renders "Vibe Magazine Admin Dashboard" title', () => {
    renderAdminNavbar()
    const titles = screen.getAllByText('Vibe Magazine')
    expect(titles.length).toBeGreaterThanOrEqual(1)
    const dashboards = screen.getAllByText('Admin Dashboard')
    expect(dashboards.length).toBeGreaterThanOrEqual(1)
  })

  it('renders all default tabs', () => {
    renderAdminNavbar()
    const tabs = ['Upload & Edit', 'Analytics', 'Submissions', 'Feedback', 'Comments', 'Library']
    tabs.forEach(tab => {
      expect(screen.getByText(tab)).toBeInTheDocument()
    })
  })

  it('renders User Management tab when super admin', () => {
    localStorage.setItem('vibeSuperAdmin', 'true')
    renderAdminNavbar()
    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  it('does not render User Management tab when not super admin', () => {
    localStorage.setItem('vibeSuperAdmin', 'false')
    renderAdminNavbar()
    expect(screen.queryByText('User Management')).not.toBeInTheDocument()
  })

  it('highlights active tab', () => {
    renderAdminNavbar({ activeTab: 'analytics' })
    const analyticsTab = screen.getByText('Analytics').closest('button')
    expect(analyticsTab).toHaveClass('bg-gradient-to-r')
    expect(analyticsTab).toHaveClass('from-purple-600')
  })

  it('calls handleTabClick when tab is clicked', () => {
    const setActiveTab = vi.fn()
    renderAdminNavbar({ setActiveTab })
    fireEvent.click(screen.getByText('Analytics'))
    expect(setActiveTab).toHaveBeenCalledWith('analytics')
  })

  it('renders logout button', () => {
    renderAdminNavbar()
    const logoutBtns = screen.getAllByRole('button', { name: /logout/i })
    expect(logoutBtns.length).toBeGreaterThanOrEqual(1)
  })

  it('has correct styling classes', () => {
    renderAdminNavbar()
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('bg-gradient-to-r')
    expect(nav).toHaveClass('sticky')
    expect(nav).toHaveClass('top-0')
    expect(nav).toHaveClass('z-20')
  })
})