import { describe, expect, it, vi } from 'vitest';
import { reviewText, compareSubmissions, screenSubmissions, screeningSignature } from './submissionScreening';

const submission = { id: 'a', title_of_work: 'Story', full_name: 'Author', student_email: 'a@example.com', category: 'Fiction', file_url: 'story.pdf' };
const text = 'The quiet village beside the river waited for the morning sun to rise';
describe('editorial screening', () => {
  it('matches whole words and phrases without flagging substrings', () => {
    expect(reviewText(submission, [{ page: 1, text: 'A classic assignment in Scunthorpe.' }], ['ass', 'shit'])).toEqual([]);
    expect(reviewText(submission, [{ page: 2, text: 'PUTANG INA! This is shit.' }])).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'Language', page: 2, message: expect.stringContaining('putang ina') }),
    ]));
  });
  it('includes evidence near a flagged term far into a page', () => {
    const report = reviewText(submission, [{ page: 3, text: 'hello '.repeat(100) + 'shit goes here' }]);
    expect(report[0].excerpt).toContain('shit');
  });
  it('checks title, missing metadata and placeholders', () => {
    const result = reviewText({ ...submission, category: '', title_of_work: 'shit' }, [{ page: 1, text: 'TODO: insert text here' }]);
    expect(result.map(r => r.type)).toEqual(['Metadata', 'Language', 'Draft content']);
  });
  it('finds normalized shared passages in both directions with page references', async () => {
    const result = await compareSubmissions([
      { id: 'a', pages: [{ page: 2, text }] },
      { id: 'b', pages: [{ page: 7, text: text.toUpperCase() + '.' }] },
      { id: 'c', pages: [{ page: 1, text: 'Something wholly unrelated' }] },
    ]);
    expect(result.get('a')[0]).toMatchObject({ id: 'b', page: 2, sourcePage: 7 });
    expect(result.get('b')[0]).toMatchObject({ id: 'a', page: 7, sourcePage: 2 });
    expect(result.get('c')).toEqual([]);
  });
  it('does not inflate matches from one repeated phrase or self-comparisons', async () => {
    const result = await compareSubmissions([{ id: 'a', pages: [{ page: 1, text: 'one '.repeat(50) }] }, { id: 'b', pages: [{ page: 1, text: 'one '.repeat(50) }] }]);
    expect(result.get('a')).toEqual([]);
  });
  it('continues a batch after a failed file and marks it incomplete', async () => {
    const extract = vi.fn().mockRejectedValueOnce(new Error('Unreadable PDF')).mockResolvedValueOnce({ pages: [{ page: 1, text }], warnings: [] });
    const result = await screenSubmissions([submission, { ...submission, id: 'b' }], { extract });
    expect(result[0].warnings).toEqual(['Unreadable PDF']);
    expect(result[1].wordCount).toBeGreaterThan(0);
  });
  it('preserves partial extraction warnings instead of claiming a complete scan', async () => {
    const result = await screenSubmissions([submission], { extract: async () => ({ pages: [], warnings: ['Image-only PDF'] }) });
    expect(result[0].warnings).toEqual(['Image-only PDF']);
  });
  it('stops before loading files when cancelled', async () => {
    const controller = new AbortController(); controller.abort();
    const extract = vi.fn();
    await expect(screenSubmissions([submission], { extract, signal: controller.signal })).rejects.toThrow();
    expect(extract).not.toHaveBeenCalled();
  });
  it('invalidates reports when file or metadata changes, not when approval changes', () => {
    expect(screeningSignature([submission])).not.toBe(screeningSignature([{ ...submission, file_url: 'new.pdf' }]));
    expect(screeningSignature([submission])).toBe(screeningSignature([{ ...submission, status: 'Accepted' }]));
  });
});
