/**
 * Extracts plain text from an uploaded resume file (PDF, Word .docx, or text).
 * Everything runs in the browser — the file is never uploaded anywhere.
 */

const MAX_CHARS = 20000;

function clean(text: string) {
  return text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_CHARS);
}

async function fromPdf(file: File): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  const max = Math.min(doc.numPages, 10);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it: any) => ('str' in it ? it.str : '')).join(' '));
  }
  return pages.join('\n\n');
}

async function fromDocx(file: File): Promise<string> {
  const mammoth: any = await import('mammoth/mammoth.browser');
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result?.value ?? '';
}

export const RESUME_FILE_ACCEPT = '.pdf,.docx,.txt,.md,.csv,.json,application/pdf,text/*';

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  let raw = '';
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    raw = await fromPdf(file);
  } else if (name.endsWith('.docx')) {
    raw = await fromDocx(file);
  } else if (/\.(txt|md|csv|json)$/i.test(name) || file.type.startsWith('text/')) {
    raw = await file.text();
  } else if (name.endsWith('.doc')) {
    throw new Error('DOC_LEGACY');
  } else {
    throw new Error('UNSUPPORTED');
  }
  const text = clean(raw);
  if (text.length < 40) throw new Error('EMPTY');
  return text;
}
