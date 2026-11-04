export const UIC_EMAIL_MESSAGE = 'Please use an email address ending in @uic.edu.ph.';
export const isUicEmail = email => typeof email === 'string' && /^[^\s@]+@uic\.edu\.ph$/i.test(email.trim());

export function publicationDeadline(submittedAt) {
  if (!submittedAt) return null;
  const date = new Date(submittedAt);
  if (!Number.isFinite(date.getTime())) return null;
  return new Date(date.getTime() + 72 * 60 * 60 * 1000);
}

export function formatDeadline(submittedAt) {
  const date = publicationDeadline(submittedAt);
  return date ? new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(date) + ' PHT' : 'Not available';
}

// Whole words avoid censoring innocent substrings such as "class" and "assignment".
// Context and novel spellings still require human moderation.
export function censorComment(text = '') {
  return String(text).replace(/\b(fuck(ing|er|ed|s)?|f[u*]ck|sh[i1*]t|bullshit|bitch(es)?|asshole(s)?|putang[\s-]*ina|tangina|gago|gaga|pakyu|ulol)\b/gi, '[censored]');
}
