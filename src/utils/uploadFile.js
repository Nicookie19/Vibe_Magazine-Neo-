import { Upload } from 'tus-js-client';
import { supabase } from '../supabaseClient';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = '50 MB';
export const RESUMABLE_CHUNK_BYTES = 6 * 1024 * 1024;

export function validateUploadSize(file) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File size exceeds ${MAX_UPLOAD_LABEL}. Please upload a smaller file.`);
  }
}

// Upload directly to Storage, never through a Vercel function. Large files are
// sent in chunks and retried from the last acknowledged offset in this session.
export async function uploadFile(bucket, path, file, { onProgress } = {}) {
  validateUploadSize(file);
  if (file.size <= RESUMABLE_CHUNK_BYTES) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600', upsert: false,
    });
    if (error) throw error;
    onProgress?.(100);
    return;
  }

  const endpoint = new URL(import.meta.env.VITE_SUPABASE_URL);
  if (/^[^.]+\.supabase\.co$/.test(endpoint.hostname)) {
    endpoint.hostname = endpoint.hostname.replace('.supabase.co', '.storage.supabase.co');
  }
  endpoint.pathname = '/storage/v1/upload/resumable';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  await new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: endpoint.toString(),
      chunkSize: RESUMABLE_CHUNK_BYTES,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: false,
      headers: { apikey: anonKey, 'x-upsert': 'false' },
      metadata: {
        bucketName: bucket, objectName: path,
        contentType: file.type || 'application/octet-stream', cacheControl: '3600',
      },
      onBeforeRequest: async request => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        request.setHeader('authorization', `Bearer ${session?.access_token || anonKey}`);
      },
      onProgress: (uploaded, total) => onProgress?.(Math.round(uploaded / total * 100)),
      onError: reject,
      onSuccess: () => { onProgress?.(100); resolve(); },
    });
    upload.start();
  });
}
