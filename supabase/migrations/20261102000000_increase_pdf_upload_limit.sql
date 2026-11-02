-- Match the app's 50 MB (50 * 1024 * 1024 bytes) PDF upload limit.
-- Ensure the project's global Storage file size limit is also set to 50 MB.
-- Preserve existing bucket visibility, MIME restrictions, and access policies.
update storage.buckets
set file_size_limit = 52428800
where id in ('student-submissions', 'magazines');
