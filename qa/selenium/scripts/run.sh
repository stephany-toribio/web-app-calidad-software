#!/usr/bin/env bash

set -euo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

cd "$ROOT"

MODE="${1:-full}"

case "$MODE" in
    smoke)
        ARGS=(-Dtest=SmokeTest)
        ;;
    full)
        ARGS=(-DexcludedGroups=controlled-failure)
        ;;
    demo)
        ARGS=(-Dgroups=demo)
        ;;
    diagnostic)
        ARGS=(-Dtest=ControlledFailureTest -Dgroups=controlled-failure)
        ;;
    *)
        echo "Uso: $0 smoke|full|demo|diagnostic"
        exit 2
        ;;
esac

echo "===== PREFLIGHT SELENIUM ====="

command -v java >/dev/null
command -v mvn >/dev/null

test -f dist/creo-angular-qa/browser/index.html

test "$(curl -fsS -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:8002/up)" = "200"

test "$(curl -fsS -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:4202/)" = "200"

test "$(curl -sS -o /dev/null -w '%{http_code}' \
    -H 'Accept: application/json' \
    http://127.0.0.1:4202/api/v1/auth/me)" = "401"

curl -fsS http://127.0.0.1:4444/status \
    | python3 -c '
import json, sys
assert json.load(sys.stdin)["value"]["ready"]
'

echo "PASS: Preflight Selenium"

echo "===== SELENIUM $MODE ====="

mvn -B -ntp \
    -f qa/selenium/pom.xml \
    "${ARGS[@]}" \
    clean test

echo "PASS: Ejecucion Selenium"
echo "Reportes: qa/selenium/target/surefire-reports/"
echo "Capturas: qa/selenium/target/qa-evidence/"
