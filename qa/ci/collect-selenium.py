#!/usr/bin/env python3

import json
import shutil
import subprocess
import sys
import re
import xml.etree.ElementTree as ET

from pathlib import Path


suite, esperado, codigo, modo, log, salida = sys.argv[1:]

esperado = int(esperado)
codigo = int(codigo)

root = Path(__file__).resolve().parents[2]

target = root / "qa/selenium/target"

base = Path(salida) / suite

base.mkdir(parents=True, exist_ok=True)

texto = Path(log).read_text(errors="replace")

reportes = sorted(
    (target / "surefire-reports").glob("TEST-*.xml")
)

total = 0
fallos = 0
errores = 0
omitidos = 0
sanitizacion = bool(reportes)

for archivo in reportes:

    destino = base / "junit" / archivo.name

    proceso = subprocess.run(
        [
            sys.executable,
            str(root / "qa/ci/sanitize-junit.py"),
            str(archivo),
            str(destino)
        ]
    )

    if proceso.returncode != 0:

        sanitizacion = False

        destino.unlink(missing_ok=True)

        continue

    raiz = ET.parse(destino).getroot()

    casos = list(raiz.iter("testcase"))

    total += len(casos)

    fallos += sum(
        c.find("failure") is not None
        for c in casos
    )

    errores += sum(
        c.find("error") is not None
        for c in casos
    )

    omitidos += sum(
        c.find("skipped") is not None
        for c in casos
    )

if suite == "QA-18":

    limpieza = None
    escaneo = None

else:

    limpieza = (
        f"PASS: Limpieza {suite}" in texto
        and "Fixtures restantes: 0" in texto
    )

    escaneo = (
        "PASS: Escaneo de credenciales y tokens"
        in texto
    )

# Las capturas originales no se publican automaticamente.
# Se conservan en una carpeta privada para revision.
capturas = target / "qa-evidence"

privado = Path(log).parent / suite / "capturas"

cantidad_capturas = 0

if capturas.is_dir():

    imagenes = list(capturas.rglob("*.png"))

    cantidad_capturas = len(imagenes)

    for imagen in imagenes:

        destino = privado / imagen.relative_to(capturas)

        destino.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        shutil.copyfile(imagen, destino)

# Evidencia publica: solo capturas del smoke sin login.
if suite == "QA-18" and codigo == 0:

    imagen = capturas / "smoke-frontend.png"

    if imagen.is_file():

        shutil.copyfile(
            imagen,
            base / "smoke-frontend.png"
        )

correcto = (
    codigo == 0
    and total == esperado
    and fallos == 0
    and errores == 0
    and omitidos == 0
    and sanitizacion
    and limpieza is not False
    and escaneo is not False
)

resultado = {
    "suite": suite,
    "modo": modo,
    "esperadas": esperado,
    "ejecutadas": total,
    "aprobadas": total - fallos - errores - omitidos,
    "fallos": fallos,
    "errores": errores,
    "omitidas": omitidos,
    "codigo_salida": codigo,
    "limpieza": limpieza,
    "escaneo": escaneo,
    "sanitizacion": sanitizacion,
    "capturas_generadas": cantidad_capturas,
    "resultado": "PASS" if correcto else "FAIL"
}

(base / "resultado.json").write_text(
    json.dumps(resultado, indent=2) + "\n"
)

print(json.dumps(resultado, indent=2))

sys.exit(0 if correcto else 1)
