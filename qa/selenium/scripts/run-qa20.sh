#!/usr/bin/env bash

set -euo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

cd "$ROOT"

MODE="${1:-full}"

case "$MODE" in
    full)
        TESTS="CompanyAdminAuthTest,AdminModerationTest,CompanyPaymentTest,CompanyKanbanTest,CompanyConflictTest"
        EXPECTED=9
        ;;
    demo)
        TESTS="AdminModerationTest#aprobarVacanteSinPublicacionAutomatica,CompanyPaymentTest#pagoSimuladoPublicaVacante,CompanyKanbanTest#gestionarContratacionYRechazo"
        EXPECTED=3
        ;;
    *)
        echo "Uso: $0 [full|demo]"
        exit 2
        ;;
esac

if [ -n "${QA20_TESTS:-}" ]; then
    TESTS="$QA20_TESTS"
    EXPECTED=0
fi

export QA20_EXPECTED="$EXPECTED"

echo "Modo QA-20: $MODE"


export SELENIUM_RUN_ID
SELENIUM_RUN_ID="$(python3 -c 'import uuid; print(uuid.uuid4())')"

export SELENIUM_FIXTURE_PASSWORD
SELENIUM_FIXTURE_PASSWORD="$(python3 -c 'import secrets; print("Qa1#" + secrets.token_hex(16))')"

PRIVATE="$(mktemp -d)"

export SELENIUM_FIXTURE_FILE="$PRIVATE/fixtures.json"

limpiar() {

    local codigo=$?

    trap - EXIT

    echo "===== LIMPIEZA QA-20 ====="

    if python3 qa/selenium/scripts/fixtures_qa20.py limpiar; then
        echo "PASS: Limpieza QA-20"
    else
        echo "ERROR: Limpieza QA-20"
        codigo=1
    fi

    rm -f "$SELENIUM_FIXTURE_FILE"

    echo "Reportes privados: $PRIVATE"

    exit "$codigo"
}

echo "===== PREFLIGHT QA-20 ====="

test "$(curl -fsS -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:8002/up)" = "200"

test "$(curl -fsS -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:4202/)" = "200"

curl -fsS http://127.0.0.1:4444/status \
    | python3 -c '
import json, sys
assert json.load(sys.stdin)["value"]["ready"]
'

echo "PASS: Preflight QA-20"

echo "Run ID: $SELENIUM_RUN_ID"

trap limpiar EXIT

python3 qa/selenium/scripts/fixtures_qa20.py preparar

leer_fixture() {

    python3 - "$1" "$2" <<'DATA'
import json
import os
import sys

with open(os.environ["SELENIUM_FIXTURE_FILE"]) as f:
    datos = json.load(f)

print(datos[sys.argv[1]][sys.argv[2]])
DATA
}

export SELENIUM_COMPANY_EMAIL
SELENIUM_COMPANY_EMAIL="$(leer_fixture empresa correo)"

export SELENIUM_COMPANY_ID
SELENIUM_COMPANY_ID="$(leer_fixture empresa id)"

export SELENIUM_ADMIN_EMAIL
SELENIUM_ADMIN_EMAIL="$(leer_fixture admin correo)"

export SELENIUM_CANDIDATE_A_EMAIL
SELENIUM_CANDIDATE_A_EMAIL="$(leer_fixture candidato_a correo)"

export SELENIUM_CANDIDATE_A_ID
SELENIUM_CANDIDATE_A_ID="$(leer_fixture candidato_a id)"

export SELENIUM_CANDIDATE_B_EMAIL
SELENIUM_CANDIDATE_B_EMAIL="$(leer_fixture candidato_b correo)"

export SELENIUM_CANDIDATE_B_ID
SELENIUM_CANDIDATE_B_ID="$(leer_fixture candidato_b id)"

export SELENIUM_VACANCY_ID
SELENIUM_VACANCY_ID="$(leer_fixture vacante id)"

export SELENIUM_VACANCY_TITLE
SELENIUM_VACANCY_TITLE="$(leer_fixture vacante titulo)"

export SELENIUM_REJECT_VACANCY_ID
SELENIUM_REJECT_VACANCY_ID="$(leer_fixture vacante_rechazo id)"

export SELENIUM_REJECT_VACANCY_TITLE
SELENIUM_REJECT_VACANCY_TITLE="$(leer_fixture vacante_rechazo titulo)"

export SELENIUM_PAYMENT_VACANCY_ID
SELENIUM_PAYMENT_VACANCY_ID="$(leer_fixture vacante_pago id)"

export SELENIUM_PAYMENT_VACANCY_TITLE
SELENIUM_PAYMENT_VACANCY_TITLE="$(leer_fixture vacante_pago titulo)"

export SELENIUM_KANBAN_ID
SELENIUM_KANBAN_ID="$(leer_fixture vacante_kanban id)"

export SELENIUM_KANBAN_TITLE
SELENIUM_KANBAN_TITLE="$(leer_fixture vacante_kanban titulo)"

export SELENIUM_APPLICATION_A_ID
SELENIUM_APPLICATION_A_ID="$(leer_fixture postulacion_a id)"

export SELENIUM_APPLICATION_B_ID
SELENIUM_APPLICATION_B_ID="$(leer_fixture postulacion_b id)"

export SELENIUM_APPLICATION_A_NAME
SELENIUM_APPLICATION_A_NAME="$(leer_fixture postulacion_a nombre)"

export SELENIUM_APPLICATION_B_NAME
SELENIUM_APPLICATION_B_NAME="$(leer_fixture postulacion_b nombre)"

export SELENIUM_CONFLICT_VACANCY_ID
SELENIUM_CONFLICT_VACANCY_ID="$(leer_fixture vacante_conflicto id)"

echo "===== SELENIUM QA-20 ====="

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

esperado = int(os.environ["QA20_EXPECTED"])

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

echo "PASS: Ejecucion Selenium QA-20"
