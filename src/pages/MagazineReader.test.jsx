import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MagazineReader from './MagazineReader';
import { supabase } from '../supabaseClient';

vi.unmock('react-router-dom');
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/pdf-worker.mjs' }));

describe('direct magazine links', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders the unavailable state without subscribing to a null magazine', async () => {
    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
    render(<MemoryRouter initialEntries={['/magazine/missing']}>
      <Routes><Route path="/magazine/:id" element={<MagazineReader />} /></Routes>
    </MemoryRouter>);
    expect(await screen.findByText('This magazine is no longer available.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to archive' })).toBeInTheDocument();
  });
  it('handles a reader URL without an id or navigation state', async () => {
    render(<MemoryRouter><MagazineReader /></MemoryRouter>);
    expect(await screen.findByText('This magazine could not be loaded.')).toBeInTheDocument();
  });
});
