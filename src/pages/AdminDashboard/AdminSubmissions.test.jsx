import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import AdminSubmissions from './AdminSubmissions';
import { supabase } from '../../supabaseClient';

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const submission = {
  id: 'submission-1', full_name: 'Test Student', student_email: 'student@example.com',
  title_of_work: 'Test Story', status: 'Pending', category: 'Design Project',
  submitted_at: '2026-10-01', file_url: 'https://example.com/story.pdf',
};
let publish;
let updateResult;

describe('submission acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publish = vi.fn().mockResolvedValue({ error: null });
    updateResult = vi.fn().mockResolvedValue({ data: { ...submission, status: 'Accepted' }, error: null });
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() };
    supabase.channel = vi.fn(() => channel);
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.from.mockImplementation(table => table === 'magazines' ? { insert: publish } : {
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [submission], error: null }) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: updateResult })) })) })),
    });
  });

  it('publishes an accepted submission even when notification delivery is unavailable', async () => {
    render(<AdminSubmissions />);
    fireEvent.click(await screen.findByTitle('Accept submission'));
    await waitFor(() => expect(publish).toHaveBeenCalledWith([expect.objectContaining({ title: 'Test Story', published: true, pdfurl: submission.file_url })]));
    expect(toast.warn).toHaveBeenCalledWith(expect.stringContaining('notification email was not sent'));
    expect(toast.success).not.toHaveBeenCalledWith(expect.stringContaining('notification sent'), expect.anything());
  });

  it('does not publish when the database rejects acceptance', async () => {
    updateResult.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
    render(<AdminSubmissions />);
    fireEvent.click(await screen.findByTitle('Accept submission'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Permission denied'), expect.anything()));
    expect(publish).not.toHaveBeenCalled();
  });
});
