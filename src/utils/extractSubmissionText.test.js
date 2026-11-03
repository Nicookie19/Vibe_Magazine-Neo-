import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocument } from 'pdfjs-dist';
import { extractSubmissionText } from './extractSubmissionText';
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/worker.js' }));
describe('PDF text extraction', () => {
  let destroy;
  beforeEach(() => { vi.clearAllMocks(); destroy = vi.fn().mockResolvedValue(); });
  it('extracts text with page numbers and identifies pages needing visual review', async () => {
    getDocument.mockReturnValue({ destroy, promise: Promise.resolve({ numPages: 2, getPage: async number => ({
      getTextContent: async () => ({ items: number === 1 ? [{ str: 'Hello' }, { str: 'world' }] : [] }),
      cleanup: vi.fn(),
    }) }) });
    const result = await extractSubmissionText('https://example.com/file.pdf?token=test');
    expect(result.pages[0]).toEqual({ page: 1, text: 'Hello world' });
    expect(result.warnings[0]).toContain('pages 2');
    expect(destroy).toHaveBeenCalledOnce();
  });
  it('cleans up failed documents and identifies password protection', async () => {
    getDocument.mockReturnValue({ destroy, promise: Promise.reject(Object.assign(new Error(), { name: 'PasswordException' })) });
    await expect(extractSubmissionText('locked.pdf')).rejects.toThrow('Password-protected');
    expect(destroy).toHaveBeenCalledOnce();
  });
  it('cancels a pending download and destroys its PDF task', async () => {
    getDocument.mockReturnValue({ destroy, promise: new Promise(() => {}) });
    const controller = new AbortController();
    const pending = extractSubmissionText('slow.pdf', controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow('cancelled');
    expect(destroy).toHaveBeenCalledOnce();
  });
  it('does not claim to scan images', async () => {
    await expect(extractSubmissionText('art.png')).rejects.toThrow('Review it manually');
    expect(getDocument).not.toHaveBeenCalled();
  });
});

describe('extraction coverage warnings', () => {
  const mockPdf = (numPages, text) => {
    getDocument.mockReturnValue({ destroy: vi.fn(), promise: Promise.resolve({
      numPages, getPage: async () => ({ getTextContent: async () => ({ items: [{ str: text }] }), cleanup: vi.fn() }),
    }) });
  };
  it('does not claim 200 pages were scanned when the character cap stopped earlier', async () => {
    mockPdf(300, 'a'.repeat(110000));
    const result = await extractSubmissionText('large.pdf');
    expect(result.pages).toHaveLength(2);
    expect(result.warnings).toEqual(['Text limit reached (200,000 characters) on page 2 of 300. Remaining text was not scanned.']);
  });
  it('does not flag a complete document at exactly the character limit', async () => {
    mockPdf(1, 'a'.repeat(200000));
    expect((await extractSubmissionText('exact.pdf')).warnings).toEqual([]);
  });
  it('reports the page cap only when it was actually reached', async () => {
    mockPdf(201, 'short text');
    const result = await extractSubmissionText('pages.pdf');
    expect(result.pages).toHaveLength(200);
    expect(result.warnings).toEqual(['Page limit reached: only the first 200 of 201 pages were scanned.']);
  });
});
