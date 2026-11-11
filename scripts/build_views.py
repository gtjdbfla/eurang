"""content/·manuscripts/·prompts/ 의 Markdown을 읽어 site/data/project.json 을 만든다.

정본은 Markdown 파일이다. JSON은 대시보드용 산출물이라 git에 넣지 않는다.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGES = ['소재', '플롯', '초고', '검수', '발행']
CHAPTER_ID = re.compile(r'^(EP\d{2})-(\d{2})$')


def split_front(text, name):
    """맨 위 --- 블록의 `key: value` 줄과 나머지 본문을 나눈다."""
    meta = {}
    if text.startswith('---\n'):
        end = text.find('\n---', 4)
        if end < 0:
            raise ValueError(f'{name}: 앞머리 --- 블록이 닫히지 않았습니다.')
        for line in text[4:end].splitlines():
            if line.strip():
                key, sep, value = line.partition(':')
                if not sep:
                    raise ValueError(f'{name}: "{line}" 는 key: value 형식이 아닙니다.')
                meta[key.strip()] = value.strip()
        text = text[end + 4:]
    return meta, text.strip()


def sections(body):
    """`## 제목` 단위로 본문을 나눈다."""
    out, current = {}, None
    for line in body.splitlines():
        if line.startswith('## '):
            current = line[3:].strip()
            out[current] = []
        elif current:
            out[current].append(line)
    return {k: '\n'.join(v).strip() for k, v in out.items()}


def items(value):
    return [v.strip() for v in value.split(',') if v.strip()]


def read_cards(folder, required):
    cards = []
    for path in sorted((ROOT / folder).glob('*.md')):
        if path.name == 'README.md':
            continue
        meta, body = split_front(path.read_text(encoding='utf-8'), path.name)
        missing = [k for k in required if not meta.get(k)]
        if missing:
            raise ValueError(f'{folder}/{path.name}: {", ".join(missing)} 항목이 없습니다.')
        cards.append(dict(meta, file=f'{folder}/{path.name}', body=body, sections=sections(body)))
    return cards


def read_chapter(path):
    meta, body = split_front(path.read_text(encoding='utf-8'), path.name)
    lines = body.splitlines()
    if not lines or not lines[0].startswith('# '):
        raise ValueError(f'{path.name}: 첫 줄에 "# 회차 제목"이 필요합니다.')
    text = '\n'.join(lines[1:]).strip()
    return meta, lines[0][2:].strip(), text


def build():
    project_meta, project_body = split_front((ROOT / 'content/project.md').read_text(encoding='utf-8'), 'project.md')
    experiences = read_cards('content/experiences', ['title', 'status', 'period', 'location', 'participants', 'privacy'])
    for exp in experiences:
        exp['id'] = Path(exp['file']).stem.split('-')[0]
        exp['participants'] = items(exp['participants'])
    episodes = read_cards('content/episodes', ['id', 'title', 'order', 'stage'])
    known = {e['id'] for e in experiences}
    for ep in episodes:
        if ep['stage'] not in STAGES:
            raise ValueError(f'{ep["file"]}: stage는 {"/".join(STAGES)} 중 하나여야 합니다.')
        ep['order'] = int(ep['order'])
        ep['sources'] = items(ep.get('sources', ''))
        unknown = [s for s in ep['sources'] if s not in known]
        if unknown:
            raise ValueError(f'{ep["file"]}: 없는 여행썰 번호 {unknown}')
    episodes.sort(key=lambda e: e['order'])
    characters = read_cards('content/characters', ['name', 'role', 'age'])
    for c in characters:
        c['episodes'] = items(c.get('episodes', ''))

    episode_ids = {e['id'] for e in episodes}
    archive = {}
    for path in sorted((ROOT / 'manuscripts/archive').glob('*.md')):
        chapter_id, _, label = path.stem.partition('.')
        _, title, text = read_chapter(path)
        archive.setdefault(chapter_id, []).append(dict(label=label or 'v0', title=title, text=text))
    chapters = []
    for path in sorted((ROOT / 'manuscripts/current').glob('*.md')):
        if path.name == 'README.md':
            continue
        match = CHAPTER_ID.match(path.stem)
        if not match:
            raise ValueError(f'{path.name}: 파일 이름은 EP01-01.md 형식이어야 합니다.')
        if match[1] not in episode_ids:
            raise ValueError(f'{path.name}: 에피소드 {match[1]}가 content/episodes에 없습니다.')
        meta, title, text = read_chapter(path)
        if not text:
            raise ValueError(f'{path.name}: 본문이 비어 있습니다.')
        chapters.append(dict(
            id=path.stem, episode=match[1], number=int(match[2]), title=title,
            status=meta.get('status', '초고'), text=text,
            characters=len(text), charactersNoSpace=len(re.sub(r'\s', '', text)),
            versions=archive.get(path.stem, []),
        ))

    timeline = []
    for line in (ROOT / 'content/timeline.md').read_text(encoding='utf-8').splitlines():
        if line.startswith('- '):
            parts = [p.strip() for p in line[2:].split('|')]
            if len(parts) != 4:
                raise ValueError(f'timeline.md: "{line}" 는 "- 시기 | 장소 | 에피소드 | 내용" 형식이어야 합니다.')
            timeline.append(dict(zip(['period', 'location', 'episode', 'description'], parts)))

    reviews = read_cards('content/reviews', ['chapter', 'role', 'date'])
    prompts = []
    for path in sorted((ROOT / 'prompts').glob('*.md')):
        text = path.read_text(encoding='utf-8').strip()
        prompts.append(dict(file=f'prompts/{path.name}', title=text.splitlines()[0].lstrip('# '), text=text))
    publishing = json.loads((ROOT / 'content/publishing.json').read_text(encoding='utf-8'))

    data = dict(
        project=dict(project_meta, sections=sections(project_body)),
        stages=STAGES, experiences=experiences, episodes=episodes, characters=characters,
        chapters=chapters, timeline=timeline, reviews=reviews, prompts=prompts,
        publishing=publishing.get('records', []),
    )
    out = ROOT / 'site/data'
    out.mkdir(exist_ok=True)
    (out / 'project.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'여행썰 {len(experiences)} · 에피소드 {len(episodes)} · 원고 {len(chapters)}화 · 인물 {len(characters)} · 검수 {len(reviews)}건 생성 완료')
    return data


if __name__ == '__main__':
    build()
