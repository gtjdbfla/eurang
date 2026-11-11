const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline = text => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export function renderProse(text) {
  return text.split(/\n\s*\n/).map(paragraph => {
    const trimmed = paragraph.trim();
    if (['*', '* * *', '---', '⸻'].includes(trimmed)) return '<div class="scene-break" role="separator" aria-label="장면 전환">* * *</div>';
    if (trimmed.startsWith('> ')) return `<blockquote>${inline(trimmed.replace(/^>\s?/gm, ''))}</blockquote>`;
    return `<p>${inline(paragraph)}</p>`;
  }).join('');
}
