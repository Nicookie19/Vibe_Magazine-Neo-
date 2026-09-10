import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { supabase } from '../supabaseClient'

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while checking auth', () => {
    supabase.auth.getSession.mockImplementation(() => new Promise(() => {}))

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    expect(screen.getByText('Verifying access...')).toBeInTheDocument()
    const spinner = screen.getByText('Verifying access...').closest('div').querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders children when authenticated', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: '123' } } },
      error: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('redirects when not authenticated', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles auth check error gracefully', async () => {
    supabase.auth.getSession.mockRejectedValue(new Error('Network error'))

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})