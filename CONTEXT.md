# eurang — 작품 맥락 (세션이 먼저 읽는다)

가제 《저녁만 먹기로 했잖아요》 — 2017년 유럽 배낭여행 경험을 각색한 성인(19금) 로맨틱 코미디 옴니버스. 서버 `~/eurang`에서 기획·집필하고, 노벨피아에 추후 연재한다. 기획 원문은 `docs/PROJECT_PLAN.md`.

## 확정된 것 (2026-11-11 사용자 전달)

- 저장소: https://github.com/gtjdbfla/eurang (서버 `~/eurang`이 정본, GitHub는 이력 보관)
- 다른 소설(`fullmetal_alchemist`, `religion_novel`)과 같은 방식으로 관리한다.
- 연재처: 노벨피아(추후). 자동 업로드는 개발 범위에서 제외, 수동 발행 기록만.
- 핵심 원칙: 실제 경험 보관함과 소설 각색을 분리, 실존 인물 식별 정보 저장 금지, 등장인물 전원 성인, AI가 원고를 덮어쓰지 않음(플롯 승인 → 초고 → 검수 → 수정안 비교 → 확정).
- 샘플: EP01 파리 첫 동행, EP02 스위스에서 프라하까지 (`docs/PROJECT_PLAN.md` 참고).

## 서버에서 이미 있는 다른 소설 프로젝트의 구조 (참고)

- `~/fullmetal_alchemist`, `~/religion_novel`: Caddy 정적 사이트(`site/`) + `scripts/build_views.py`가 `author-site/`를 생성, Funnel 10000의 경로(`/east`, `/religion`)로 공개, 수동 `./deploy.sh`.

## 대시보드 (2026-11-11 구축)

- 다른 소설과 같은 방식으로 결정: Markdown 정본 + `scripts/build_views.py` → `site/data/project.json` + Caddy 정적 사이트. 원안의 Next.js/FastAPI/SQLite는 쓰지 않는다(서버에 Node 없음, MVP 후 집필 우선). 브라우저 편집 대신 집필 Claude가 파일을 고친다.
- 주소 `https://yulmserver.tail261e6c.ts.net:10000/eurang/`, 컨테이너 `eurang-novel`(127.0.0.1:8103), 망상연구소 홈(`~/macro-flow-dashboard/home`)에 06번 카드 추가.
- 처음엔 basic_auth를 걸었으나 사용자 요청으로 2026-11-11 해제했다(누구나 URL로 열람 가능, 19금 자료). 다시 걸 때 쓸 해시는 `.env`, 평문은 `secrets/basic_auth.txt`에 남아 있다.
- 메뉴 7개: 홈 · 여행썰 보관함 · 에피소드 보드(실제/소설 나란히) · 원고(글자 수·이전 버전 비교·노벨피아 복사) · 인물·설정집(+동선) · AI 검수실(역할 지침+검수 기록) · 연재 관리(`content/publishing.json` 수동 기록).
- 반영: `./deploy.sh` (자동 cron 배포는 아직 없음).

## 아직 정해지지 않은 것 (사용자 결정 필요)

1. EP01 회차 구성(1화 단편/2화), 주인공·인물 가명, 옴니버스 연결 방식 — 집필 착수 전에 정한다.
2. 작품 제목 확정 여부(현재 가제), 연재 분량·회차당 글자 수 기준(다른 소설은 7,000자 권장·9,000자 허용이었음 — 이 작품에도 적용할지).

## 작업 규칙

- 원고는 Markdown, 설정·플롯도 Markdown. 새로 알게 된 사실과 결정은 이 파일에 쓴다.
