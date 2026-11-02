import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Upload } from 'tus-js-client';
import { supabase } from '../supabaseClient';
import { MAX_UPLOAD_BYTES, RESUMABLE_CHUNK_BYTES, uploadFile, validateUploadSize } from './uploadFile';

vi.mock('tus-js-client', () => ({ Upload: vi.fn() }));
let options;
let standardUpload;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
  standardUpload = vi.fn().mockResolvedValue({ error: null });
  supabase.storage = { from: vi.fn(() => ({ upload: standardUpload })) };
  supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  Upload.mockImplementation(function (_file, config) {
    options = config;
    this.start = () => config.onSuccess();
  });
});

describe('50 MB uploads', () => {
  it('accepts exactly 50 MB and rejects one byte more', () => {
    expect(MAX_UPLOAD_BYTES).toBe(52_428_800);
    expect(() => validateUploadSize({ size: MAX_UPLOAD_BYTES })).not.toThrow();
    expect(() => validateUploadSize({ size: MAX_UPLOAD_BYTES + 1 })).toThrow('50 MB');
  });
  it('rejects oversized files before any storage call', async () => {
    await expect(uploadFile('magazines', 'large.pdf', { size: MAX_UPLOAD_BYTES + 1 })).rejects.toThrow('50 MB');
    expect(Upload).not.toHaveBeenCalled();
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });
  it('keeps standard uploads for small files', async () => {
    const file = { size: RESUMABLE_CHUNK_BYTES, type: 'application/pdf' };
    await uploadFile('magazines', 'small.pdf', file);
    expect(standardUpload).toHaveBeenCalledWith('small.pdf', file, expect.objectContaining({ upsert: false }));
    expect(Upload).not.toHaveBeenCalled();
  });
  it('chunks a maximum-sized PDF without reading it into memory', async () => {
    const file = { size: MAX_UPLOAD_BYTES, type: 'application/pdf', arrayBuffer: vi.fn() };
    await uploadFile('student-submissions', 'large.pdf', file);
    expect(options.endpoint).toBe('https://test-project.storage.supabase.co/storage/v1/upload/resumable');
    expect(options.chunkSize).toBe(6 * 1024 * 1024);
    expect(options.metadata).toMatchObject({ bucketName: 'student-submissions', objectName: 'large.pdf' });
    expect(file.arrayBuffer).not.toHaveBeenCalled();
  });
  it('uses anonymous credentials for public submissions', async () => {
    await uploadFile('student-submissions', 'large.pdf', { size: MAX_UPLOAD_BYTES });
    const request = { setHeader: vi.fn() };
    await options.onBeforeRequest(request);
    expect(request.setHeader).toHaveBeenCalledWith('authorization', 'Bearer public-anon-key');
  });
  it('uses the latest staff session token for each chunk', async () => {
    await uploadFile('magazines', 'large.pdf', { size: MAX_UPLOAD_BYTES });
    supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'refreshed-token' } }, error: null });
    const request = { setHeader: vi.fn() };
    await options.onBeforeRequest(request);
    expect(request.setHeader).toHaveBeenCalledWith('authorization', 'Bearer refreshed-token');
  });
  it('reports upload failures instead of claiming success', async () => {
    Upload.mockImplementation(function (_file, config) { this.start = () => config.onError(new Error('Bucket size limit exceeded')); });
    await expect(uploadFile('magazines', 'large.pdf', { size: MAX_UPLOAD_BYTES })).rejects.toThrow('Bucket size limit');
  });
});
