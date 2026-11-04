export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export function decisionEmail(submission) {
  const title = String(submission.title_of_work || 'Untitled').replace(/[\r\n]+/g, ' ');
  const accepted = submission.status === 'Accepted';
  const decision = accepted
    ? 'Your submission has been accepted for publication in Vibe Magazine.'
    : 'After editorial review, your submission has not been accepted for publication.';
  return {
    to: [submission.student_email.trim().toLowerCase()],
    subject: `Vibe Magazine: ${accepted ? 'Accepted' : 'Review outcome'} — ${title}`,
    text: `Dear ${submission.full_name || 'Contributor'},

${decision}

Title: ${submission.title_of_work || 'Untitled'}
Category: ${submission.category || 'Not specified'}
${accepted ? '' : '\nReviewer remarks:\n' + (submission.rejection_remarks || 'Please contact the editorial team for details.') + '\n'}
Thank you for contributing to Vibe Magazine.

The Vibe Magazine Editorial Team`,
  };
}

export function createNotificationHandler({ db, env, fetchEmail = fetch }) {
  return async req => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return reply(405, { success: false, error: 'Use POST.' });
    try {
      const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
      if (!token) return reply(401, { success: false, error: 'Sign in to send notifications.' });
      const { data: auth, error: authError } = await db.auth.getUser(token);
      if (authError || !auth?.user) return reply(401, { success: false, error: 'Your session has expired. Please sign in again.' });
      const { data: profile, error: profileError } = await db.from('user_profiles')
        .select('role,is_active').eq('id', auth.user.id).maybeSingle();
      if (profileError || !profile?.is_active || !['admin', 'superadmin'].includes(profile.role)) {
        return reply(403, { success: false, error: 'Only active admins and superadmins may send decision emails.' });
      }
      let input;
      try { input = await req.json(); } catch { return reply(400, { success: false, error: 'Invalid request.' }); }
      if (!input || !['string', 'number'].includes(typeof input.submission_id) || !['Accepted', 'Rejected'].includes(input.status)) {
        return reply(400, { success: false, error: 'Submission ID and decision are required.' });
      }
      const { data: submission, error: readError } = await db.from('submissions')
        .select('id,student_email,full_name,title_of_work,category,status,rejection_remarks')
        .eq('id', input.submission_id).maybeSingle();
      if (readError) return reply(500, { success: false, error: 'Could not load the saved submission.' });
      if (!submission) return reply(404, { success: false, error: 'Submission no longer exists.' });
      if (submission.status !== input.status) return reply(409, { success: false, error: 'The decision changed. Refresh before sending the email.' });
      if (!/^[^\s@]+@uic\.edu\.ph$/i.test(submission.student_email?.trim() || '')) {
        return reply(422, { success: false, error: 'The saved recipient must use a valid @uic.edu.ph address.' });
      }
      const key = env('RESEND_API_KEY');
      const from = env('NOTIFICATION_FROM_EMAIL');
      if (!key || !from) return reply(503, { success: false, error: 'Email is not configured. Set RESEND_API_KEY and NOTIFICATION_FROM_EMAIL in Supabase Edge Function secrets.' });
      if (/[\r\n]/.test(from)) return reply(503, { success: false, error: 'The sender address configuration is invalid.' });
      const payload = { from, ...decisionEmail(submission) };
      const bytes = new TextEncoder().encode(JSON.stringify([String(submission.id), payload]));
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const messageKey = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      const { data: previous, error: historyError } = await db.from('submission_email_receipts')
        .select('provider_id').eq('message_key', messageKey).maybeSingle();
      if (historyError) return reply(503, { success: false, error: 'Email history is unavailable. Apply the submission email receipts migration first.' });
      if (previous) return reply(200, { success: true, delivery_status: 'queued', already_sent: true, provider_id: previous.provider_id });

      let response;
      try {
        response = await fetchEmail('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': 'submission/' + messageKey },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000),
        });
      } catch {
        return reply(502, { success: false, error: 'The email provider could not be reached. Retry the notification; the submission decision is saved.' });
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.id) {
        const reason = [401, 403].includes(response.status)
          ? 'Check the Resend API key and verified sender domain.'
          : response.status === 429 ? 'The email provider rate limit was reached. Try again shortly.'
            : 'Check the sender, recipient, and provider logs.';
        return reply(502, { success: false, error: 'Email provider rejected the request. ' + reason });
      }
      const { error: receiptError } = await db.from('submission_email_receipts').upsert({
        message_key: messageKey, submission_id: String(submission.id), decision: submission.status,
        provider_id: result.id, requested_by: auth.user.id,
      }, { onConflict: 'message_key', ignoreDuplicates: true });
      return reply(200, {
        success: true, delivery_status: 'queued', provider_id: result.id,
        ...(receiptError ? { warning: 'Email queued, but its receipt could not be saved. Check provider logs before retrying after 24 hours.' } : {}),
      });
    } catch {
      return reply(500, { success: false, error: 'Notification failed unexpectedly. Your submission decision is still saved.' });
    }
  };
}
