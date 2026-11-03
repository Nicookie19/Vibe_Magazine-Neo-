import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractSubmissionText(url, signal) {
  if (!/\.pdf(?:[?#]|$)/i.test(url)) {
    throw new Error('Text scan unavailable for this file type. Review it manually.');
  }
  signal?.throwIfAborted();
  const task = getDocument({ url, isEvalSupported: false });
  let timer;
  let abort;
  const interrupted = new Promise((_, reject) => {
    abort = () => reject(new DOMException('Scan cancelled', 'AbortError'));
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => reject(new Error('PDF scan timed out. Review it manually or retry.')), 60000);
  });
  try {
    return await Promise.race([(async () => {
      const pdf = await task.promise;
      const pages = [], warnings = [];
      let characters = 0;
      for (let number = 1; number <= Math.min(pdf.numPages, 200); number++) {
        signal?.throwIfAborted();
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        const text = content.items.map(item => item.str || '').join(' ');
        pages.push({ page: number, text: text.slice(0, Math.max(0, 200000 - characters)) });
        characters += text.length;
        page.cleanup();
        if (characters >= 200000) {
          if (characters > 200000 || number < pdf.numPages) {
            warnings.push(`Text limit reached (200,000 characters) on page ${number} of ${pdf.numPages}. Remaining text was not scanned.`);
          }
          break;
        }
      }
      if (pdf.numPages > 200 && pages.length === 200 && characters < 200000) warnings.push(`Page limit reached: only the first 200 of ${pdf.numPages} pages were scanned.`);
      const empty = pages.filter(p => !p.text.trim()).map(p => p.page);
      if (empty.length) warnings.push('No extractable text on pages ' + empty.slice(0, 20).join(', ') + (empty.length > 20 ? '…' : '') + '. Image content needs manual review; OCR is not included.');
      return { pages, warnings };
    })(), interrupted]);
  } catch (error) {
    if (error.name === 'PasswordException') throw new Error('Password-protected PDF: review an unlocked copy.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    await task.destroy();
  }
}
