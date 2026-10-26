import { HtmlMetadata } from '../types';

/**
 * Extracts metadata, outline, word count, and asset statistics from raw HTML.
 */
export function parseHtmlMetadata(html: string, fallbackTitle: string): HtmlMetadata {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Title
    const titleEl = doc.querySelector('title');
    const h1El = doc.querySelector('h1');
    const title = titleEl?.textContent?.trim() || h1El?.textContent?.trim() || fallbackTitle;

    // Description
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      '';

    // Charset
    const charset = doc.querySelector('meta[charset]')?.getAttribute('charset') ||
      doc.characterSet ||
      'UTF-8';

    // Author
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
      '';

    // Headings for outline / table of contents
    const headingEls = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headings = headingEls.map((el, index) => {
      const level = parseInt(el.tagName.substring(1), 10);
      const text = el.textContent?.trim() || `Sezione ${index + 1}`;
      const id = el.id || `heading-${index}`;
      return { level, text, id };
    });

    // Body text for word count and reading time
    const bodyText = doc.body ? (doc.body.innerText || doc.body.textContent || '') : '';
    const words = bodyText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // Asset counts
    const linksCount = doc.querySelectorAll('a[href]').length;
    const imagesCount = doc.querySelectorAll('img[src]').length;
    const scriptsCount = doc.querySelectorAll('script').length;
    const stylesheetsCount = doc.querySelectorAll('link[rel="stylesheet"], style').length;

    return {
      title,
      description: metaDesc.trim(),
      charset,
      author: author.trim(),
      wordCount,
      readTimeMinutes,
      headings,
      linksCount,
      imagesCount,
      scriptsCount,
      stylesheetsCount,
    };
  } catch {
    return {
      title: fallbackTitle,
      description: '',
      charset: 'UTF-8',
      author: '',
      wordCount: 0,
      readTimeMinutes: 1,
      headings: [],
      linksCount: 0,
      imagesCount: 0,
      scriptsCount: 0,
      stylesheetsCount: 0,
    };
  }
}

/**
 * Extracts a readable clean article view from HTML for distraction-free reading.
 */
export function extractReadableContent(html: string): { title: string; bodyHtml: string } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove script, style, nav, footer, iframe, form tags for reader mode
    const elementsToRemove = doc.querySelectorAll('script, style, iframe, noscript');
    elementsToRemove.forEach(el => el.remove());

    const title = doc.querySelector('title')?.textContent || doc.querySelector('h1')?.textContent || 'Documento';

    // Look for article, main, or fallback to body
    const mainEl = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    const bodyHtml = mainEl ? mainEl.innerHTML : html;

    return {
      title: title.trim(),
      bodyHtml,
    };
  } catch {
    return {
      title: 'Documento',
      bodyHtml: html,
    };
  }
}

/**
 * Formats byte size into human readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Sanitizes and generates relative public path
 */
export function computeRelativePath(category: string, subfolder: string, name: string): string {
  const parts = [category.trim(), subfolder.trim(), name.trim()].filter(Boolean);
  return parts.join('/').replace(/\/+/g, '/');
}
