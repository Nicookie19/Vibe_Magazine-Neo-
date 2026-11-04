import { describe, expect, it } from 'vitest';
import { isUicEmail, censorComment, publicationDeadline, formatDeadline } from './editorialRules';
describe('editorial rules', () => {
  it.each(['a@uic.edu.ph', ' A@UIC.EDU.PH '])('accepts exact school domain: %s', email => expect(isUicEmail(email)).toBe(true));
  it.each(['a@gmail.com', 'a@uic.edu.ph.evil.com', 'a@sub.uic.edu.ph', 'a@@uic.edu.ph', 'a b@uic.edu.ph', '', null])('rejects other domains and malformed addresses: %s', email => expect(isUicEmail(email)).toBe(false));
  it('calculates 72 hours across month boundaries', () => {
    expect(publicationDeadline('2026-10-31T18:00:00Z').toISOString()).toBe('2026-11-03T18:00:00.000Z');
    expect(formatDeadline('2026-10-31T18:00:00Z')).toContain('Nov 4, 2026');
    expect(publicationDeadline(null)).toBeNull();
  });
  it('censors English and Filipino curses without damaging innocent words', () => {
    expect(censorComment('SH1T! putang ina. Fucking asshole.')).toBe('[censored]! [censored]. [censored] [censored].');
    expect(censorComment('A classic assignment, shellfish and a title.')).toBe('A classic assignment, shellfish and a title.');
    expect(censorComment(censorComment('shit'))).toBe('[censored]');
  });
});
