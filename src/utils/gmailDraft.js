export function gmailDraftUrl(submission) {
  if (!['Accepted', 'Rejected'].includes(submission.status)) return null;
  const email = submission.student_email?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const accepted = submission.status === 'Accepted';
  const title = String(submission.title_of_work || 'Untitled').replace(/[\r\n]+/g, ' ');
  const body = `Dear ${submission.full_name || 'Contributor'},

${accepted
    ? 'Your submission has been accepted for publication in Vibe Magazine.'
    : 'After editorial review, your submission has not been accepted for publication.'}

Title: ${submission.title_of_work || 'Untitled'}
Category: ${submission.category || 'Not specified'}
${accepted ? '' : '\nReviewer remarks:\n' + (submission.rejection_remarks || 'Please contact the editorial team for details.') + '\n'}
Thank you for contributing to Vibe Magazine.

The Vibe Magazine Editorial Team`;
  const url = new URL('https://mail.google.com/mail/');
  url.search = new URLSearchParams({
    view: 'cm', fs: '1', to: email,
    su: `Vibe Magazine: ${accepted ? 'Accepted' : 'Review outcome'} — ${title}`,
    body,
  }).toString();
  return url.toString();
}
