/** Insert markdown at the textarea cursor, optionally replacing an active `[[` trigger. */
export function insertMarkdownSnippet(options: {
  value: string;
  onChange: (value: string) => void;
  textarea: HTMLTextAreaElement | null;
  snippet: string;
  replaceWikiTrigger?: boolean;
}): void {
  const { value, onChange, textarea, snippet, replaceWikiTrigger } = options;

  if (textarea && replaceWikiTrigger) {
    const cursor = textarea.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const wikiMatch = before.match(/\[\[([^\]]*)$/);
    if (wikiMatch) {
      const start = cursor - wikiMatch[0].length;
      const next = value.slice(0, start) + snippet + value.slice(cursor);
      onChange(next);
      requestAnimationFrame(() => {
        const pos = start + snippet.length;
        textarea.setSelectionRange(pos, pos);
        textarea.focus();
      });
      return;
    }
  }

  if (!textarea) {
    onChange(`${value}${snippet}`);
    return;
  }

  const start = textarea.selectionStart ?? value.length;
  const end = textarea.selectionEnd ?? value.length;
  const next = value.slice(0, start) + snippet + value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    const pos = start + snippet.length;
    textarea.setSelectionRange(pos, pos);
    textarea.focus();
  });
}
