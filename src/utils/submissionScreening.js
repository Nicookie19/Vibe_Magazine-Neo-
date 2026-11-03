// Editorial prompts, not an exhaustive moderation classifier.
export const DEFAULT_FLAGGED_TERMS = ['fuck', 'fucking', 'shit', 'bitch', 'asshole', 'putang ina', 'putangina', 'gago', 'tangina'];
const words = text => (text.normalize('NFKC').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
const normalized = text => words(text).join(' ');
export const screeningSignature = submissions => JSON.stringify(submissions.map(s =>
  [s.id, s.file_url, s.title_of_work, s.category, s.full_name, s.student_email, s.submitted_at]));

function termExcerpt(text, term) {
  const tokens = words(text);
  const joined = tokens.join(' ');
  const index = joined.indexOf(term);
  const tokenIndex = joined.slice(0, index).trim().split(' ').filter(Boolean).length;
  return tokens.slice(Math.max(0, tokenIndex - 12), tokenIndex + term.split(' ').length + 12).join(' ');
}

export function reviewText(submission, pages, terms = DEFAULT_FLAGGED_TERMS) {
  const findings = [];
  for (const [key, label] of [['title_of_work', 'title'], ['category', 'category'], ['full_name', 'author name'], ['student_email', 'email']]) {
    if (!submission[key]?.trim()) findings.push({ type: 'Metadata', message: 'Missing ' + label });
  }
  const sections = [{ page: 'Title', text: submission.title_of_work || '' }, ...pages];
  const normalizedTerms = [...new Set(terms.map(normalized).filter(Boolean))];
  for (const section of sections) {
    const text = ' ' + normalized(section.text) + ' ';
    for (const term of normalizedTerms) {
      if (text.includes(' ' + term + ' ')) {
        findings.push({ type: 'Language', page: section.page, message: 'Review flagged term: “' + term + '”', excerpt: termExcerpt(section.text, term) });
      }
    }
    if (/\b(?:lorem ipsum|insert text here|TODO)\b/i.test(section.text)) {
      findings.push({ type: 'Draft content', page: section.page, message: 'Possible placeholder text remains.' });
    }
  }
  return findings;
}

// Eight-word sequences: punctuation and case are ignored. No semantic or web matching.
export async function compareSubmissions(documents, signal) {
  const index = new Map();
  const matches = new Map(documents.map(d => [d.id, []]));
  for (const doc of documents) {
    await new Promise(resolve => setTimeout(resolve, 0));
    signal?.throwIfAborted();
    const own = new Map();
    for (const page of doc.pages) {
      const tokens = words(page.text);
      for (let i = 0; i <= tokens.length - 8; i++) {
        const phrase = tokens.slice(i, i + 8).join(' ');
        if (!own.has(phrase)) own.set(phrase, page.page);
      }
    }
    const peers = new Map();
    for (const [phrase, page] of own) {
      for (const other of index.get(phrase) || []) {
        const pair = peers.get(other.id) || { id: other.id, count: 0, excerpt: phrase, page, sourcePage: other.page };
        pair.count++;
        peers.set(other.id, pair);
      }
    }
    for (const pair of peers.values()) {
      // At least three distinct matching sequences avoids isolated short phrases.
      if (pair.count < 3) continue;
      matches.get(doc.id).push(pair);
      matches.get(pair.id).push({ id: doc.id, count: pair.count, excerpt: pair.excerpt, page: pair.sourcePage, sourcePage: pair.page });
    }
    for (const [phrase, page] of own) {
      if (!index.has(phrase)) index.set(phrase, []);
      index.get(phrase).push({ id: doc.id, page });
    }
  }
  return matches;
}

export async function screenSubmissions(submissions, { extract, signal, onProgress, terms }) {
  const reports = [];
  const documents = [];
  for (const submission of submissions) {
    signal?.throwIfAborted();
    let pages = [], warnings = [];
    try {
      if (!submission.file_url) throw new Error('No file attached.');
      const result = await extract(submission.file_url, signal);
      pages = result.pages;
      warnings = result.warnings;
      documents.push({ id: submission.id, pages });
    } catch (error) {
      signal?.throwIfAborted();
      warnings = [error.message || 'File could not be scanned.'];
    }
    reports.push({ id: submission.id, title: submission.title_of_work || 'Untitled',
      findings: reviewText(submission, pages, terms), warnings,
      pageCount: pages.length, wordCount: pages.reduce((sum, p) => sum + words(p.text).length, 0) });
    onProgress?.(reports.length, submissions.length);
    // Let progress and cancellation render between documents.
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  signal?.throwIfAborted();
  const matches = await compareSubmissions(documents, signal);
  return reports.map(report => ({ ...report, matches: matches.get(report.id) || [] }));
}
