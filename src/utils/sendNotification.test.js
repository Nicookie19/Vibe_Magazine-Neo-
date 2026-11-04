import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { createNotificationHandler } from '../../supabase/functions/send-notification/handler.js';

describe('submission notification sender', () => {
  let db, env, fetchEmail, handler, submission, profile, receipt, saveReceipt;
  beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto);
    submission = { id: 1, student_email: 'student@uic.edu.ph', full_name: 'Student', title_of_work: 'Story', category: 'Fiction', status: 'Rejected', rejection_remarks: 'Please cite your sources.' };
    profile = { role: 'admin', is_active: true };
    receipt = null;
    saveReceipt = vi.fn().mockResolvedValue({ error: null });
    db = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin' } }, error: null }) },
      from: vi.fn(table => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({
          data: table === 'user_profiles' ? profile : table === 'submissions' ? submission : receipt, error: null,
        }) }) }),
        upsert: saveReceipt,
      })),
    };
    env = name => ({ RESEND_API_KEY: 'secret-server-key', NOTIFICATION_FROM_EMAIL: 'Vibe <editor@example.com>' })[name];
    fetchEmail = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'mail-1' }), { status: 200 }));
    handler = createNotificationHandler({ db, env, fetchEmail });
  });
  afterEach(() => vi.unstubAllGlobals());
  const request = (extra = {}) => new Request('https://example.com/send-notification', {
    method: 'POST', headers: { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: 1, status: 'Rejected', ...extra }),
  });
  it('sends saved rejection remarks to the saved recipient, ignoring client content', async () => {
    const response = await handler(request({ to: 'attacker@example.com', body: 'forged', subject: 'forged' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, delivery_status: 'queued', provider_id: 'mail-1' });
    const payload = JSON.parse(fetchEmail.mock.calls[0][1].body);
    expect(payload.to).toEqual(['student@uic.edu.ph']);
    expect(payload.text).toContain('Please cite your sources.');
    expect(payload.text).not.toContain('forged');
    expect(saveReceipt).toHaveBeenCalledOnce();
  });
  it('builds the acceptance message from the saved decision', async () => {
    submission.status = 'Accepted';
    await handler(request({ status: 'Accepted' }));
    expect(JSON.parse(fetchEmail.mock.calls[0][1].body).text).toContain('accepted for publication');
    expect(JSON.parse(fetchEmail.mock.calls[0][1].body).text).not.toContain('Please cite');
  });
  it.each([{ role: 'admin', is_active: false }, { role: 'student', is_active: true }])('blocks unauthorized profiles: %o', async value => {
    profile = value;
    expect((await handler(request())).status).toBe(403);
    expect(fetchEmail).not.toHaveBeenCalled();
  });
  it('requires a valid session', async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    expect((await handler(request())).status).toBe(401);
    expect(fetchEmail).not.toHaveBeenCalled();
  });
  it('rejects a stale decision instead of emailing the wrong result', async () => {
    expect((await handler(request({ status: 'Accepted' }))).status).toBe(409);
    expect(fetchEmail).not.toHaveBeenCalled();
  });
  it('reports missing provider configuration', async () => {
    handler = createNotificationHandler({ db, env: () => undefined, fetchEmail });
    expect((await handler(request())).status).toBe(503);
    expect(fetchEmail).not.toHaveBeenCalled();
  });
  it('does not resend an already recorded notification', async () => {
    receipt = { provider_id: 'previous' };
    const result = await (await handler(request())).json();
    expect(result.already_sent).toBe(true);
    expect(fetchEmail).not.toHaveBeenCalled();
  });
  it('does not claim success or write a receipt on provider failure', async () => {
    fetchEmail.mockResolvedValue(new Response('{}', { status: 403 }));
    const response = await handler(request());
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain('verified sender');
    expect(saveReceipt).not.toHaveBeenCalled();
  });
  it('preserves the same retry key on timeouts', async () => {
    fetchEmail.mockRejectedValue(new Error('timeout'));
    expect((await handler(request())).status).toBe(502);
    expect((await handler(request())).status).toBe(502);
    expect(fetchEmail.mock.calls[0][1].headers['Idempotency-Key']).toBe(fetchEmail.mock.calls[1][1].headers['Idempotency-Key']);
  });
  it('reports receipt failure without falsely saying the email failed', async () => {
    saveReceipt.mockResolvedValue({ error: {} });
    const result = await (await handler(request())).json();
    expect(result.success).toBe(true);
    expect(result.warning).toContain('receipt could not be saved');
  });
});
