import { describe, it, expect } from 'vitest';
import { gmailDraftUrl } from './gmailDraft';
const submission = { student_email: 'student+test@uic.edu.ph', title_of_work: 'Art & Design #1', full_name: 'Nico', category: 'Art', status: 'Accepted' };
describe('Gmail decision drafts', () => {
  it('encodes recipient and special characters without creating extra parameters', () => {
    const url = new URL(gmailDraftUrl(submission));
    expect(url.origin).toBe('https://mail.google.com');
    expect(url.searchParams.get('to')).toBe('student+test@uic.edu.ph');
    expect(url.searchParams.get('su')).toContain('Art & Design #1');
    expect(url.searchParams.get('body')).toContain('accepted for publication');
  });
  it('includes complete rejection remarks and line breaks', () => {
    const remarks = 'Revise pages 1 & 2.\nAdd sources? #references';
    const url = new URL(gmailDraftUrl({ ...submission, status: 'Rejected', rejection_remarks: remarks }));
    expect(url.searchParams.get('body')).toContain(remarks);
    expect(url.searchParams.get('body')).toContain('not been accepted');
  });
  it('does not put rejection remarks in accepted messages', () => {
    expect(new URL(gmailDraftUrl({ ...submission, rejection_remarks: 'old remarks' })).searchParams.get('body')).not.toContain('old remarks');
  });
  it('does not offer drafts for pending decisions or invalid recipients', () => {
    expect(gmailDraftUrl({ ...submission, status: 'Pending' })).toBeNull();
    expect(gmailDraftUrl({ ...submission, student_email: 'bad\naddress' })).toBeNull();
  });
});
