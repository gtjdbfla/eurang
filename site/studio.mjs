const paragraphs = text => text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

// 문단 단위 LCS 비교. [['same'|'add'|'del', 문단], ...]
export function paragraphDiff(before, after) {
  const a = paragraphs(before), b = paragraphs(after);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { out.push(['same', a[i]]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['del', a[i++]]);
    else out.push(['add', b[j++]]);
  }
  while (i < a.length) out.push(['del', a[i++]]);
  while (j < b.length) out.push(['add', b[j++]]);
  return out;
}

// 노벨피아 편집기에 붙여넣을 평문: 굵게 표시·인용 기호를 빼고 장면 전환은 * * * 로 통일한다.
export function novelpiaText(chapter) {
  const body = paragraphs(chapter.text).map(p => {
    if (['*', '* * *', '---', '⸻'].includes(p)) return '* * *';
    return p.replace(/^>\s?/gm, '').replace(/\*\*(.+?)\*\*/g, '$1');
  });
  return [chapter.title, ...body].join('\n\n') + '\n';
}
