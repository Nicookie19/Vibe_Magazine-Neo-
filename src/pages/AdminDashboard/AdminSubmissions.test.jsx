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
    supabase.functions.invoke.mockResolvedValue({ data: null, error: { message: "Email not configured" } });
    publish = vi.fn().mockResolvedValue({ error: null });
    updateResult = vi.fn().mockResolvedValue({ data: { ...submission, status: 'Accepted' }, error: null });
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() };
    supabase.channel = vi.fn(() => channel);
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.from.mockImplementation(table => table === 'magazines' ? { insert: publish } : {
      select: vi.fn(() => ({ order: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ range: vi.fn().mockResolvedValue({ data: [submission], error: null }) }) }) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: updateResult })) })) })),
    });
  });

  it('publishes an accepted submission and offers a manual Gmail draft', async () => {
    render(<AdminSubmissions />);
    fireEvent.click(await screen.findByTitle('Accept submission'));
    await waitFor(() => expect(publish).toHaveBeenCalledWith([expect.objectContaining({ title: 'Test Story', published: true, pdfurl: submission.file_url })]));
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Open Gmail draft' })).toHaveAttribute('target', '_blank');
    expect(toast.success).not.toHaveBeenCalledWith(expect.stringContaining('notification sent'), expect.anything());
  });

  it('does not publish when the database rejects acceptance', async () => {
    updateResult.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
    render(<AdminSubmissions />);
    fireEvent.click(await screen.findByTitle('Accept submission'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Permission denied'), expect.anything()));
    expect(publish).not.toHaveBeenCalled();
  });
  it('requires remarks and saves them together with rejected status', async () => {
    updateResult.mockResolvedValue({ data: { ...submission, status: 'Rejected', rejection_remarks: 'Please cite your sources.' }, error: null });
    render(<AdminSubmissions />);
    fireEvent.click(await screen.findByTitle('Reject submission'));
    fireEvent.change(screen.getByLabelText('Reviewer remarks'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rejection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please explain');
    expect(updateResult).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Reviewer remarks'), { target: { value: 'Please cite your sources.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rejection' }));
    expect(await screen.findByText('Rejection remarks: Please cite your sources.')).toBeInTheDocument();
    expect(screen.getByTitle('Reject submission')).toBeDisabled();
    expect(screen.getByTitle('Accept submission')).toBeDisabled();
    expect(screen.getByTitle('Edit rejection remarks')).toBeEnabled();
    fireEvent.click(screen.getByTitle('Edit rejection remarks'));
    expect(screen.getByLabelText('Reviewer remarks')).toHaveValue('Please cite your sources.');
    expect(screen.getByRole('button', { name: 'Save remarks' })).toBeInTheDocument();
    expect(publish).not.toHaveBeenCalled();
  });

  it('keeps the remarks dialog open when saving fails', async () => {
    updateResult.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
    render(<AdminSubmissions />);
    fireEvent.click(await screen.findByTitle('Reject submission'));
    fireEvent.change(screen.getByLabelText('Reviewer remarks'), { target: { value: 'Please revise.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rejection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.getByLabelText('Reviewer remarks')).toHaveValue('Please revise.');
  });

  it('displays the publication deadline in Philippine time', async () => {
    render(<AdminSubmissions />);
    expect(await screen.findByText(/Publication due:/)).toHaveTextContent('Oct 4, 2026');
    expect(screen.getByText(/Publication due:/)).toHaveTextContent('PHT');
  });

  it('prepares a rejection draft from saved remarks without sending or republishing', async () => {
    updateResult.mockResolvedValue({ data: { ...submission, status: 'Rejected', rejection_remarks: 'Please revise.' }, error: null });
    render(<AdminSubmissions />);
    fireEvent.click(await screen.findByTitle('Reject submission'));
    fireEvent.change(screen.getByLabelText('Reviewer remarks'), { target: { value: 'Please revise.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rejection' }));
    const link = await screen.findByRole('link', { name: 'Open Gmail draft' });
    const params = new URL(link.href).searchParams;
    expect(params.get('to')).toBe(submission.student_email);
    expect(params.get('body')).toContain('Please revise.');
    expect(updateResult).toHaveBeenCalledTimes(1);
    expect(publish).not.toHaveBeenCalled();
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

});

describe('database-confirmed submission deletion', () => {
  let deletion, rows;
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.functions.invoke.mockResolvedValue({ data: null, error: { message: "Email not configured" } });
    rows = [{ ...submission, status: 'Accepted' }];
    deletion = vi.fn().mockResolvedValue({ data: { id: submission.id }, error: null });
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() };
    supabase.channel = vi.fn(() => channel);
    supabase.from.mockImplementation(() => ({
      select: vi.fn(() => ({ order: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({
        range: vi.fn(async () => ({ data: rows, error: null })),
      }) }) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: deletion })) })) })),
    }));
  });
  const confirmDelete = async () => {
    fireEvent.click(await screen.findByTitle('Delete submission'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  };
  it('keeps approved submissions visible when RLS silently deletes zero rows', async () => {
    deletion.mockResolvedValue({ data: null, error: null });
    const { unmount } = render(<AdminSubmissions />);
    await confirmDelete();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('did not confirm deletion')));
    expect(screen.getByTitle('Delete submission')).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    unmount();
    render(<AdminSubmissions />);
    expect(await screen.findByTitle('Delete submission')).toBeInTheDocument();
  });
  it('shows database errors and keeps the submission available for retry', async () => {
    deletion.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
    render(<AdminSubmissions />);
    await confirmDelete();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Permission denied')));
    expect(screen.getByTitle('Delete submission')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete', exact: true })).toBeEnabled();
  });
  it('removes an approved row only after confirmation and stays removed on reload', async () => {
    deletion.mockImplementation(async () => {
      rows = [];
      return { data: { id: submission.id }, error: null };
    });
    const { unmount } = render(<AdminSubmissions />);
    await confirmDelete();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Submission deleted.'));
    expect(screen.queryByTitle('Delete submission')).not.toBeInTheDocument();
    unmount();
    render(<AdminSubmissions />);
    await screen.findByText('Student Submissions');
    expect(screen.queryByTitle('Delete submission')).not.toBeInTheDocument();
  });
});
