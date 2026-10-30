import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConfirmSignup from './ConfirmSignup';
import { supabase } from '../supabaseClient';

describe('email confirmation', () => {
  beforeEach(() => { vi.clearAllMocks(); window.location.hash = ''; });
  it('does not claim success for a missing or expired link', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    render(<MemoryRouter><ConfirmSignup /></MemoryRouter>);
    expect(await screen.findByText(/incomplete or expired/)).toBeInTheDocument();
    expect(screen.queryByText(/Your email has been confirmed/)).not.toBeInTheDocument();
  });
  it('shows a verified confirmation and clears the session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { email: 'reader@example.com', email_confirmed_at: '2026-01-01' } } }, error: null });
    render(<MemoryRouter><ConfirmSignup /></MemoryRouter>);
    expect(await screen.findByText(/Your email has been confirmed for reader/)).toBeInTheDocument();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
