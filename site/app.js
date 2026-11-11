import { renderProse } from './prose.mjs';
import { paragraphDiff, novelpiaText } from './studio.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params = new URLSearchParams(location.search);
let view = params.get('view') || 'home';
let chapterId = params.get('chapter') || '';
let compare = '';
let data;
const main = document.querySelector('#main');

const head = (kicker, title, text) => `<header class="head"><span>${esc(kicker)}</span><h1>${esc(title)}</h1>${text ? `<p>${esc(text)}</p>` : ''}</header>`;
const md = text => renderProse(text || '미정');
const fields = rows => `<dl class="fields">${rows.filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
const empty = (mark, title, text) => `<section class="empty"><b>${esc(mark)}</b><h2>${esc(title)}</h2><p>${text}</p></section>`;
const stageIndex = stage => data.stages.indexOf(stage);
const steps = stage => `<div class="steps">${data.stages.map((s, i) => `<span class="${i < stageIndex(stage) ? 'done' : i === stageIndex(stage) ? 'now' : ''}">${esc(s)}</span>`).join('')}</div>`;
const statusBadge = status => `<span class="badge ${/확정|발행|비식별 확인/.test(status) ? 'ok' : /대기|미정/.test(status) ? 'wait' : ''}">${esc(status)}</span>`;
const chaptersOf = ep => data.chapters.filter(c => c.episode === ep);
const episodeTitle = id => data.episodes.find(e => e.id === id)?.title || id;

function readiness() {
  if (!data.episodes.length) return 0;
  const total = data.episodes.reduce((sum, e) => sum + stageIndex(e.stage), 0);
  return Math.round(total / (data.episodes.length * (data.stages.length - 1)) * 100);
}

function nextTasks() {
  const tasks = data.episodes.map(e => {
    const label = `${e.id} ${e.title}`;
    return ({
      소재: `${label} — Story Planner로 회차 플롯을 제안받고 승인`,
      플롯: `${label} — 플롯 확정 후 1화 초고 작성 (prompts/writer.md)`,
      초고: `${label} — 설정·흥미도 검수 요청`,
      검수: `${label} — 검수 반영 후 원고 확정, 노벨피아 발행 대기`,
      발행: null,
    })[e.stage];
  }).filter(Boolean);
  return tasks.concat((data.project.sections['미정 사항'] || '').split('\n').filter(l => l.startsWith('- ')).map(l => `결정 필요 — ${l.slice(2)}`));
}

function home() {
  const p = data.project;
  const confirmed = data.chapters.filter(c => c.status === '확정').length;
  const recent = [...data.chapters].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 3);
  return head(`PROJECT EUROPE · ${p.status}`, p.title, `${p.genre} · ${p.period}`)
    + `<section class="stats"><div class="stat"><b>${data.experiences.length}</b><span>수집된 여행썰</span></div><div class="stat"><b>${data.episodes.length}</b><span>에피소드</span></div><div class="stat"><b>${data.chapters.length}<small>화</small></b><span>원고 (확정 ${confirmed}화)</span></div><div class="stat"><b>${readiness()}%</b><span>연재 준비율 · 파이프라인 기준</span><progress max="100" value="${readiness()}"></progress></div></section>`
    + `<section class="panel"><h2>작품의 핵심</h2>${md(p.sections['작품의 핵심'])}</section>`
    + `<section class="panel"><h2>집필 파이프라인</h2><div class="pipeline">${data.stages.map(s => { const eps = data.episodes.filter(e => e.stage === s); return `<div><h4>${esc(s)}<small>${eps.length}</small></h4>${eps.map(e => `<button data-view="episodes">${esc(e.id)} · ${esc(e.title)}<small>원고 ${chaptersOf(e.id).length}화</small></button>`).join('')}</div>`; }).join('')}</div></section>`
    + `<div class="grid"><section class="panel"><h2>다음 할 일</h2><ol>${nextTasks().map(t => `<li>${esc(t)}</li>`).join('')}</ol></section><section class="panel"><h2>최근 원고</h2>${recent.length ? `<ul>${recent.map(c => `<li>${esc(c.id)} 《${esc(c.title)}》 · ${c.characters.toLocaleString()}자 · ${esc(c.status)}</li>`).join('')}</ul>` : '<p>아직 원고가 없습니다. 첫 목표는 파리 편 1~2화와 스위스·프라하 편입니다.</p>'}</section></div>`
    + `<details class="panel"><summary>집필 원칙과 흥미 기준</summary><h3>집필 원칙</h3>${md(p.sections['집필 원칙'])}<h3>흥미 기준</h3>${md(p.sections['흥미 기준'])}</details>`
    + `<div class="notice">이 대시보드는 읽기 전용입니다. 여행썰·플롯·원고는 서버 <code>~/eurang</code>의 Markdown 파일이 정본이고, 집필 Claude가 작가 승인을 받아 수정합니다. 수정 후 <code>./deploy.sh</code>로 반영됩니다.</div>`;
}

function experiences() {
  return head('TRAVEL ARCHIVE · 실제 경험', '여행썰 보관함', '실제로 있었던 일만 기록합니다. 소설에서 바뀌는 내용은 에피소드 보드에 따로 적습니다. 실존 인물은 A·B·C 같은 비식별 라벨로만 씁니다.')
    + `<div class="grid">${data.experiences.map(x => `<article class="card"><header><span class="meta">여행썰 #${esc(x.id)}</span>${statusBadge(x.status)}</header><h3>${esc(x.title)}</h3>${fields([['시기', x.period], ['장소', x.location], ['등장인물', x.participants.join(', ')], ['관계', x.relation], ['식별 정보', x.privacy]])}${Object.entries(x.sections).map(([k, v]) => `<h4 class="kicker">${esc(k)}</h4><div class="reader-body">${md(v)}</div>`).join('')}<span class="meta">${esc(x.file)} · 사용 에피소드: ${esc(data.episodes.filter(e => e.sources.includes(x.id)).map(e => e.id).join(', ') || '없음')}</span></article>`).join('')}</div>`;
}

function episodes() {
  return head('EPISODE BOARD · 소설 각색', '에피소드 보드', '여행썰을 어떻게 각색했는지 왼쪽(실제)과 오른쪽(소설)으로 나란히 봅니다. 단계: 소재 → 플롯(승인) → 초고 → 검수 → 발행.')
    + data.episodes.map(e => {
      const sources = data.experiences.filter(x => e.sources.includes(x.id));
      const chs = chaptersOf(e.id);
      return `<section class="panel"><header class="ep-head"><span class="meta">${esc(e.id)} · 순서 ${e.order} · ${esc(e.file)}</span><h3>${esc(e.title)}</h3>${steps(e.stage)}</header>
        <div class="split"><section><h4>실제 경험 · ${esc(sources.map(x => '#' + x.id).join(', ') || '연결 없음')}</h4>${sources.map(x => `<p>${esc(x.sections['실제 경험'] || '')}</p>`).join('')}</section><section><h4>소설 시놉시스</h4>${md(e.sections['시놉시스'])}</section></div>
        <div class="grid"><div><h3>플롯</h3><div class="reader-body">${md(e.sections['플롯'])}</div></div><div><h3>각색 포인트 (실제와 다른 점)</h3><div class="reader-body">${md(e.sections['각색 포인트 (실제와 다른 점)'])}</div><h3>미정 사항</h3><div class="reader-body">${md(e.sections['미정 사항'])}</div></div></div>
        <h3>회차</h3>${chs.length ? `<div class="tabs">${chs.map(c => `<button data-view="chapters" data-chapter="${esc(c.id)}">${c.number}화 · ${esc(c.title)} · ${c.characters.toLocaleString()}자</button>`).join('')}</div>` : '<p>아직 원고가 없습니다.</p>'}</section>`;
    }).join('');
}

function chapters() {
  if (!data.chapters.length) return head('MANUSCRIPT', '원고', '회차별 원고, 글자 수, 수정 전후 비교, 노벨피아 복사.') + empty('✎', '첫 원고를 기다리는 중', '플롯이 승인되면 <code>manuscripts/current/EP01-01.md</code> 형식으로 원고가 등록됩니다.<br>수정 전 버전은 <code>manuscripts/archive/</code>에 남아 여기서 비교할 수 있습니다.');
  const current = data.chapters.find(c => c.id === chapterId) || data.chapters[0];
  chapterId = current.id;
  const index = data.chapters.indexOf(current);
  const version = current.versions.find(v => v.label === compare);
  const body = version
    ? `<div class="diff">${paragraphDiff(version.text, current.text).map(([type, text]) => `<p class="${type}">${esc(text)}</p>`).join('')}</div>`
    : `<div class="reader-body">${renderProse(current.text)}</div>`;
  return head('MANUSCRIPT', '원고', '회차별 원고를 읽고, 보관된 이전 버전과 비교하고, 노벨피아 업로드용으로 복사합니다.')
    + `<nav class="tabs">${data.chapters.map(c => `<button data-chapter="${esc(c.id)}" class="${c === current ? 'active' : ''}">${esc(c.id)} · ${esc(c.title)}</button>`).join('')}</nav>`
    + `<article class="reader"><header><span>${esc(current.episode)} ${esc(episodeTitle(current.episode))} · ${current.number}화 · ${esc(current.status)} · 공백 포함 ${current.characters.toLocaleString()}자 · 공백 제외 ${current.charactersNoSpace.toLocaleString()}자</span><h2>${esc(current.title)}</h2></header>
      <div class="toolbar"><button data-copy="${esc(current.id)}">노벨피아용 복사</button>${current.versions.length ? `<select data-compare aria-label="비교할 이전 버전"><option value="">이전 버전과 비교…</option>${current.versions.map(v => `<option value="${esc(v.label)}" ${v.label === compare ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>` : '<button disabled>보관된 이전 버전 없음</button>'}</div>
      ${version ? `<div class="notice">「${esc(version.label)}」 → 현재 원고. 초록은 추가된 문단, 빨강은 삭제된 문단입니다.</div>` : ''}${body}
      <div class="toolbar"><button data-chapter="${esc(data.chapters[index - 1]?.id)}" ${index === 0 ? 'disabled' : ''}>← 이전화</button><button data-top>맨 위로 ↑</button><button data-chapter="${esc(data.chapters[index + 1]?.id)}" ${index === data.chapters.length - 1 ? 'disabled' : ''}>다음화 →</button></div></article>`;
}

function characters() {
  return head('CHARACTERS & SETTING', '인물·설정집', '모든 인물은 가상 인물이며 전원 성인입니다. 실존 인물의 이름·직업·외형은 새로 만든 정보로 바꿉니다.')
    + `<div class="grid three">${data.characters.map(c => `<article class="card"><span class="meta">${esc(c.role)}</span><h3>${esc(c.name)}</h3>${fields([['나이', c.age], ['등장', c.episodes.join(', ')], ...Object.entries(c.sections)])}</article>`).join('')}</div>`
    + `<section class="panel"><h2>2017년 여행 동선</h2><ol class="timeline">${data.timeline.map(t => `<li><small>${esc(t.period)} · ${esc(t.episode)}</small><b>${esc(t.location)}</b><p>${esc(t.description)}</p></li>`).join('')}</ol></section>`;
}

function review() {
  const roles = [['planner', 'Story Planner', '여행썰 → 기승전결·회차 구성·장면 목표'], ['writer', 'Novel Writer', '승인된 플롯 → 회차 초고'], ['continuity', 'Continuity Checker', '날짜·동선·숙소·관계·대화 모순'], ['reviewer', 'Reader Appeal Reviewer', '흡입력·코미디·설렘·긴장감·다음 화']];
  return head('AI REVIEW ROOM', 'AI 검수실', 'Claude의 역할별 지침과 검수 기록입니다. 검수 결과는 원고에 자동 반영하지 않고, 작가가 승인한 문단만 고칩니다.')
    + `<div class="notice">흐름: 여행썰 입력 → Planner 플롯 제안 → 작가 승인 → Writer 초고 → Continuity·Reader 검수 → 수정안 비교 → 확정 → 발행 대기</div>`
    + `<div class="grid">${roles.map(([file, name, text]) => { const prompt = data.prompts.find(p => p.file === `prompts/${file}.md`); return `<details class="panel"><summary>${esc(name)} — ${esc(text)}</summary>${prompt ? `<pre class="prompt">${esc(prompt.text)}</pre>` : '<p>지침 파일 없음</p>'}</details>`; }).join('')}</div>`
    + `<section class="panel"><h2>검수 기록</h2>${data.reviews.length ? data.reviews.map(r => `<details class="panel"><summary>${esc(r.date)} · ${esc(r.chapter)} · ${esc(r.role)}</summary><div class="reader-body">${renderProse(r.body)}</div></details>`).join('') : '<p>아직 검수 기록이 없습니다. 원고가 생기면 <code>content/reviews/</code>에 1건씩 쌓입니다.</p>'}</section>`;
}

function publishing() {
  const records = data.publishing;
  const byChapter = Object.fromEntries(records.map(r => [r.chapter, r]));
  return head('PUBLISHING · NOVELPIA', '연재 관리', '노벨피아 자동 업로드는 하지 않습니다. 원고를 복사해 직접 올리고, 공개 상태와 조회수 등을 수동으로 기록합니다.')
    + (data.chapters.length ? `<section class="panel"><h2>회차별 발행 현황</h2><table><thead><tr><th>회차</th><th>제목</th><th>글자 수</th><th>원고 상태</th><th>발행</th><th>공개일</th><th>조회</th><th>추천</th><th>댓글</th><th></th></tr></thead><tbody>${data.chapters.map(c => { const r = byChapter[c.id] || {}; return `<tr><td>${esc(c.id)}</td><td>${esc(c.title)}</td><td>${c.characters.toLocaleString()}</td><td>${esc(c.status)}</td><td>${statusBadge(r.status || '발행 대기')}</td><td>${esc(r.published_at || '—')}</td><td>${esc(r.views ?? '—')}</td><td>${esc(r.recommendations ?? '—')}</td><td>${esc(r.comments ?? '—')}</td><td><button class="badge" data-copy="${esc(c.id)}">복사</button></td></tr>`; }).join('')}</tbody></table></section>`
      : empty('▤', '발행할 원고가 아직 없습니다', '원고가 확정되면 여기서 노벨피아용으로 복사하고 공개 일정·조회수·추천·댓글을 기록합니다.'))
    + `<section class="panel"><h2>기록 방법</h2><p><code>content/publishing.json</code>의 <code>records</code>에 회차마다 한 줄씩 추가합니다. 예:</p><pre class="prompt">{"chapter": "EP01-01", "status": "공개", "published_at": "2026-12-01", "url": "", "views": 0, "recommendations": 0, "comments": 0}</pre><p>업로드용 텍스트 파일은 <code>python3 scripts/export_novelpia.py</code>로 <code>exports/novelpia/</code>에 만들 수 있습니다.</p></section>`;
}

const views = [['home', '홈'], ['experiences', '여행썰 보관함'], ['episodes', '에피소드 보드'], ['chapters', '원고'], ['characters', '인물·설정집'], ['review', 'AI 검수실'], ['publishing', '연재 관리']];
const renderers = { home, experiences, episodes, chapters, characters, review, publishing };

function render() {
  if (!renderers[view]) view = 'home';
  document.querySelector('#navigation').innerHTML = views.map(([id, label], i) => `<button data-view="${id}" class="${id === view ? 'active' : ''}" ${id === view ? 'aria-current="page"' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${label}</button>`).join('');
  document.querySelector('#breadcrumb').textContent = views.find(([id]) => id === view)[1];
  main.innerHTML = renderers[view]();
  const next = new URLSearchParams({ view });
  if (view === 'chapters' && chapterId) next.set('chapter', chapterId);
  history.replaceState(null, '', `${location.pathname}?${next}`);
}

function toast(message) {
  const el = Object.assign(document.createElement('div'), { className: 'toast', textContent: message, role: 'status' });
  document.body.append(el);
  setTimeout(() => el.remove(), 2200);
}

document.addEventListener('click', async e => {
  const button = e.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.copy) {
    const c = data.chapters.find(x => x.id === button.dataset.copy);
    try { await navigator.clipboard.writeText(novelpiaText(c)); toast(`${c.id} 원고를 복사했습니다 (${c.characters.toLocaleString()}자)`); }
    catch { toast('복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.'); }
    return;
  }
  if (button.dataset.view) view = button.dataset.view;
  if (button.dataset.chapter) { if (chapterId !== button.dataset.chapter) compare = ''; chapterId = button.dataset.chapter; if (!button.dataset.view) view = 'chapters'; }
  if (button.hasAttribute('data-top')) return window.scrollTo({ top: 0, behavior: 'smooth' });
  render(); window.scrollTo(0, 0);
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-compare]')) { compare = e.target.value; render(); }
});

try {
  const response = await fetch('./data/project.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`자료를 불러오지 못했습니다 (HTTP ${response.status}).`);
  data = await response.json();
  render();
} catch (error) {
  main.innerHTML = empty('!', '기록을 열 수 없습니다', esc(error.message));
}
