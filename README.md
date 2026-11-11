# 저녁만 먹기로 했잖아요 — 집필 대시보드

2017년 유럽 배낭여행을 각색한 19금 성인 로맨틱 코미디 옴니버스. 노벨피아 연재 예정.

- 주소: https://yulmserver.tail261e6c.ts.net:10000/eurang/ (비밀번호 없음)
- 홈: https://yulmserver.tail261e6c.ts.net:10000/

## 구조 (다른 소설과 같은 방식: Markdown 정본 + 정적 대시보드)

| 경로 | 내용 |
| --- | --- |
| `content/project.md` | 작품 개요, 집필 원칙, 흥미 기준, 미정 사항 |
| `content/experiences/` | **실제 경험**(여행썰). 실존 인물은 A·B·C 라벨만 |
| `content/episodes/` | **소설 각색**. `stage: 소재/플롯/초고/검수/발행`, `sources: 001` |
| `content/characters/` | 가상 인물(전원 성인) |
| `content/timeline.md` | `- 시기 \| 장소 \| 에피소드 \| 내용` |
| `content/reviews/` | AI 검수 기록 1건 = 파일 1개 |
| `content/publishing.json` | 노벨피아 발행·조회수 수동 기록 |
| `manuscripts/current/EP01-01.md` | 현재 원고. 첫 줄 `# 제목` |
| `manuscripts/archive/EP01-01.설명.md` | 수정 전 버전 (대시보드에서 문단 비교) |
| `prompts/` | Planner·Writer·Continuity·Reviewer 역할 지침 |
| `site/` | 대시보드(정적). `site/data/project.json`은 빌드 산출물 |

동기화 규칙: Markdown이 유일한 정본이고, `scripts/build_views.py`가 매번 JSON을 새로 만든다. 대시보드는 읽기 전용이라 원고를 덮어쓰지 않는다. 형식이 틀리면 빌드가 멈추고 파일 이름과 이유를 알려준다.

## 명령

```sh
./deploy.sh                          # 빌드 + 테스트 + 컨테이너 반영
python3 scripts/export_novelpia.py   # exports/novelpia/*.txt 생성
python3 scripts/serve.py             # 로컬 미리보기 127.0.0.1:8113
python3 -m unittest discover -s tests
docker run --rm -v "$PWD":/w -w /w node:22-alpine node --test tests/studio.test.mjs
```

## 서버

Docker 서비스 `eurang-novel`(Caddy, 127.0.0.1:8103), Funnel 경로 `/eurang`.

```sh
tailscale funnel --bg --yes --https=10000 --set-path=/eurang http://127.0.0.1:8103
```
