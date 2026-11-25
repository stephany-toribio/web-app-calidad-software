#!/usr/bin/env bash

set -euo pipefail

umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT"

MODO="${1:-full}"

case "$MODO" in
    full|demo) ;;
    *)
        echo "Uso: run-selenium.sh full|demo"
        exit 2
        ;;
esac

unset QA19_TESTS QA20_TESTS

SALIDA="${QA_CI_REPORT_DIR:-$ROOT/qa/selenium/target-evidencias/CI}"

mkdir -p "$SALIDA"

PRIVADO="$(mktemp -d)"

ESTADO=0

ejecutar() {

    local suite="$1"
    local esperado="$2"

    shift 2

    local codigo=0
    local log="$PRIVADO/$suite.log"

    echo "===== $suite ====="

    # Evitar reutilizar resultados de ejecuciones anteriores.
    rm -rf "$ROOT/qa/selenium/target/surefire-reports"
    rm -rf "$ROOT/qa/selenium/target/qa-evidence"

    "$@" > "$log" 2>&1 || codigo=$?

    python3 qa/ci/collect-selenium.py \
        "$suite" \
        "$esperado" \
        "$codigo" \
        "$MODO" \
        "$log" \
        "$SALIDA" || ESTADO=1
}

if [[ "$MODO" == "full" ]]; then
    N19=10
    N20=9
else
    N19=2
    N20=3
fi

ejecutar QA-18 1 \
    qa/selenium/scripts/run.sh smoke

ejecutar QA-19 "$N19" \
    qa/selenium/scripts/run-qa19.sh "$MODO"

ejecutar QA-20 "$N20" \
    qa/selenium/scripts/run-qa20.sh "$MODO"

python3 - "$SALIDA" "$MODO" <<'PY'
import json
import sys
from pathlib import Path

base = Path(sys.argv[1])
modo = sys.argv[2]

suites = [
    json.loads((base / n / "resultado.json").read_text())
    for n in ("QA-18", "QA-19", "QA-20")
]

esperado = 20 if modo == "full" else 6

total = sum(s["ejecutadas"] for s in suites)
aprobadas = sum(s["aprobadas"] for s in suites)

correcto = (
    total == esperado
    and aprobadas == esperado
    and all(s["resultado"] == "PASS" for s in suites)
)

resumen = {
    "modo": modo,
    "esperadas": esperado,
    "ejecutadas": total,
    "aprobadas": aprobadas,
    "resultado": "PASS" if correcto else "FAIL",
    "suites": suites
}

(base / "resumen.json").write_text(
    json.dumps(resumen, indent=2) + "\n"
)

print(json.dumps(resumen, indent=2))

sys.exit(0 if correcto else 1)
PY

exit "$ESTADO"
