#!/bin/sh
# 수동 배포 — 이 폴더의 현재 파일 그대로 반영한다. GitHub는 이력 보관용(매일 자동 커밋·push) — 이 스크립트는 git을 건드리지 않는다.
#   사용: cd ~/eurang && ./deploy.sh
# site/ 는 Caddy 컨테이너가 디렉터리 볼륨으로 물고 있어 build_views.py 가 data/project.json 을 다시 쓰면 즉시 서빙된다.
set -e
cd "$(dirname "$0")"
mkdir -p logs
echo "$(date '+%F %T') 배포 시작"
python3 scripts/build_views.py
python3 -m unittest discover -s tests -q
# Caddyfile·compose·.env 는 바인드 마운트/환경이라 바뀐 경우에만 컨테이너를 다시 만든다
SUM=$(cat Caddyfile docker-compose.yml .env | md5sum | cut -d' ' -f1)
if [ "$SUM" != "$(cat logs/.deploy_sum 2>/dev/null)" ]; then
    docker compose up -d --force-recreate
    echo "$SUM" > logs/.deploy_sum
else
    docker compose up -d
fi
sleep 5
docker compose ps --format '{{.Name}}  {{.Status}}'
echo "$(date '+%F %T') 배포 완료"
