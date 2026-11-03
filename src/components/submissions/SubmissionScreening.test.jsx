import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SubmissionScreening from './SubmissionScreening';
import { extractSubmissionText } from '../../utils/extractSubmissionText';
vi.mock('../../utils/extractSubmissionText', () => ({ extractSubmissionText: vi.fn() }));
const submissions = [{ id: 'a', title_of_work: 'First story', category: 'Fiction', full_name: 'Author', student_email: 'author@example.com', file_url: 'first.pdf' }];
describe('screening panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    extractSubmissionText.mockResolvedValue({ pages: [{ page: 1, text: 'A brief clean story.' }], warnings: [] });
  });
  it('scans only on request and marks reports stale after a file changes', async () => {
    const { rerender } = render(<SubmissionScreening submissions={submissions} />);
    expect(extractSubmissionText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Scan all submissions' }));
    expect(await screen.findByText('First story — No flags found')).toBeInTheDocument();
    rerender(<SubmissionScreening submissions={[{ ...submissions[0], file_url: 'changed.pdf' }]} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Scan again');
    expect(screen.queryByText('First story — No flags found')).not.toBeInTheDocument();
  });
  it('shows unreadable files as incomplete, never clear', async () => {
    extractSubmissionText.mockRejectedValue(new Error('Unreadable PDF'));
    render(<SubmissionScreening submissions={submissions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Scan all submissions' }));
    expect(await screen.findByText('First story — Incomplete scan')).toBeInTheDocument();
    expect(screen.getByText('Unreadable PDF')).toBeInTheDocument();
  });
});

describe('selected submission scans', () => {
  const multiple = [...submissions, { ...submissions[0], id: 'b', title_of_work: 'Second story', file_url: 'second.pdf' }];
  beforeEach(() => {
    vi.clearAllMocks();
    extractSubmissionText.mockResolvedValue({ pages: [{ page: 1, text: 'A brief clean story.' }], warnings: [] });
  });
  it('scans only the chosen file and explains that overlap was not checked', async () => {
    render(<SubmissionScreening submissions={multiple} />);
    expect(screen.getByRole('button', { name: 'Scan selected (0)' })).toBeDisabled();
    fireEvent.click(screen.getByText('Choose submissions (0 selected)'));
    fireEvent.click(screen.getByRole('checkbox', { name: /Second story/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Scan selected (1)' }));
    expect(await screen.findByText('Second story — No flags found')).toBeInTheDocument();
    expect(extractSubmissionText).toHaveBeenCalledTimes(1);
    expect(extractSubmissionText.mock.calls[0][0]).toBe('second.pdf');
    expect(screen.getByText(/Single-file scan: text overlap was not checked/)).toBeInTheDocument();
    expect(screen.queryByText('First story — No flags found')).not.toBeInTheDocument();
  });
  it('scans all files even when only one is selected', async () => {
    render(<SubmissionScreening submissions={multiple} />);
    fireEvent.click(screen.getByText('Choose submissions (0 selected)'));
    fireEvent.click(screen.getByRole('checkbox', { name: /Second story/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Scan all submissions' }));
    expect(await screen.findByText('First story — No flags found')).toBeInTheDocument();
    expect(screen.getByText('Second story — No flags found')).toBeInTheDocument();
    expect(extractSubmissionText).toHaveBeenCalledTimes(2);
  });
});
