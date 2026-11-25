#!/usr/bin/env python3

import json
import re
import sys
import xml.etree.ElementTree as ET

from pathlib import Path


origen = Path(sys.argv[1])
destino = Path(sys.argv[2])

raiz = ET.parse(origen).getroot()

atributos_permitidos = {
    "name",
    "classname",
    "tests",
    "assertions",
    "failures",
    "errors",
    "skipped",
    "disabled",
    "time"
}

etiquetas_permitidas = {
    "testsuites",
    "testsuite",
    "testcase",
    "failure",
    "error",
    "skipped"
}


def reconstruir(elemento):

    if elemento.tag not in etiquetas_permitidas:
        return None

    nuevo = ET.Element(
        elemento.tag,
        {
            k: v
            for k, v in elemento.attrib.items()
            if k in atributos_permitidos
        }
    )

    if elemento.tag in ("failure", "error", "skipped"):

        nuevo.text = (
            "Detalle omitido en el reporte sanitizado."
        )

    for hijo in elemento:

        limpio = reconstruir(hijo)

        if limpio is not None:
            nuevo.append(limpio)

    return nuevo


limpio = reconstruir(raiz)

assert limpio is not None

contenido = ET.tostring(
    limpio,
    encoding="utf-8",
    xml_declaration=True
)

patrones = [
    rb"\b[0-9]+\|[A-Za-z0-9]{30,}\b",
    rb"Qa1#[A-Za-z0-9]{16,}",
    rb"(?i)Bearer\s+[A-Za-z0-9._-]+",
]

for patron in patrones:

    assert not re.search(
        patron, contenido
    ), "Posible secreto en reporte"

destino.parent.mkdir(
    parents=True,
    exist_ok=True
)

destino.write_bytes(contenido)

casos = list(limpio.iter("testcase"))

resultado = {
    "reporte": destino.name,
    "pruebas": len(casos),
    "fallos": sum(
        c.find("failure") is not None
        for c in casos
    ),
    "errores": sum(
        c.find("error") is not None
        for c in casos
    ),
    "omitidos": sum(
        c.find("skipped") is not None
        for c in casos
    )
}

print(json.dumps(resultado))

assert casos, "Reporte sin pruebas"
