#!/usr/bin/env bash

set -euo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

cd "$ROOT"

MODE="${1:-full}"

case "$MODE" in
    full)
        TESTS="CandidateAuthTest,CandidateBusinessTest,CandidateProfileRegistrationTest"
        EXPECTED=10
        ;;
    demo)
        TESTS="CandidateAuthTest#loginValidoCandidato,CandidateBusinessTest#recorridoCompletoCandidato"
        EXPECTED=2
        ;;
    *)
        echo "Uso: $0 [full|demo]"
        exit 2
        ;;
esac

if [ -n "${QA19_TESTS:-}" ]; then
    TESTS="$QA19_TESTS"
    EXPECTED=0
fi

export QA19_EXPECTED="$EXPECTED"

echo "Modo QA-19: $MODE"


export SELENIUM_RUN_ID
SELENIUM_RUN_ID="$(python3 -c 'import uuid; print(uuid.uuid4())')"

export SELENIUM_FIXTURE_PASSWORD
SELENIUM_FIXTURE_PASSWORD="$(python3 -c 'import secrets; print("Qa1#" + secrets.token_hex(16))')"

PRIVATE="$(mktemp -d)"

export SELENIUM_FIXTURE_FILE="$PRIVATE/fixtures.json"

limpiar() {

    local codigo=$?

    trap - EXIT

    echo "===== LIMPIEZA QA-19 ====="

    if python3 qa/selenium/scripts/fixtures.py limpiar; then
        echo "PASS: Limpieza QA-19"
    else
        echo "ERROR: Limpieza QA-19"
        codigo=1
    fi

    rm -f "$SELENIUM_FIXTURE_FILE"

    echo "Reportes privados: $PRIVATE"

    exit "$codigo"
}

echo "===== PREFLIGHT QA-19 ====="

test "$(curl -fsS -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:8002/up)" = "200"

test "$(curl -fsS -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:4202/)" = "200"

curl -fsS http://127.0.0.1:4444/status \
    | python3 -c '
import json, sys
assert json.load(sys.stdin)["value"]["ready"]
'

echo "PASS: Preflight QA-19"

echo "Run ID: $SELENIUM_RUN_ID"

trap limpiar EXIT

python3 qa/selenium/scripts/fixtures.py preparar

export SELENIUM_CANDIDATE_EMAIL
SELENIUM_CANDIDATE_EMAIL="$(python3 -c '
import json, os
print(json.load(open(os.environ["SELENIUM_FIXTURE_FILE"]))["candidato"]["correo"])
')"

export SELENIUM_NEGATIVE_EMAIL
SELENIUM_NEGATIVE_EMAIL="$(python3 -c '
import json, os
print(json.load(open(os.environ["SELENIUM_FIXTURE_FILE"]))["candidato_negativo"]["correo"])
')"

export SELENIUM_BUSINESS_EMAIL
SELENIUM_BUSINESS_EMAIL="$(python3 -c '
import json, os
print(json.load(open(os.environ["SELENIUM_FIXTURE_FILE"]))["candidato_negocio"]["correo"])
')"

export SELENIUM_CANDIDATE_ID
SELENIUM_CANDIDATE_ID="$(python3 -c '
import json, os
print(json.load(open(os.environ["SELENIUM_FIXTURE_FILE"]))["candidato_negocio"]["id"])
')"

export SELENIUM_VACANCY_ID
SELENIUM_VACANCY_ID="$(python3 -c '
import json, os
print(json.load(open(os.environ["SELENIUM_FIXTURE_FILE"]))["vacante"]["id"])
')"

export SELENIUM_VACANCY_TITLE
SELENIUM_VACANCY_TITLE="$(python3 -c '
import json, os
print(json.load(open(os.environ["SELENIUM_FIXTURE_FILE"]))["vacante"]["titulo"])
')"

for campo in correo dni celular
do
    valor="$(python3 -c '
import json, os, sys

datos = json.load(
    open(os.environ["SELENIUM_FIXTURE_FILE"])
)["registro"]

print(datos[sys.argv[1]])
' "$campo")"

    export "SELENIUM_REG_${campo^^}=$valor"
done

echo "===== SELENIUM QA-19 ====="

set +e

mvn -B -ntp \
    -f qa/selenium/pom.xml \
    "-Dtest=$TESTS" \
    clean test \
    > "$PRIVATE/maven.log" 2>&1

CODIGO=$?

set -e

for carpeta in surefire-reports qa-evidence
do
    if [ -d "qa/selenium/target/$carpeta" ]; then
        cp -a "qa/selenium/target/$carpeta" "$PRIVATE/"
    fi
done

grep -E \
    'Tests run:|BUILD SUCCESS|BUILD FAILURE' \
    "$PRIVATE/maven.log" || true

echo "Exit code Maven: $CODIGO"

test "$CODIGO" -eq 0

python3 - "$PRIVATE" <<'CHECK'
import os
import sys
import re
from pathlib import Path
import xml.etree.ElementTree as ET

base = Path(sys.argv[1])

reportes = sorted(
    (base / "surefire-reports").glob("TEST-*.xml")
)

assert reportes, "No hay reportes XML"

totales = {
    "tests": 0,
    "failures": 0,
    "errors": 0,
    "skipped": 0
}

for archivo in reportes:

    raiz = ET.parse(archivo).getroot()

    for campo in totales:
        totales[campo] += int(raiz.attrib.get(campo, 0))

assert totales["tests"] > 0

esperado = int(os.environ["QA19_EXPECTED"])

if esperado:
    assert totales["tests"] == esperado, totales

assert totales["failures"] == 0
assert totales["errors"] == 0
assert totales["skipped"] == 0

password = os.environ["SELENIUM_FIXTURE_PASSWORD"].encode()

token = re.compile(
    b'\\b[0-9]+\\|[A-Za-z0-9]{30,}\\b'
)

for archivo in base.rglob("*"):

    if archivo.is_file():

        datos = archivo.read_bytes()

        assert password not in datos, "Credencial detectada"

        assert not token.search(datos), "Token detectado"

print("PASS: Cantidad de pruebas:", totales["tests"])
print("PASS: Escaneo de credenciales y tokens")
CHECK

echo "PASS: Ejecucion Selenium QA-19"
