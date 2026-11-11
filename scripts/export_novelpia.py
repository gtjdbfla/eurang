"""노벨피아 업로드용 평문을 exports/novelpia/<회차>.txt 로 만든다. 업로드는 직접 한다.

변환 규칙은 site/studio.mjs 의 novelpiaText 와 같다.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_views import ROOT, build  # noqa: E402

BREAKS = {'*', '* * *', '---', '⸻'}


def novelpia_text(chapter):
    body = []
    for p in (x.strip() for x in re.split(r'\n\s*\n', chapter['text'])):
        if not p:
            continue
        if p in BREAKS:
            body.append('* * *')
        else:
            body.append(re.sub(r'\*\*(.+?)\*\*', r'\1', re.sub(r'^>\s?', '', p, flags=re.M)))
    return '\n\n'.join([chapter['title'], *body]) + '\n'


if __name__ == '__main__':
    out = ROOT / 'exports/novelpia'
    out.mkdir(parents=True, exist_ok=True)
    chapters = build()['chapters']
    for c in chapters:
        (out / f'{c["id"]}.txt').write_text(novelpia_text(c), encoding='utf-8')
    print(f'{len(chapters)}화 → {out}')
