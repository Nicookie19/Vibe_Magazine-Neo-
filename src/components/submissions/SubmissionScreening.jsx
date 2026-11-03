import { useEffect, useRef, useState } from 'react';
import { DEFAULT_FLAGGED_TERMS, screeningSignature, screenSubmissions } from '../../utils/submissionScreening';

export default function SubmissionScreening({ submissions }) {
  const [reports, setReports] = useState([]);
  const [snapshot, setSnapshot] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [terms, setTerms] = useState(DEFAULT_FLAGGED_TERMS.join(', '));
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionSearch, setSelectionSearch] = useState('');
  const [batchSize, setBatchSize] = useState(0);
  const controller = useRef(null);
  const selected = submissions.filter(s => selectedIds.includes(s.id));
  const choices = submissions.filter(s => [s.title_of_work, s.full_name, String(s.id)]
    .some(value => value?.toLowerCase().includes(selectionSearch.toLowerCase())));

  const signature = screeningSignature(submissions) + terms;
  const stale = reports.length > 0 && signature !== snapshot;
  useEffect(() => () => controller.current?.abort(), []);

  const scan = async (batch) => {
    if (controller.current || !batch.length) return;
    const job = new AbortController();
    controller.current = job;
    setRunning(true);
    setProgress(0);
    setBatchSize(batch.length);
    setError('');
    setReports([]);
    try {
      const { extractSubmissionText } = await import('../../utils/extractSubmissionText');
      const result = await screenSubmissions(batch, {
        extract: extractSubmissionText, signal: job.signal,
        terms: terms.split(',').map(t => t.trim()).filter(Boolean),
        onProgress: count => setProgress(count),
      });
      if (!job.signal.aborted) {
        setReports(result);
        setSnapshot(signature);
      }
    } catch (err) {
      if (job.signal.aborted) setError('Scan cancelled. Run again to create a complete report.');
      else setError('Screening failed: ' + err.message);
    } finally {
      controller.current = null;
      setRunning(false);
    }
  };
  const flagged = r => r.findings.length || r.matches.length || r.warnings.length;
  const shown = onlyFlagged ? reports.filter(flagged) : reports;
  return (
    <section aria-label="Submission screening" className="vibe-panel rounded-xl border border-brand-500/30 p-5 mb-6 text-gray-200">
      <h2 className="text-xl font-bold text-white">Submission screening</h2>
      <p className="text-sm mt-2">Scan all {submissions.length} submissions, or choose individual files, for flagged words, missing details, draft placeholders, and matching PDF passages.</p>
      <p className="text-sm text-gray-400 mt-2">Internal text matches are leads for citation review, not proof of plagiarism. No internet comparison, OCR, image moderation, or automatic approval. Scans run in this browser; results clear when you leave this tab.</p>
      <p className="text-sm text-gray-400 mt-2">Each PDF is limited to 200,000 characters, 200 pages, and 60 seconds to keep browser memory and processing manageable. Larger files receive an incomplete report, not a clean result.</p>
      <details className="my-3">
        <summary className="cursor-pointer text-brand-300">Choose submissions ({selected.length} selected)</summary>
        <label htmlFor="screening-selection-search" className="block text-sm mt-2">Find by title, author, or submission ID</label>
        <input id="screening-selection-search" value={selectionSearch} onChange={e => setSelectionSearch(e.target.value)} className="w-full bg-black/30 border border-brand-500/30 rounded p-2 mt-2" />
        <button type="button" disabled={running || !selected.length} onClick={() => setSelectedIds([])} className="text-sm underline my-2 disabled:opacity-50">Clear selection</button>
        <div className="max-h-64 overflow-auto space-y-2">
          {choices.map(submission => <label key={submission.id} className="flex gap-3 items-start text-sm p-2 bg-black/20 rounded">
            <input type="checkbox" disabled={running} checked={selectedIds.includes(submission.id)}
              onChange={e => setSelectedIds(ids => e.target.checked ? [...ids, submission.id] : ids.filter(id => id !== submission.id))}
              className="mt-1" />
            <span>{submission.title_of_work || 'Untitled'} — {submission.full_name || 'Unknown author'} (#{submission.id})</span>
          </label>)}
          {!choices.length && <p className="text-sm">No matching submissions.</p>}
        </div>
        <p className="text-sm text-gray-400 mt-2">Selected files are compared only with each other. A single-file scan checks language and document issues; select at least two files to check text overlap.</p>
      </details>
      <details className="my-3">
        <summary className="cursor-pointer text-brand-300">Flagged words and phrases</summary>
        <label className="block text-sm mt-2" htmlFor="screening-terms">Comma-separated review terms (English and Filipino starter list)</label>
        <textarea id="screening-terms" disabled={running} value={terms} onChange={e => setTerms(e.target.value)} className="w-full bg-black/30 border border-brand-500/30 rounded p-2 mt-2" />
        <p className="text-xs text-gray-400">Matches use whole words. Context, quotations, and spelling variations require human review.</p>
      </details>
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => scan(submissions)} disabled={running || !submissions.length} className="bg-brand-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">{running ? 'Scanning…' : reports.length ? 'Scan all again' : 'Scan all submissions'}</button>
        <button onClick={() => scan(selected)} disabled={running || !selected.length} className="border border-brand-500/50 text-brand-200 px-4 py-2 rounded-lg disabled:opacity-50">Scan selected ({selected.length})</button>
        {running && <button onClick={() => controller.current?.abort()} className="border rounded-lg px-4 py-2">Cancel scan</button>}
        <span role="status" className="text-sm">{running ? `${progress} of ${batchSize} files processed` : reports.length ? `${reports.length} reports · ${reports.filter(flagged).length} need review` : 'Not scanned'}</span>
      </div>
      {error && <p role="alert" className="text-red-300 mt-3">{error}</p>}
      {stale && <p role="alert" className="text-yellow-300 mt-3">Submissions or review terms changed. Scan again before using these results.</p>}
      {reports.length > 0 && !stale && <>
        {reports.length === 1 && <p className="text-yellow-200 mt-3">Single-file scan: text overlap was not checked because no other submissions were selected.</p>}
        <p className="text-sm text-gray-400 mt-3">Comparison scope: {reports.length} scanned submission(s) only. Failed or incomplete files reduce comparison coverage. Matches require at least three distinct shared eight-word sequences; citations and common passages can also match.</p>
        <label className="flex gap-2 my-3"><input type="checkbox" checked={onlyFlagged} onChange={e => setOnlyFlagged(e.target.checked)} />Show only reports needing review</label>
        <div className="space-y-3 max-h-[36rem] overflow-auto">
          {shown.map(report => <details key={report.id} className="bg-black/20 rounded-lg p-3 border border-white/10">
            <summary className="cursor-pointer font-medium">{report.title} — {report.warnings.length ? 'Incomplete scan' : flagged(report) ? 'Needs review' : 'No flags found'}</summary>
            <p className="text-xs text-gray-400 mt-2">Submission {report.id} · {report.pageCount} pages extracted · {report.wordCount} words. No flags does not mean approved or original.</p>
            {report.warnings.map((warning, i) => <p key={i} className="text-yellow-300 mt-2">{warning}</p>)}
            {report.findings.map((finding, i) => <div key={i} className="mt-3"><p className="text-yellow-200">{finding.type}{finding.page ? ` · ${finding.page === 'Title' ? 'Title' : 'Page ' + finding.page}` : ''}: {finding.message}</p>{finding.excerpt && <blockquote className="text-sm text-gray-300 mt-1 break-words">{finding.excerpt}</blockquote>}</div>)}
            {report.matches.map(match => <div key={match.id} className="mt-3">
              <p className="text-yellow-200">Text overlap with “{reports.find(r => r.id === match.id)?.title}” (submission {match.id})</p>
              <p className="text-sm">Page {match.page} matches page {match.sourcePage} · {match.count} shared sequences</p>
              <blockquote className="text-sm text-gray-300 break-words">“{match.excerpt}”</blockquote>
            </div>)}
          </details>)}
        </div>
      </>}
    </section>
  );
}
